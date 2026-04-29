import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente que protege rotas do dashboard.
 * Verifica se a sessão foi autenticada; caso contrário, redireciona ao login.
 */
export default function RequireDashboardAuth({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('dashboard_auth') !== 'true') {
      navigate('/host-login', { replace: true });
    }
  }, [navigate]);

  if (sessionStorage.getItem('dashboard_auth') !== 'true') return null;

  return children;
}
