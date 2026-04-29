import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../../socket';
import PodiumStage from '../../components/PodiumStage';
import '../../styles/host.css';

export default function Podium() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [isLastQuestion, setIsLastQuestion] = useState(false);

  const [isNexting, setIsNexting] = useState(false);

  useEffect(() => {
    const handlePodiumData = (data) => {
      setRankings(data.rankings);
      if (data.isLastQuestion !== undefined) {
        setIsLastQuestion(data.isLastQuestion);
      }
    };
    const handleSendQuestion = () => navigate(`/host/game/${roomCode}`);
    const handleGameEnded = ({ finalRankings }) => { if (finalRankings) setRankings(finalRankings); };

    socket.on('podium_data', handlePodiumData);
    socket.on('send_question', handleSendQuestion);
    socket.on('game_ended', handleGameEnded);

    return () => {
      socket.off('podium_data', handlePodiumData);
      socket.off('send_question', handleSendQuestion);
      socket.off('game_ended', handleGameEnded);
    };
  }, [roomCode, navigate]);

  const handleNextQuestion = () => {
    if (isNexting) return;
    setIsNexting(true);
    socket.emit('next_question', { roomCode });
  };
  const handleEndGame = () => { socket.emit('end_game', { roomCode }); navigate('/dashboard'); };

  return (
    <div className="host-game-page">
      <div className="podium-page-content animate-fade-in">
        <h1 className="podium-title">🏆 Classificação</h1>
        <PodiumStage rankings={rankings} />
        <div className="podium-actions">
          {isLastQuestion ? (
            <button className="btn btn-primary btn-large" onClick={handleEndGame} id="btn-end-game">🏁 Finalizar Quizz</button>
          ) : (
            <button className="btn btn-primary btn-large" onClick={handleNextQuestion} disabled={isNexting} id="btn-next-from-podium">Próxima Pergunta →</button>
          )}
        </div>
      </div>
    </div>
  );
}
