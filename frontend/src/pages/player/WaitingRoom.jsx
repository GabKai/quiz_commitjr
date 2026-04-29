import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../../socket';
import '../../styles/player.css';

export default function WaitingRoom() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleGameStarted = () => navigate(`/game/${roomCode}`);
    const handleSendQuestion = () => navigate(`/game/${roomCode}`);
    const handleGameEnded = () => navigate('/play');

    socket.on('game_started', handleGameStarted);
    socket.on('send_question', handleSendQuestion);
    socket.on('game_ended', handleGameEnded);

    return () => {
      socket.off('game_started', handleGameStarted);
      socket.off('send_question', handleSendQuestion);
      socket.off('game_ended', handleGameEnded);
    };
  }, [roomCode, navigate]);

  return (
    <div className="player-page waiting-page">
      <div className="waiting-content animate-fade-in">
        <div className="waiting-icon">⏳</div>
        <h1 className="waiting-title">Você está na sala!</h1>
        <p className="waiting-code">Sala: <strong>{roomCode}</strong></p>
        <div className="waiting-animation">
          <div className="waiting-pulse"></div>
        </div>
        <p className="text-secondary">Aguarde o apresentador iniciar o jogo...</p>
      </div>
    </div>
  );
}
