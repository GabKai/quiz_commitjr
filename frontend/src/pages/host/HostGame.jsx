import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket, { getCurrentQuestionData, clearCurrentQuestionData } from '../../socket';
import Timer from '../../components/Timer';
import AnswerButton from '../../components/AnswerButton';
import '../../styles/host.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function HostGame() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(() => {
    const cached = getCurrentQuestionData();
    return cached ? cached.question : null;
  });
  const [questionIndex, setQuestionIndex] = useState(() => {
    const cached = getCurrentQuestionData();
    return cached ? cached.questionIndex : 0;
  });
  const [totalQuestions, setTotalQuestions] = useState(() => {
    const cached = getCurrentQuestionData();
    return cached ? cached.totalQuestions : 0;
  });
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);

  useEffect(() => {
    // Caso o componente tenha montado um pouquinho depois do cache atualizar
    const cached = getCurrentQuestionData();
    if (cached && !question) {
      setQuestion(cached.question);
      setQuestionIndex(cached.questionIndex);
      setTotalQuestions(cached.totalQuestions);
    }

    const handleSendQuestion = (data) => {
      setQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setAnsweredCount(0);
      setTimeUp(false);
      setTimerRunning(true);
    };
    
    const handleAnswerCountUpdate = ({ answeredCount: count, totalPlayers: total }) => {
      setAnsweredCount(count);
      setTotalPlayers(total);
    };
    
    const handleTimeUp = () => {
      setTimeUp(true);
      setTimerRunning(false);
      setTimeout(() => {
        socket.emit('show_results', { roomCode });
        navigate(`/host/results/${roomCode}`);
      }, 1000);
    };
    
    const handleAllQuestionsDone = () => {
      socket.emit('end_game', { roomCode });
    };
    
    const handleGameEnded = () => {
      clearCurrentQuestionData();
      navigate('/dashboard');
    };

    socket.on('send_question', handleSendQuestion);
    socket.on('answer_count_update', handleAnswerCountUpdate);
    socket.on('time_up', handleTimeUp);
    socket.on('all_questions_done', handleAllQuestionsDone);
    socket.on('game_ended', handleGameEnded);

    return () => {
      socket.off('send_question', handleSendQuestion);
      socket.off('answer_count_update', handleAnswerCountUpdate);
      socket.off('time_up', handleTimeUp);
      socket.off('all_questions_done', handleAllQuestionsDone);
      socket.off('game_ended', handleGameEnded);
    };
  }, [roomCode, navigate]);

  const handleTimeUp = useCallback(() => {
    // O timer do servidor é autoritativo, este é só visual
  }, []);

  if (!question) {
    return (
      <div className="host-game-page">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Carregando pergunta...</p>
        </div>
      </div>
    );
  }

  const imageUrl = question.imageUrl ? `${API_URL}/uploads/${question.imageUrl}` : null;

  return (
    <div className="host-game-page">
      {/* Barra de progresso */}
      <div className="game-progress-bar">
        <div className="game-progress-info">
          <span>Pergunta {questionIndex + 1} de {totalQuestions}</span>
          <span className="text-secondary">{answeredCount} de {totalPlayers} responderam</span>
        </div>
        <div className="game-progress-track">
          <div
            className="game-progress-fill"
            style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="game-content">
        {/* Timer */}
        <div className="game-timer-area">
          <Timer
            duration={question.timeLimit}
            onTimeUp={handleTimeUp}
            isRunning={timerRunning}
          />
        </div>

        {/* Pergunta */}
        <h2 className="game-question-text animate-fade-in">{question.text}</h2>

        {/* Imagem da questão */}
        {imageUrl && (
          <div className="game-image-container animate-fade-in">
            <img src={imageUrl} alt="Imagem da questão" className="game-image" />
          </div>
        )}

        {/* Alternativas */}
        <div className={`game-options-grid game-options-${question.options.length}`}>
          {question.options.map((opt, i) => (
            <AnswerButton
              key={opt.id}
              colorIndex={opt.colorIndex}
              text={opt.text}
              imageUrl={opt.imageUrl ? `${API_URL}/uploads/${opt.imageUrl}` : null}
              disabled={true}
              showText={true}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
