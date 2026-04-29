import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../../socket';
import PlayerAvatar from '../../components/PlayerAvatar';
import '../../styles/host.css';

export default function Lobby() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [quizTitle, setQuizTitle] = useState('');

  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const handlePlayerJoined = ({ playerId, nickname, totalPlayers }) => {
      setPlayers(prev => [...prev, { id: playerId, nickname }]);
    };
    const handlePlayerLeft = ({ playerId, nickname, totalPlayers }) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    };
    const handleGameStarted = () => {
      navigate(`/host/game/${roomCode}`);
    };
    const handleRoomCreated = ({ quizTitle: title }) => {
      setQuizTitle(title);
    };

    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);
    socket.on('game_started', handleGameStarted);
    socket.on('room_created', handleRoomCreated);

    return () => {
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
      socket.off('game_started', handleGameStarted);
      socket.off('room_created', handleRoomCreated);
    };
  }, [roomCode, navigate]);

  const handleStart = () => {
    if (players.length === 0) {
      alert('Aguarde pelo menos um jogador entrar na sala.');
      return;
    }
    if (isStarting) return;
    setIsStarting(true);
    socket.emit('start_game', { roomCode });
  };

  const shareUrl = `${window.location.origin}/play/${roomCode}`;

  return (
    <div className="lobby-page">
      <div className="lobby-content">
        <div className="lobby-header animate-fade-in">
          <span className="lobby-badge">SALA DE ESPERA</span>
          {quizTitle && <h2 className="lobby-quiz-title">{quizTitle}</h2>}
        </div>

        <div className="lobby-code-section animate-slide-up">
          <p className="lobby-instruction text-secondary">Compartilhe este código com os jogadores:</p>
          <div className="lobby-code glass">{roomCode}</div>
          <p className="lobby-url text-secondary">
            ou acesse: <span className="lobby-url-link">{shareUrl}</span>
          </p>
        </div>

        <div className="lobby-players">
          <div className="lobby-player-count">
            <span className="player-count-number">{players.length}</span>
            <span className="text-secondary">jogador{players.length !== 1 ? 'es' : ''} conectado{players.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="lobby-player-grid">
            {players.map((player, i) => (
              <div
                key={player.id}
                className="lobby-player-chip animate-fade-in"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <PlayerAvatar nickname={player.nickname} size={40} />
                <span className="lobby-player-name">{player.nickname}</span>
              </div>
            ))}
          </div>

          {players.length === 0 && (
            <div className="lobby-waiting">
              <div className="lobby-waiting-dots">
                <span>.</span><span>.</span><span>.</span>
              </div>
              <p className="text-secondary">Aguardando jogadores entrarem...</p>
            </div>
          )}
        </div>

        <button
          className="btn btn-primary btn-large lobby-start-btn"
          onClick={handleStart}
          disabled={players.length === 0 || isStarting}
          id="btn-start-game"
        >
          🚀 Iniciar Jogo ({players.length} jogador{players.length !== 1 ? 'es' : ''})
        </button>
      </div>
    </div>
  );
}
