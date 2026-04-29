import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket, { getCurrentQuestionData, clearCurrentQuestionData } from '../../socket';
import AnswerButton from '../../components/AnswerButton';
import '../../styles/player.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function PlayerGame() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(() => getCurrentQuestionData());
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    const cached = getCurrentQuestionData();
    return cached ? cached.timeLimit : 0;
  });
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Caso o componente tenha montado um pouquinho depois do cache atualizar
    const cached = getCurrentQuestionData();
    if (cached && !question) {
      setQuestion(cached);
      setTimeLeft(cached.timeLimit);
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => { if (prev <= 1) { clearInterval(timerRef.current); return 0; } return prev - 1; });
        }, 1000);
      }
    } else if (question && !startTimeRef.current) {
      // Se a pergunta foi inicializada do cache no useState e o timer ainda não começou
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => { if (prev <= 1) { clearInterval(timerRef.current); return 0; } return prev - 1; });
      }, 1000);
    }

    const handleSendQuestion = (data) => {
      setQuestion(data);
      setSelectedOption(null);
      setAnswered(false);
      setTimeLeft(data.timeLimit);
      startTimeRef.current = Date.now();
      // Timer visual local
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => { if (prev <= 1) { clearInterval(timerRef.current); return 0; } return prev - 1; });
      }, 1000);
    };

    const handleAnswerReceived = () => setAnswered(true);
    const handleTimeUp = () => { setAnswered(true); clearInterval(timerRef.current); };
    const handleRoundFeedback = () => navigate(`/feedback/${roomCode}`);
    const handleGameEnded = () => {
      clearCurrentQuestionData();
      navigate('/play');
    };

    socket.on('send_question', handleSendQuestion);
    socket.on('answer_received', handleAnswerReceived);
    socket.on('time_up', handleTimeUp);
    socket.on('round_feedback', handleRoundFeedback);
    socket.on('game_ended', handleGameEnded);

    return () => {
      clearInterval(timerRef.current);
      socket.off('send_question', handleSendQuestion);
      socket.off('answer_received', handleAnswerReceived);
      socket.off('time_up', handleTimeUp);
      socket.off('round_feedback', handleRoundFeedback);
      socket.off('game_ended', handleGameEnded);
    };
  }, [roomCode, navigate]);

  const handleAnswer = (optionId) => {
    if (answered) return;
    const responseTimeMs = Date.now() - startTimeRef.current;
    setSelectedOption(optionId);
    socket.emit('submit_answer', { roomCode, optionId, responseTimeMs });
  };

  if (!question) return <div className="player-page"><div className="loading-state"><div className="loading-spinner" /><p>Aguardando pergunta...</p></div></div>;

  return (
    <div className="player-page game-page">
      <div className="player-game-header">
        <span className="player-question-counter">Pergunta {question.questionIndex + 1}/{question.totalQuestions}</span>
        <span className="player-timer" style={{ color: timeLeft <= 5 ? 'var(--error)' : 'var(--on-surface)' }}>{timeLeft}s</span>
      </div>
      <p className="player-question-text">{question.questionText}</p>
      {answered && <div className="player-answered-badge animate-fade-in">✓ Resposta enviada!</div>}
      {question.imageUrl && (
        <div className="player-question-image">
          <img src={`${API_URL}/uploads/${question.imageUrl}`} alt="Questão" />
        </div>
      )}
      <div className="player-options-grid">
        {question.options.map((opt) => (
          <AnswerButton key={opt.id} colorIndex={opt.colorIndex} imageUrl={opt.imageUrl ? `${API_URL}/uploads/${opt.imageUrl}` : null} onClick={() => handleAnswer(opt.id)} disabled={answered} selected={selectedOption === opt.id} showText={false} />
        ))}
      </div>
    </div>
  );
}
