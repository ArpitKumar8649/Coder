import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import conversationRoutes from './routes/conversation.js';
import mcpService from './services/mcpService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 5000 : 3002);

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

app.use('/api/conversation', conversationRoutes);

if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

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
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  
  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️  Warning: GROQ_API_KEY not set. Conversational features will not work.');
    console.warn('   Get your free API key at: https://console.groq.com/');
  }
  
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('⚠️  Warning: OPENROUTER_API_KEY not set. Tool execution will not work.');
    console.warn('   Get your API key at: https://openrouter.ai/');
  }

  try {
    if (process.env.OPENROUTER_API_KEY) {
      console.log('🚀 Starting MCP Server...');
      await mcpService.startServer();
    } else {
      console.log('⚠️  Skipping MCP Server start (OPENROUTER_API_KEY not set)');
    }
  } catch (error) {
    console.error('⚠️  MCP Server failed to start:', error.message);
    console.error('   The server will continue, but tool execution will not work.');
  }

  const host = '0.0.0.0';
  app.listen(PORT, host, () => {
    console.log(`\n✅ Backend server running on http://${host}:${PORT}`);
    if (mcpService.isReady) {
      console.log(`✅ MCP Server ready with OpenRouter`);
    }
    if (process.env.GROQ_API_KEY) {
      console.log(`✅ Groq conversational AI active`);
    }
    console.log(`\nAPI Endpoints:`);
    console.log(`  POST /api/conversation/chat`);
    console.log(`  POST /api/conversation/chat/stream`);
    console.log(`  GET  /api/conversation/history/:sessionId`);
    console.log(`  GET  /health\n`);
    
    if (!process.env.GROQ_API_KEY || !process.env.OPENROUTER_API_KEY) {
      console.log('⚠️  Setup required: Add API keys to backend/.env or Replit Secrets');
      console.log('   See replit.md for setup instructions\n');
    }
  });
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
