# AI Website Builder - Conversational Interface

A conversational AI website builder powered by Groq, OpenRouter, and MCP tools.

## Architecture

- **Frontend**: React + Vite (port 5000)
- **Backend**: Node.js/Express (port 3002)
- **MCP Server**: vibe-coder-mcp (port 3001)

## Tech Stack

- **Groq SDK**: Fast, free conversational AI (llama-3.3-70b-versatile)
- **OpenRouter**: Specialized model routing for tasks
- **MCP Tools**: Code generation via vibe-coder-mcp
- **React**: Chat interface with streaming responses
- **Express**: Backend API server

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

Add your API keys to the Replit Secrets:
1. Click on "Tools" → "Secrets" in the Replit sidebar
2. Add `GROQ_API_KEY` with your Groq API key
3. Add `OPENROUTER_API_KEY` with your OpenRouter API key

Or update `backend/.env` file:
```env
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

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

Typical website generation costs ~$0.07 (OpenRouter only, Groq is free!)

## How It Works

1. User describes their website idea in the chat
2. Groq AI understands intent and selects appropriate tools
3. MCP tools execute via OpenRouter with specialized models
4. AI explains reasoning and generates complete code
5. Generated projects saved to `generated-projects/`

## Development

The frontend is configured to work with Replit's proxy system:
- Vite server binds to `0.0.0.0:5000`
- Backend API runs on `localhost:3002`
- Allows all hosts for Replit iframe preview
