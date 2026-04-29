import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../../socket';
import QuizCard from '../../components/QuizCard';
import '../../styles/host.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Dashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    socket.on('room_created', ({ roomCode }) => {
      navigate(`/lobby/${roomCode}`);
    });

    return () => {
      socket.off('room_created');
    };
  }, [navigate]);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/quizzes`);
      const data = await res.json();
      setQuizzes(data);
    } catch (err) {
      console.error('Erro ao buscar quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = (quizId) => {
    socket.emit('create_room', { quizId });
  };

  const handleEdit = (quizId) => {
    navigate(`/editar/${quizId}`);
  };

  const handleDelete = async (quizId) => {
    if (!confirm('Tem certeza que deseja excluir este quiz?')) return;
    try {
      await fetch(`${API_URL}/api/quizzes/${quizId}`, { method: 'DELETE' });
      setQuizzes(quizzes.filter(q => q.id !== quizId));
    } catch (err) {
      console.error('Erro ao excluir quiz:', err);
    }
  };

  return (
    <div className="host-layout">
      <aside className="sidebar glass">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">QuizPlay</span>
        </div>
        <nav className="sidebar-nav">
          <a href="/dashboard" className="sidebar-link active" id="nav-dashboard">
            <span className="nav-icon">📋</span>
            <span>Dashboard</span>
          </a>
          <a href="/criar" className="sidebar-link" id="nav-create">
            <span className="nav-icon">✨</span>
            <span>Criar Quiz</span>
          </a>
        </nav>
        <div className="sidebar-footer text-secondary">
          <small>QuizPlay v1.0</small>
        </div>
      </aside>

      <main className="host-main">
        <header className="host-header">
          <div>
            <h1 className="page-title">Seus Quizzes</h1>
            <p className="text-secondary">Crie, edite e inicie seus quizzes interativos</p>
          </div>
          <button
            className="btn btn-primary btn-large"
            onClick={() => navigate('/criar')}
            id="btn-create-quiz"
          >
            ✨ Criar Novo Quiz
          </button>
        </header>

        <section className="quiz-grid">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Carregando quizzes...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="empty-state animate-fade-in">
              <span className="empty-icon">🎯</span>
              <h2>Nenhum quiz encontrado</h2>
              <p className="text-secondary">Crie seu primeiro quiz e comece a desafiar seus amigos!</p>
              <button className="btn btn-primary btn-large" onClick={() => navigate('/criar')}>
                ✨ Criar Primeiro Quiz
              </button>
            </div>
          ) : (
            quizzes.map((quiz, i) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onStart={handleStart}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </section>
      </main>
    </div>
  );
}
