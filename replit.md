# AI Website Builder - Conversational Interface

A conversational AI website builder powered by Groq, OpenRouter, and MCP tools.

## Architecture

- **Frontend**: React + Vite (port 5000)
- **Backend**: Node.js/Express (port 3002)
- **MCP Server**: vibe-coder-mcp (port 3000)

## Tech Stack

- **Groq SDK**: Fast, free conversational AI (llama-3.3-70b-versatile)
- **OpenRouter**: Free model routing for tasks (x-ai/grok-beta:free)
- **MCP Tools**: Code generation via vibe-coder-mcp
- **React**: Chat interface with streaming responses
- **Express**: Backend API server

## Current Configuration (October 2025)

✅ **API Keys**: Configured in Replit Secrets
✅ **OpenRouter Model**: Using `x-ai/grok-beta:free` (completely free!)
✅ **Groq Model**: Using `llama-3.3-70b-versatile` (free tier)
✅ **Frontend**: Running on port 5000 with HMR enabled
✅ **Backend**: Running on port 3002
✅ **MCP Server**: Active on port 3000

## Required API Keys

Before running the application, you need to obtain API keys:

### 1. Groq API Key (Free)
- Sign up at: https://console.groq.com/
- Get your API key from the dashboard
- Free tier with generous limits

### 2. OpenRouter API Key (Pay per use)
- Sign up at: https://openrouter.ai/
- Get your API key
- Add credits (~$10 recommended to start)

### Setting up API Keys

**Important: Use Replit Secrets for API keys (never commit keys to the repository)**

Add your API keys to Replit Secrets:
1. Click on "Tools" → "Secrets" in the Replit sidebar
2. Add `GROQ_API_KEY` with your Groq API key
3. Add `OPENROUTER_API_KEY` with your OpenRouter API key

The backend automatically reads these from the environment.

## Project Structure

```
.
├── backend/
│   ├── services/
│   │   ├── groqService.js       # Groq conversational AI
│   │   └── mcpService.js        # MCP tool execution
│   ├── controllers/
│   │   └── conversationController.js
│   ├── routes/
│   │   └── conversation.js
│   ├── server.js
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatInterface.jsx
│   │   ├── services/
│   │   │   └── conversationService.js
│   │   └── App.jsx
│   └── vite.config.js
└── generated-projects/          # Generated website code output
```

## Features

- Natural conversation with Groq AI
- Research best practices with Perplexity
- Generate PRDs with Claude 3.5 Sonnet
- Create user stories and task lists
- Full-stack code generation with Gemini Flash
- Real-time streaming responses
- Session-based conversation history

## Cost Estimate

**Current Setup: 100% FREE!** 🎉
- Groq: Free tier
- OpenRouter: Using free model (x-ai/grok-beta:free)
- Total cost per website generation: $0.00

## How It Works

1. User describes their website idea in the chat
2. Groq AI understands intent and selects appropriate tools
3. MCP tools execute via OpenRouter with specialized models
4. AI explains reasoning and generates complete code
5. Generated projects saved to `generated-projects/`

## Development

The frontend is configured to work with Replit's proxy system:
- Vite server binds to `0.0.0.0:5000`
- Backend API runs on port 3002
- Allows `.replit.dev` and `.repl.co` hosts for Replit iframe preview
- HMR configured with WSS protocol for live reloading

## Deployment

Configured for VM deployment:
- **Build**: `npm run build --prefix frontend`
- **Run**: `node backend/server.js`
- Production mode serves the built frontend from the backend

## How to Use

1. Open the application in the Replit preview
2. Type your website idea in the chat (e.g., "make an amazon clone")
3. The AI will ask clarifying questions - answer them in the chat
4. The system will:
   - Research best practices
   - Generate a PRD (Product Requirements Document)
   - Create user stories
   - Generate task lists
   - Build complete full-stack code
5. Generated code will be saved to `generated-projects/` directory
