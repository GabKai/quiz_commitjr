import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../../socket';
import BarChart from '../../components/BarChart';
import '../../styles/host.css';

export default function RoundResults() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);

  useEffect(() => {
    const handleRoundResults = (data) => setResults(data);
    const handleSendQuestion = () => navigate(`/host/game/${roomCode}`);
    const handleAllQuestionsDone = () => socket.emit('end_game', { roomCode });
    const handleGameEnded = () => navigate('/dashboard');

    socket.on('round_results', handleRoundResults);
    socket.on('send_question', handleSendQuestion);
    socket.on('all_questions_done', handleAllQuestionsDone);
    socket.on('game_ended', handleGameEnded);

    return () => {
      socket.off('round_results', handleRoundResults);
      socket.off('send_question', handleSendQuestion);
      socket.off('all_questions_done', handleAllQuestionsDone);
      socket.off('game_ended', handleGameEnded);
    };
  }, [roomCode, navigate]);

  const handleShowPodium = () => { socket.emit('show_podium', { roomCode }); navigate(`/host/podium/${roomCode}`); };

  if (!results) return <div className="host-game-page"><div className="loading-state"><div className="loading-spinner" /><p>Calculando resultados...</p></div></div>;

  const correctCount = results.votes.find(v => v.isCorrect)?.count || 0;

  return (
    <div className="host-game-page">
      <div className="results-content animate-fade-in">
        <h1 className="results-title">Resultados</h1>
        <div className="results-summary">
          <span className="results-correct-count">{correctCount}</span>
          <span className="text-secondary">de {results.totalPlayers} acertaram</span>
        </div>
        <div className="results-chart-container glass ghost-border">
          <BarChart votes={results.votes} correctOptionId={results.correctOptionId} />
        </div>
        <div className="results-actions">
          <button className="btn btn-primary btn-large" onClick={handleShowPodium} id="btn-show-podium">Continuar →</button>
        </div>
      </div>
    </div>
  );
}
