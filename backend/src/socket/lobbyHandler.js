const { pool } = require('../config/database');

// Gera código de sala aleatório (6 caracteres alfanuméricos)
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem I, O, 0, 1 para evitar confusão
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const registerLobbyHandlers = (io, socket, rooms) => {

  // Host cria uma sala
  socket.on('create_room', async ({ quizId }) => {
    try {
      // Busca o quiz completo
      const [quizzes] = await pool.query('SELECT * FROM quizzes WHERE id = ?', [quizId]);
      if (quizzes.length === 0) {
        return socket.emit('error', { message: 'Quiz não encontrado' });
      }

      const [questions] = await pool.query(
        'SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index ASC',
        [quizId]
      );

      for (const question of questions) {
        const [options] = await pool.query(
          'SELECT * FROM options WHERE question_id = ? ORDER BY color_index ASC',
          [question.id]
        );
        question.options = options;
      }

      // Gera código único
      let roomCode = generateRoomCode();
      while (rooms.has(roomCode)) {
        roomCode = generateRoomCode();
      }

      // Cria sessão no banco
      await pool.query(
        'INSERT INTO game_sessions (quiz_id, room_code) VALUES (?, ?)',
        [quizId, roomCode]
      );

      // Cria sala em memória
      rooms.set(roomCode, {
        hostId: socket.id,
        quizId,
        quizTitle: quizzes[0].title,
        questions,
        players: [],
        currentQuestionIndex: -1,
        status: 'waiting',
        answers: new Map(), // questionIndex -> Map(playerId -> answer)
        scores: new Map(),  // playerId -> { nickname, totalPoints }
        timer: null
      });

      socket.join(roomCode);

      socket.emit('room_created', {
        roomCode,
        quizTitle: quizzes[0].title,
        totalQuestions: questions.length
      });

      console.log(`🏠 Sala ${roomCode} criada pelo host ${socket.id} (Quiz: ${quizzes[0].title})`);
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      socket.emit('error', { message: 'Erro ao criar sala' });
    }
  });

  // Jogador entra na sala
  socket.on('join_room', ({ roomCode, nickname }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      return socket.emit('error', { message: 'Sala não encontrada. Verifique o código.' });
    }

    if (room.status !== 'waiting') {
      return socket.emit('error', { message: 'Esta partida já está em andamento.' });
    }

    // Verifica nickname duplicado
    const existingPlayer = room.players.find(p => p.nickname.toLowerCase() === nickname.toLowerCase());
    if (existingPlayer) {
      return socket.emit('error', { message: 'Este nome já está em uso nesta sala.' });
    }

    // Adiciona jogador
    const player = {
      id: socket.id,
      nickname,
      joinedAt: Date.now()
    };

    room.players.push(player);
    room.scores.set(socket.id, { nickname, totalPoints: 0 });

    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.nickname = nickname;

    // Confirma entrada ao jogador
    socket.emit('joined_success', { roomCode, nickname });

    // Notifica o host
    io.to(room.hostId).emit('player_joined', {
      playerId: socket.id,
      nickname,
      totalPlayers: room.players.length
    });

    console.log(`👤 ${nickname} entrou na sala ${roomCode} (${room.players.length} jogadores)`);
  });

  // Jogador sai da sala
  socket.on('leave_room', () => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== -1) {
      const player = room.players[playerIndex];
      room.players.splice(playerIndex, 1);

      socket.leave(roomCode);

      io.to(room.hostId).emit('player_left', {
        playerId: socket.id,
        nickname: player.nickname,
        totalPlayers: room.players.length
      });

      console.log(`👋 ${player.nickname} saiu da sala ${roomCode}`);
    }
  });
};

module.exports = { registerLobbyHandlers };
