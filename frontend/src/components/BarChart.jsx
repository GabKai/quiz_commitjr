import '../styles/components.css';

const COLORS = [
  'var(--answer-0)', 'var(--answer-1)', 'var(--answer-2)',
  'var(--answer-3)', 'var(--answer-4)', 'var(--answer-5)'
];

export default function BarChart({ votes, correctOptionId }) {
  const maxVotes = Math.max(...votes.map(v => v.count), 1);

  return (
    <div className="bar-chart">
      {votes.map((vote, i) => {
        const heightPercent = (vote.count / maxVotes) * 100;
        const isCorrect = vote.optionId === correctOptionId;

        return (
          <div key={vote.optionId} className="bar-column">
            <span className="bar-count">{vote.count}</span>
            <div className="bar-track">
              <div
                className={`bar-fill ${isCorrect ? 'bar-correct' : 'bar-wrong'}`}
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: COLORS[vote.colorIndex] || COLORS[i],
                  animationDelay: `${i * 0.1}s`
                }}
              />
            </div>
            <span className="bar-label">
              {isCorrect && <span className="bar-check">✓</span>}
              {vote.optionText || `Opção ${i + 1}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
