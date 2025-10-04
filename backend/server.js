import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import conversationRoutes from './routes/conversation.js';
import mcpService from './services/mcpService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

app.use('/api/conversation', conversationRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mcpReady: mcpService.isReady,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Conversational AI Website Builder API',
    version: '2.0.0',
    features: ['Groq Conversational AI', 'OpenRouter Tool Execution', 'MCP Tools'],
    endpoints: {
      chat: 'POST /api/conversation/chat',
      streamChat: 'POST /api/conversation/chat/stream',
      history: 'GET /api/conversation/history/:sessionId',
      health: 'GET /health'
    }
  });
});

async function startServer() {
  try {
    console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
    console.log('🚀 Starting MCP Server...');
    
    await mcpService.startServer();

    app.listen(PORT, 'localhost', () => {
      console.log(`\n✅ Backend server running on http://localhost:${PORT}`);
      console.log(`✅ MCP Server ready with OpenRouter`);
      console.log(`✅ Groq conversational AI active`);
      console.log(`\nAPI Endpoints:`);
      console.log(`  POST /api/conversation/chat`);
      console.log(`  POST /api/conversation/chat/stream`);
      console.log(`  GET  /api/conversation/history/:sessionId`);
      console.log(`  GET  /health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  mcpService.stopServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  mcpService.stopServer();
  process.exit(0);
});

startServer();
