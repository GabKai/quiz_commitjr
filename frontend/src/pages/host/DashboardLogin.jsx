import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/host.css';

const DASHBOARD_PASSWORD = '!Commitjr2026';

export default function DashboardLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!password.trim()) return setError('Digite a senha');
    setLoading(true);
    setTimeout(() => {
      if (password === DASHBOARD_PASSWORD) {
        sessionStorage.setItem('dashboard_auth', 'true');
        navigate('/dashboard');
      } else {
        setError('Senha incorreta. Acesso negado.');
        setPassword('');
      }
      setLoading(false);
    }, 600);
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <div className="player-page join-page">
      <div className="join-content animate-fade-in">
        <div className="join-logo">
          <span className="logo-icon-large">🔐</span>
          <h1 className="join-title">Área Restrita</h1>
          <p className="text-secondary" style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
            Acesso exclusivo para apresentadores
          </p>
        </div>
        <div className="join-form glass ghost-border">
          <div className="join-field">
            <label className="input-label">Senha de Acesso</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                className="input-field input-large"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite a senha"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyPress={handleKeyPress}
                autoFocus
                id="input-dashboard-password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  color: 'var(--on-surface-variant)',
                  padding: 0,
                  lineHeight: 1
                }}
                id="btn-toggle-password"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && <p className="join-error">{error}</p>}
          <button
            className="btn btn-primary btn-large join-btn"
            onClick={handleLogin}
            disabled={loading}
            id="btn-dashboard-login"
          >
            {loading ? 'Verificando...' : '🔓 Acessar Dashboard'}
          </button>
        </div>
        <p className="text-secondary join-hint">
          Somente apresentadores autorizados podem acessar esta área
        </p>
      </div>
    </div>
  );
}
