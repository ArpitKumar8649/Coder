import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPService {
  constructor() {
    this.mcpProcess = null;
    this.mcpBaseUrl = 'http://localhost:3001';
    this.isReady = false;
    
    this.modelConfig = {
      research: process.env.RESEARCH_MODEL || 'perplexity/sonar-pro',
      prd: process.env.PRD_MODEL || 'anthropic/claude-3.5-sonnet',
      userStories: process.env.USER_STORIES_MODEL || 'anthropic/claude-3.5-sonnet',
      taskList: process.env.TASK_LIST_MODEL || 'google/gemini-2.5-flash-preview-05-20',
      codeGeneration: process.env.CODE_GENERATION_MODEL || 'google/gemini-2.5-flash-preview-05-20'
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

    this.mcpProcess = spawn('npx', ['vibe-coder-mcp', '--sse'], {
      env: {
        ...process.env,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
        VIBE_PROJECT_ROOT: path.resolve(__dirname, process.env.VIBE_PROJECT_ROOT || '../generated-projects'),
        VIBE_CODER_OUTPUT_DIR: path.resolve(__dirname, process.env.VIBE_CODER_OUTPUT_DIR || '../generated-projects/VibeCoderOutput'),
        GEMINI_MODEL: this.modelConfig.codeGeneration,
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.mcpProcess.stdout.on('data', (data) => {
      console.log(`[MCP] ${data.toString().trim()}`);
      if (data.toString().includes('Server started')) {
        this.isReady = true;
      }
    });

    this.mcpProcess.stderr.on('data', (data) => {
      console.error(`[MCP Error] ${data.toString().trim()}`);
    });

    this.mcpProcess.on('close', (code) => {
      console.log(`MCP Server exited with code ${code}`);
      this.mcpProcess = null;
      this.isReady = false;
    });

    await this.waitForReady();
  }

  async waitForReady(timeout = 30000) {
    const startTime = Date.now();
    while (!this.isReady && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!this.isReady) {
      throw new Error('MCP Server failed to start within timeout');
    }
    console.log('✅ MCP Server is ready!');
  }

  stopServer() {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
      this.isReady = false;
      console.log('MCP Server stopped');
    }
  }

  async executeTool(toolName, params) {
    if (!this.isReady) {
      throw new Error('MCP Server is not ready');
    }

    try {
      console.log(`[MCP] Executing tool: ${toolName}`);
      const response = await axios.post(`${this.mcpBaseUrl}/mcp/execute`, {
        tool: toolName,
        arguments: params
      }, {
        timeout: 120000
      });

      return response.data;
    } catch (error) {
      console.error(`Error executing MCP tool ${toolName}:`, error.message);
      throw error;
    }
  }

  async research(query) {
    console.log(`[OpenRouter:${this.modelConfig.research}] Researching: ${query}`);
    return await this.executeTool('research', { query });
  }

  async generatePRD(productDescription) {
    console.log(`[OpenRouter:${this.modelConfig.prd}] Generating PRD`);
    return await this.executeTool('prd-generator', { productDescription });
  }

  async generateUserStories(prdContent) {
    console.log(`[OpenRouter:${this.modelConfig.userStories}] Generating user stories`);
    return await this.executeTool('user-stories-generator', { 
      prdContent,
      outputFormat: 'detailed'
    });
  }

  async generateTaskList(userStoriesContent) {
    console.log(`[OpenRouter:${this.modelConfig.taskList}] Generating task list`);
    return await this.executeTool('task-list-generator', { 
      userStoriesContent 
    });
  }

  async generateStarterKit(productDescription, frontend = 'react', backend = 'nodejs') {
    console.log(`[OpenRouter:${this.modelConfig.codeGeneration}] Generating code: ${frontend} + ${backend}`);
    return await this.executeTool('fullstack-starter-kit-generator', {
      productDescription,
      frontend,
      backend,
      includeAuth: true,
      includeDatabase: true
    });
  }
}

const mcpService = new MCPService();
export default mcpService;
