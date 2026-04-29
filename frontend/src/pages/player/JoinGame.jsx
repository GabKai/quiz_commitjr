import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../../socket';
import '../../styles/player.css';

export default function JoinGame() {
  const { roomCode: urlRoomCode } = useParams();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState(urlRoomCode || '');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    socket.on('joined_success', ({ roomCode: code }) => {
      setJoining(false);
      navigate(`/waiting/${code}`);
    });

    socket.on('error', ({ message }) => {
      setError(message);
      setJoining(false);
    });

    return () => { socket.off('joined_success'); socket.off('error'); };
  }, [navigate]);

  const handleJoin = () => {
    if (!roomCode.trim()) return setError('Digite o código da sala');
    if (!nickname.trim()) return setError('Digite seu nome');
    if (nickname.trim().length < 2) return setError('O nome deve ter pelo menos 2 caracteres');
    setError('');
    setJoining(true);
    socket.emit('join_room', { roomCode: roomCode.toUpperCase().trim(), nickname: nickname.trim() });
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleJoin(); };

  return (
    <div className="player-page join-page">
      <div className="join-content animate-fade-in">
        <div className="join-logo">
          <span className="logo-icon-large">⚡</span>
          <h1 className="join-title">QuizPlay</h1>
        </div>
        <div className="join-form glass ghost-border">
          <div className="join-field">
            <label className="input-label">Código da Sala</label>
            <input className="input-field input-large" type="text" placeholder="Ex: ABC123" value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} onKeyPress={handleKeyPress} maxLength={6} autoFocus id="input-room-code" />
          </div>
          <div className="join-field">
            <label className="input-label">Seu Nickname</label>
            <input className="input-field input-large" type="text" placeholder="Digite seu nome" value={nickname} onChange={e => setNickname(e.target.value)} onKeyPress={handleKeyPress} maxLength={20} id="input-nickname" />
          </div>
          {error && <p className="join-error">{error}</p>}
          <button className="btn btn-primary btn-large join-btn" onClick={handleJoin} disabled={joining} id="btn-join">
            {joining ? 'Entrando...' : '🚀 Entrar'}
          </button>
        </div>
        <p className="text-secondary join-hint">Aguarde o apresentador compartilhar o código da sala</p>
      </div>
    </div>
  );
}
