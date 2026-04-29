import '../styles/components.css';

export default function PlayerAvatar({ nickname, size = 48 }) {
  const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(nickname)}`;

  return (
    <div className="player-avatar" style={{ width: size, height: size }}>
      <img
        src={avatarUrl}
        alt={nickname}
        className="player-avatar-img"
        onError={(e) => {
          // Fallback: iniciais em círculo colorido
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      <div className="player-avatar-fallback" style={{ display: 'none', width: size, height: size }}>
        {nickname.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}
