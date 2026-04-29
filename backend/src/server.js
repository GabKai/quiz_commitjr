const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const { testConnection } = require('./config/database');
const quizRoutes = require('./routes/quizzes');
const questionRoutes = require('./routes/questions');
const uploadRoutes = require('./routes/uploadRoutes');
const { registerSocketHandlers } = require('./socket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir imagens de upload
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rotas da API
app.use('/api/quizzes', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Registrar handlers do Socket.io
registerSocketHandlers(io);

// Iniciar servidor
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await testConnection();
    console.log('✅ Conexão com MySQL estabelecida');

    server.listen(PORT, () => {
      console.log(`🚀 QuizPlay Backend rodando na porta ${PORT}`);
      console.log(`📡 Socket.io pronto para conexões`);
    });
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:', error.message);
    console.log('⏳ Tentando novamente em 5 segundos...');
    setTimeout(startServer, 5000);
  }
};

startServer();
