import '../styles/components.css';

export default function QuizCard({ quiz, onStart, onEdit, onDelete }) {
  return (
    <div className="quiz-card glass ghost-border animate-fade-in">
      <div className="quiz-card-body">
        <h3 className="quiz-card-title">{quiz.title}</h3>
        {quiz.description && (
          <p className="quiz-card-desc text-secondary">{quiz.description}</p>
        )}
        <div className="quiz-card-meta text-secondary">
          <span>{quiz.question_count || 0} pergunta{(quiz.question_count || 0) !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{new Date(quiz.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
      <div className="quiz-card-actions">
        <button className="btn btn-primary" onClick={() => onStart(quiz.id)} id={`start-quiz-${quiz.id}`}>
          Iniciar Jogo
        </button>
        <button className="btn btn-ghost" onClick={() => onEdit(quiz.id)} id={`edit-quiz-${quiz.id}`}>
          Editar
        </button>
        <button className="btn btn-danger-ghost" onClick={() => onDelete(quiz.id)} id={`delete-quiz-${quiz.id}`}>
          Excluir
        </button>
      </div>
    </div>
  );
}
