import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPService {
  constructor() {
    this.mcpProcess = null;
    this.ws = null;
    this.isReady = false;
    this.isConnected = false;
    this.requestId = 0;
    this.pendingRequests = new Map();
    
    this.modelConfig = {
      research: process.env.RESEARCH_MODEL || 'x-ai/grok-beta:free',
      prd: process.env.PRD_MODEL || 'x-ai/grok-beta:free',
      userStories: process.env.USER_STORIES_MODEL || 'x-ai/grok-beta:free',
      taskList: process.env.TASK_LIST_MODEL || 'x-ai/grok-beta:free',
      codeGeneration: process.env.CODE_GENERATION_MODEL || 'x-ai/grok-beta:free'
    };
  }

  async startServer() {
    if (this.mcpProcess) {
      console.log('MCP Server already running');
      return;
    }

    console.log('🚀 Starting MCP Server with OpenRouter...');
    console.log('📊 Model Configuration:');
    console.log(`   Research: ${this.modelConfig.research}`);
    console.log(`   PRD: ${this.modelConfig.prd}`);
    console.log(`   User Stories: ${this.modelConfig.userStories}`);
    console.log(`   Task List: ${this.modelConfig.taskList}`);
    console.log(`   Code Gen: ${this.modelConfig.codeGeneration}`);

    this.mcpProcess = spawn('node', [
      path.resolve(__dirname, '../node_modules/vibe-coder-mcp/build/index.js')
    ], {
      env: {
        ...process.env,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
        VIBE_PROJECT_ROOT: path.resolve(__dirname, process.env.VIBE_PROJECT_ROOT || '../generated-projects'),
        VIBE_CODER_OUTPUT_DIR: path.resolve(__dirname, process.env.VIBE_CODER_OUTPUT_DIR || '../generated-projects/VibeCoderOutput'),
        GEMINI_MODEL: this.modelConfig.codeGeneration,
        LOG_LEVEL: 'error',
        MCP_TRANSPORT: 'stdio',
        NODE_NO_WARNINGS: '1'
      },
      stdio: ['pipe', 'pipe', 'ignore']
    });

    this.mcpProcess.on('close', (code) => {
      console.log(`MCP Server exited with code ${code}`);
      this.mcpProcess = null;
      this.isReady = false;
      this.closeConnection();
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.isReady = true;
    console.log('✅ MCP Server is ready!');
    
    await this.connectWebSocket();
  }


  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      console.log('[MCP] Connecting via stdio...');
      
      this.ws = this.mcpProcess.stdin;
      this.isConnected = true;

      this.mcpProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const message = JSON.parse(line);
            
            if (message.jsonrpc === '2.0') {
              if (message.id && this.pendingRequests.has(message.id)) {
                const { resolve: res, reject: rej } = this.pendingRequests.get(message.id);
                this.pendingRequests.delete(message.id);
                
                if (message.error) {
                  rej(new Error(message.error.message || 'Unknown error'));
                } else {
                  res(message.result);
                }
              }
            }
          } catch (e) {
            console.error('[MCP] Parse error:', e.message);
          }
        }
      });

      console.log('✅ Connected to MCP via stdio');
      
      this.initialize().then(() => {
        console.log('✅ MCP initialized and ready');
        resolve();
      }).catch((error) => {
        console.error('[MCP] Initialization error:', error.message);
        console.log('⚠️  MCP will be available but may not work properly');
        resolve();
      });
    });
  }

  async initialize() {
    try {
      const initResult = await this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'ai-website-builder',
          version: '1.0.0'
        }
      });
      
      console.log('✅ MCP session initialized');
      
      await this.sendNotification('initialized', {});
      
      const toolsResult = await this.sendRequest('tools/list', {});
      const toolNames = toolsResult.tools?.map(t => t.name).join(', ') || 'none';
      console.log(`📋 Available tools: ${toolNames}`);
      
    } catch (error) {
      console.error('[MCP] Failed to initialize:', error.message);
      throw error;
    }
  }

  async sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('MCP not connected'));
        return;
      }

      const id = ++this.requestId;
      
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${method} timed out`));
      }, 120000);
      
      this.pendingRequests.set(id, {
        resolve: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });
      
      const message = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };
      
      try {
        this.ws.write(JSON.stringify(message) + '\n');
      } catch (error) {
        this.pendingRequests.delete(id);
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  async sendNotification(method, params) {
    if (!this.isConnected) {
      throw new Error('MCP not connected');
    }

    const message = {
      jsonrpc: '2.0',
      method,
      params
    };
    
    this.ws.write(JSON.stringify(message) + '\n');
  }

  closeConnection() {
    if (this.ws) {
      this.ws = null;
      this.isConnected = false;
    }
  }

  stopServer() {
    this.closeConnection();
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
      this.isReady = false;
      console.log('MCP Server stopped');
    }
  }

  async executeTool(toolName, params) {
    try {
      console.log(`[MCP] Calling tool: ${toolName}`);
      
      const result = await this.sendRequest('tools/call', {
        name: toolName,
        arguments: params
      });

      console.log(`[MCP] Tool ${toolName} completed`);
      return result;
    } catch (error) {
      console.error(`Error executing MCP tool ${toolName}:`, error.message);
      throw error;
    }
  }

  async research(query) {
    console.log(`[OpenRouter:${this.modelConfig.research}] Researching: ${query}`);
    return await this.executeTool('research-manager', { query });
  }

  async generatePRD(productDescription) {
    console.log(`[OpenRouter:${this.modelConfig.prd}] Generating PRD`);
    return await this.executeTool('prd-generator', { productDescription });
  }

  async generateUserStories(prdContent) {
    console.log(`[OpenRouter:${this.modelConfig.userStories}] Generating user stories`);
    return await this.executeTool('user-stories-generator', { 
      productDescription: prdContent
    });
  }

  async generateTaskList(userStoriesContent) {
    console.log(`[OpenRouter:${this.modelConfig.taskList}] Generating task list`);
    return await this.executeTool('task-list-generator', { 
      productDescription: userStoriesContent,
      userStories: userStoriesContent
    });
  }

  async generateStarterKit(productDescription, frontend = 'react', backend = 'nodejs') {
    console.log(`[OpenRouter:${this.modelConfig.codeGeneration}] Generating code: ${frontend} + ${backend}`);
    return await this.executeTool('fullstack-starter-kit-generator', {
      use_case: productDescription,
      frontend_framework: frontend,
      backend_framework: backend
    });
  }
}

const mcpService = new MCPService();
export default mcpService;
