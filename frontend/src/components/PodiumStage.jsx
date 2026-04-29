import PlayerAvatar from './PlayerAvatar';
import '../styles/components.css';

export default function PodiumStage({ rankings }) {
  if (!rankings || rankings.length === 0) return null;

  // Reorganiza para exibição: [2º, 1º, 3º]
  const podiumOrder = [];
  if (rankings[1]) podiumOrder.push({ ...rankings[1], place: 2 });
  if (rankings[0]) podiumOrder.push({ ...rankings[0], place: 1 });
  if (rankings[2]) podiumOrder.push({ ...rankings[2], place: 3 });

  const placeColors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  const placeHeights = { 1: '180px', 2: '130px', 3: '100px' };

  return (
    <div className="podium-container">
      <div className="podium-stage">
        {podiumOrder.map((player) => (
          <div key={player.playerId || player.nickname} className="podium-position animate-slide-up" style={{ animationDelay: `${player.place * 0.2}s` }}>
            <PlayerAvatar nickname={player.nickname} size={64} />
            <span className="podium-nickname">{player.nickname}</span>
            <span className="podium-points">{player.totalPoints.toLocaleString('pt-BR')} pts</span>
            <div
              className="podium-bar"
              style={{
                height: placeHeights[player.place],
                background: `linear-gradient(180deg, ${placeColors[player.place]}33, ${placeColors[player.place]}11)`,
                borderTop: `3px solid ${placeColors[player.place]}`
              }}
            >
              <span className="podium-place" style={{ color: placeColors[player.place] }}>
                {player.place}º
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Ranking restante */}
      {rankings.length > 3 && (
        <div className="podium-rest">
          {rankings.slice(3).map((player, i) => (
            <div key={player.playerId || player.nickname} className="podium-rest-item glass ghost-border animate-fade-in" style={{ animationDelay: `${(i + 4) * 0.1}s` }}>
              <span className="podium-rest-position">{i + 4}º</span>
              <PlayerAvatar nickname={player.nickname} size={32} />
              <span className="podium-rest-name">{player.nickname}</span>
              <span className="podium-rest-points">{player.totalPoints.toLocaleString('pt-BR')} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
