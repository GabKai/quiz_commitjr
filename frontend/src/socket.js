import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

const socket = io(WS_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

// Cache global da última pergunta para evitar condições de corrida na navegação
let currentQuestionData = null;

socket.on('send_question', (data) => {
  currentQuestionData = data;
});

export const getCurrentQuestionData = () => currentQuestionData;
export const clearCurrentQuestionData = () => { currentQuestionData = null; };

socket.on('connect', () => {
  console.log('🔌 Conectado ao servidor:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado do servidor');
});

socket.on('error', (data) => {
  console.error('⚠️ Erro do servidor:', data.message);
});

export default socket;

