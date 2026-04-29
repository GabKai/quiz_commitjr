import '../styles/components.css';

const COLORS = ['var(--answer-0)', 'var(--answer-1)', 'var(--answer-2)', 'var(--answer-3)', 'var(--answer-4)', 'var(--answer-5)'];
const SHAPES = ['▲', '◆', '●', '■', '★', '⬡'];

export default function AnswerButton({ colorIndex, text, imageUrl, onClick, disabled, selected, showText = true }) {
  const color = COLORS[colorIndex] || COLORS[0];
  const shape = SHAPES[colorIndex] || SHAPES[0];

  return (
    <button
      className={`answer-btn ${selected ? 'answer-btn-selected' : ''} ${disabled ? 'answer-btn-disabled' : ''} ${imageUrl ? 'has-image' : ''}`}
      style={{ backgroundColor: color }}
      onClick={onClick}
      disabled={disabled}
      id={`answer-btn-${colorIndex}`}
    >
      <span className="answer-shape">{shape}</span>
      <div className="answer-content">
        {imageUrl && <img src={imageUrl} alt="Alternativa" className="answer-image" />}
        {showText && text && <span className="answer-text">{text}</span>}
      </div>
    </button>
  );
}
