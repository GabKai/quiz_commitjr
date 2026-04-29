const { pool } = require('../config/database');

// Calcula pontuação baseada na velocidade
const calculatePoints = (basePoints, responseTimeMs, timeLimitMs) => {
  const factor = 1 - (responseTimeMs / timeLimitMs) * 0.5;
  return Math.round(basePoints * Math.max(factor, 0.5));
};

const registerGameHandlers = (io, socket, rooms) => {

  // Host inicia o jogo
  socket.on('start_game', async ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || socket.id !== room.hostId) return;
    if (room.players.length === 0) {
      return socket.emit('error', { message: 'Nenhum jogador na sala.' });
    }

    room.status = 'playing';
    room.currentQuestionIndex = -1;

    // Atualiza sessão no banco
    await pool.query(
      "UPDATE game_sessions SET status = 'playing', started_at = NOW() WHERE room_code = ?",
      [roomCode]
    );

    // Sinaliza início
    io.to(roomCode).emit('game_started', {
      questionIndex: 0,
      totalQuestions: room.questions.length
    });

    console.log(`🎮 Jogo iniciado na sala ${roomCode} com ${room.players.length} jogadores`);

    // Envia primeira pergunta automaticamente
    sendQuestion(io, room, roomCode);
  });

  // Host solicita próxima pergunta
  socket.on('next_question', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || socket.id !== room.hostId) return;

    sendQuestion(io, room, roomCode);
  });

  // Jogador envia resposta
  socket.on('submit_answer', async ({ roomCode, optionId, responseTimeMs }) => {
    const room = rooms.get(roomCode);
    if (!room || room.status !== 'playing') return;

    const qi = room.currentQuestionIndex;
    if (qi < 0 || qi >= room.questions.length) return;

    // Verifica se já respondeu
    const questionAnswers = room.answers.get(qi) || new Map();
    if (questionAnswers.has(socket.id)) {
      return socket.emit('answer_received', { status: 'already_answered' });
    }

    const question = room.questions[qi];
    const selectedOption = question.options.find(o => o.id === optionId);
    const isCorrect = selectedOption ? selectedOption.is_correct === 1 : false;
    const timeLimitMs = question.time_limit * 1000;
    const pointsEarned = isCorrect ? calculatePoints(question.points, responseTimeMs, timeLimitMs) : 0;

    // Registra resposta
    questionAnswers.set(socket.id, {
      optionId,
      responseTimeMs,
      isCorrect,
      pointsEarned
    });
    room.answers.set(qi, questionAnswers);

    // Atualiza pontuação total
    const playerScore = room.scores.get(socket.id);
    if (playerScore) {
      playerScore.totalPoints += pointsEarned;
    }

    // Salva no banco
    try {
      const [sessions] = await pool.query(
        'SELECT id FROM game_sessions WHERE room_code = ?',
        [roomCode]
      );
      if (sessions.length > 0) {
        await pool.query(
          'INSERT INTO player_answers (game_session_id, player_id, nickname, question_id, option_id, response_time_ms, points_earned) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [sessions[0].id, socket.id, socket.nickname || 'Anônimo', question.id, optionId, responseTimeMs, pointsEarned]
        );
      }
    } catch (err) {
      console.error('Erro ao salvar resposta:', err);
    }

    // Confirma ao jogador
    socket.emit('answer_received', { status: 'ok' });

    // Atualiza contador para o host
    io.to(room.hostId).emit('answer_count_update', {
      answeredCount: questionAnswers.size,
      totalPlayers: room.players.length
    });

    // Se todos responderam, para o timer
    if (questionAnswers.size >= room.players.length) {
      if (room.timer) {
        clearTimeout(room.timer);
        room.timer = null;
      }
      io.to(roomCode).emit('time_up', { questionIndex: qi });
    }
  });

  // Host solicita resultados da rodada
  socket.on('show_results', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || socket.id !== room.hostId) return;

    const qi = room.currentQuestionIndex;
    const question = room.questions[qi];
    const questionAnswers = room.answers.get(qi) || new Map();

    // Conta votos por opção
    const votes = question.options.map(opt => ({
      optionId: opt.id,
      optionText: opt.option_text,
      colorIndex: opt.color_index,
      count: 0,
      isCorrect: opt.is_correct === 1
    }));

    for (const [, answer] of questionAnswers) {
      const vote = votes.find(v => v.optionId === answer.optionId);
      if (vote) vote.count++;
    }

    const correctOptionId = question.options.find(o => o.is_correct === 1)?.id;

    // Scores da rodada
    const scores = [];
    for (const [playerId, score] of room.scores) {
      const answer = questionAnswers.get(playerId);
      scores.push({
        nickname: score.nickname,
        pointsEarned: answer ? answer.pointsEarned : 0,
        totalPoints: score.totalPoints
      });
    }
    scores.sort((a, b) => b.totalPoints - a.totalPoints);

    // Envia para o host
    io.to(room.hostId).emit('round_results', {
      correctOptionId,
      votes,
      scores,
      totalAnswered: questionAnswers.size,
      totalPlayers: room.players.length,
      isLastQuestion: qi === room.questions.length - 1
    });

    // Envia feedback individual para cada jogador
    for (const player of room.players) {
      const answer = questionAnswers.get(player.id);
      const playerScore = room.scores.get(player.id);

      io.to(player.id).emit('round_feedback', {
        correct: answer ? answer.isCorrect : false,
        pointsEarned: answer ? answer.pointsEarned : 0,
        totalPoints: playerScore ? playerScore.totalPoints : 0,
        correctOptionId,
        answered: !!answer,
        isLastQuestion: qi === room.questions.length - 1
      });
    }
  });

  // Host solicita pódio
  socket.on('show_podium', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || socket.id !== room.hostId) return;

    const rankings = [];
    for (const [playerId, score] of room.scores) {
      rankings.push({
        playerId,
        nickname: score.nickname,
        totalPoints: score.totalPoints
      });
    }

    rankings.sort((a, b) => b.totalPoints - a.totalPoints);
    rankings.forEach((r, i) => r.position = i + 1);

    const qi = room.currentQuestionIndex;
    const isLastQuestion = qi >= room.questions.length - 1;

    io.to(room.hostId).emit('podium_data', { rankings, isLastQuestion });
  });

  // Host encerra o jogo
  socket.on('end_game', async ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || socket.id !== room.hostId) return;

    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }

    room.status = 'finished';

    // Rankings finais
    const rankings = [];
    for (const [playerId, score] of room.scores) {
      rankings.push({
        playerId,
        nickname: score.nickname,
        totalPoints: score.totalPoints
      });
    }
    rankings.sort((a, b) => b.totalPoints - a.totalPoints);
    rankings.forEach((r, i) => r.position = i + 1);

    // Atualiza banco
    try {
      await pool.query(
        "UPDATE game_sessions SET status = 'finished', finished_at = NOW() WHERE room_code = ?",
        [roomCode]
      );
    } catch (err) {
      console.error('Erro ao finalizar sessão:', err);
    }

    // Notifica host
    io.to(room.hostId).emit('game_ended', { finalRankings: rankings });

    // Notifica cada jogador
    for (const r of rankings) {
      io.to(r.playerId).emit('game_ended', {
        position: r.position,
        totalPoints: r.totalPoints,
        nickname: r.nickname
      });
    }

    // Limpa sala após um delay
    setTimeout(() => {
      rooms.delete(roomCode);
      console.log(`🗑️ Sala ${roomCode} removida após finalização`);
    }, 30000);

    console.log(`🏁 Jogo finalizado na sala ${roomCode}`);
  });
};

// Envia a próxima pergunta
const sendQuestion = (io, room, roomCode) => {
  room.currentQuestionIndex++;
  const qi = room.currentQuestionIndex;

  if (qi >= room.questions.length) {
    // Todas as perguntas foram enviadas
    io.to(room.hostId).emit('all_questions_done', {
      totalQuestions: room.questions.length
    });
    return;
  }

  const question = room.questions[qi];

  // Envia dados completos para o host (com textos das alternativas)
  io.to(room.hostId).emit('send_question', {
    question: {
      id: question.id,
      text: question.question_text,
      imageUrl: question.image_url,
      options: question.options.map(o => ({
        id: o.id,
        text: o.option_text,
        imageUrl: o.image_url,
        colorIndex: o.color_index
      })),
      timeLimit: question.time_limit,
      points: question.points
    },
    questionIndex: qi,
    totalQuestions: room.questions.length
  });

  // Envia dados limitados para os jogadores
  for (const player of room.players) {
    io.to(player.id).emit('send_question', {
      questionText: question.question_text,
      imageUrl: question.image_url,
      options: question.options.map(o => ({
        id: o.id,
        imageUrl: o.image_url,
        colorIndex: o.color_index
      })),
      timeLimit: question.time_limit,
      questionIndex: qi,
      totalQuestions: room.questions.length
    });
  }

  // Inicializa mapa de respostas da rodada
  room.answers.set(qi, new Map());

  // Timer server-side autoritativo
  const timeLimitMs = question.time_limit * 1000;
  room.timer = setTimeout(() => {
    io.to(roomCode).emit('time_up', { questionIndex: qi });
    room.timer = null;
    console.log(`⏰ Tempo esgotado na pergunta ${qi + 1} da sala ${roomCode}`);
  }, timeLimitMs);

  console.log(`❓ Pergunta ${qi + 1}/${room.questions.length} enviada na sala ${roomCode} (${question.time_limit}s)`);
};

module.exports = { registerGameHandlers };
