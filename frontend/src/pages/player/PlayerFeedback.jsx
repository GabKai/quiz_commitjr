import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../../socket';
import '../../styles/player.css';

export default function PlayerFeedback() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const handleRoundFeedback = (data) => setFeedback(data);
    const handleSendQuestion = () => navigate(`/game/${roomCode}`);
    const handleGameEnded = (data) => {
      setFeedback(prev => ({ ...prev, gameOver: true, position: data.position, totalPoints: data.totalPoints }));
      setTimeout(() => navigate('/play'), 5000);
    };

    socket.on('round_feedback', handleRoundFeedback);
    socket.on('send_question', handleSendQuestion);
    socket.on('game_ended', handleGameEnded);

    return () => {
      socket.off('round_feedback', handleRoundFeedback);
      socket.off('send_question', handleSendQuestion);
      socket.off('game_ended', handleGameEnded);
    };
  }, [roomCode, navigate]);

  if (!feedback) return <div className="player-page"><div className="loading-state"><div className="loading-spinner" /><p>Aguardando resultado...</p></div></div>;

  if (feedback.gameOver) {
    return (
      <div className="player-page feedback-page">
        <div className="feedback-content animate-fade-in">
          <span className="feedback-icon-large">🏁</span>
          <h1 className="feedback-title">Fim de Jogo!</h1>
          <p className="feedback-position">Você ficou em <strong>{feedback.position}º lugar</strong></p>
          <p className="feedback-total-points">{feedback.totalPoints?.toLocaleString('pt-BR')} pontos</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`player-page feedback-page ${feedback.correct ? 'feedback-correct' : feedback.answered === false ? 'feedback-timeout' : 'feedback-wrong'}`}>
      <div className="feedback-content animate-fade-in">
        {feedback.correct ? (
          <>
            <span className="feedback-icon-large">🎉</span>
            <h1 className="feedback-title feedback-title-correct">Acertou!</h1>
            <p className="feedback-points">+{feedback.pointsEarned.toLocaleString('pt-BR')} pontos</p>
          </>
        ) : feedback.answered === false ? (
          <>
            <span className="feedback-icon-large">⏰</span>
            <h1 className="feedback-title feedback-title-timeout">Tempo Esgotado!</h1>
            <p className="feedback-points">0 pontos</p>
          </>
        ) : (
          <>
            <span className="feedback-icon-large">😔</span>
            <h1 className="feedback-title feedback-title-wrong">Errou!</h1>
            <p className="feedback-points">0 pontos</p>
          </>
        )}
        <div className="feedback-total">
          <span className="text-secondary">Pontuação total:</span>
          <span className="feedback-total-value">{feedback.totalPoints.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}
