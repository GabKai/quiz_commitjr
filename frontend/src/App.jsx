import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/host/Dashboard';
import DashboardLogin from './pages/host/DashboardLogin';
import CreateQuiz from './pages/host/CreateQuiz';
import Lobby from './pages/host/Lobby';
import HostGame from './pages/host/HostGame';
import RoundResults from './pages/host/RoundResults';
import Podium from './pages/host/Podium';
import JoinGame from './pages/player/JoinGame';
import WaitingRoom from './pages/player/WaitingRoom';
import PlayerGame from './pages/player/PlayerGame';
import PlayerFeedback from './pages/player/PlayerFeedback';
import RequireDashboardAuth from './components/RequireDashboardAuth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página inicial: tela de entrada para jogadores */}
        <Route path="/" element={<JoinGame />} />
        <Route path="/play" element={<JoinGame />} />
        <Route path="/play/:roomCode" element={<JoinGame />} />

        {/* Login do host (senha obrigatória) */}
        <Route path="/host-login" element={<DashboardLogin />} />

        {/* Rotas protegidas do Host */}
        <Route path="/dashboard" element={<RequireDashboardAuth><Dashboard /></RequireDashboardAuth>} />
        <Route path="/criar" element={<RequireDashboardAuth><CreateQuiz /></RequireDashboardAuth>} />
        <Route path="/editar/:id" element={<RequireDashboardAuth><CreateQuiz /></RequireDashboardAuth>} />
        <Route path="/lobby/:roomCode" element={<RequireDashboardAuth><Lobby /></RequireDashboardAuth>} />
        <Route path="/host/game/:roomCode" element={<RequireDashboardAuth><HostGame /></RequireDashboardAuth>} />
        <Route path="/host/results/:roomCode" element={<RequireDashboardAuth><RoundResults /></RequireDashboardAuth>} />
        <Route path="/host/podium/:roomCode" element={<RequireDashboardAuth><Podium /></RequireDashboardAuth>} />

        {/* Rotas do Jogador */}
        <Route path="/waiting/:roomCode" element={<WaitingRoom />} />
        <Route path="/game/:roomCode" element={<PlayerGame />} />
        <Route path="/feedback/:roomCode" element={<PlayerFeedback />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
