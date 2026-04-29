const { registerLobbyHandlers } = require('./lobbyHandler');
const { registerGameHandlers } = require('./gameHandler');

// Estado global das salas (em memória)
const rooms = new Map();

const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Jogador conectado: ${socket.id}`);

    registerLobbyHandlers(io, socket, rooms);
    registerGameHandlers(io, socket, rooms);

    socket.on('disconnect', () => {
      console.log(`❌ Jogador desconectado: ${socket.id}`);

      // Remove jogador de qualquer sala que esteja
      for (const [roomCode, room] of rooms) {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          const player = room.players[playerIndex];
          room.players.splice(playerIndex, 1);

          // Notifica o host
          if (room.hostId) {
            io.to(room.hostId).emit('player_left', {
              playerId: socket.id,
              nickname: player.nickname,
              totalPlayers: room.players.length
            });
          }

          console.log(`👋 ${player.nickname} saiu da sala ${roomCode}`);
        }

        // Remove sala se vazia e host desconectou
        if (socket.id === room.hostId) {
          // Notifica todos os jogadores
          io.to(roomCode).emit('game_ended', {
            position: 0,
            totalPoints: 0,
            nickname: '',
            message: 'O apresentador encerrou a sessão'
          });
          rooms.delete(roomCode);
          console.log(`🗑️ Sala ${roomCode} removida (host desconectou)`);
        }
      }
    });
  });
};

module.exports = { registerSocketHandlers, rooms };
