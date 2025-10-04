
import axios from 'axios';

class ConversationService {
  constructor() {
    this.client = null;
    this.model = 'google/gemini-2.0-flash-exp:free';
    
    this.tools = [
      {
        type: 'function',
        function: {
          name: 'research_best_practices',
          description: 'Research best practices, latest trends, and technologies for a given topic or project type. Use this when user asks about technologies, frameworks, or needs recommendations.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The research query, e.g., "best practices for building a blog platform with React"'
              }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_prd',
          description: 'Generate a comprehensive Product Requirements Document (PRD) for a software project. Use this when you have a clear understanding of what the user wants to build.',
          parameters: {
            type: 'object',
            properties: {
              productDescription: {
                type: 'string',
                description: 'Detailed description of the product to build'
              }
            },
            required: ['productDescription']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_user_stories',
          description: 'Generate detailed user stories with acceptance criteria from a PRD. Use this after creating a PRD to break it down into user-focused features.',
          parameters: {
            type: 'object',
            properties: {
              prdContent: {
                type: 'string',
                description: 'The PRD content to generate user stories from'
              }
            },
            required: ['prdContent']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_task_list',
          description: 'Generate a detailed development task list from user stories. Use this to break down user stories into actionable development tasks.',
          parameters: {
            type: 'object',
            properties: {
              userStoriesContent: {
                type: 'string',
                description: 'The user stories content to generate tasks from'
              }
            },
            required: ['userStoriesContent']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_website_code',
          description: 'Generate complete full-stack website code (frontend + backend). Use this as the final step after planning is complete.',
          parameters: {
            type: 'object',
            properties: {
              productDescription: {
                type: 'string',
                description: 'Complete description of the website to generate'
              },
              frontend: {
                type: 'string',
                enum: ['react', 'vue', 'angular', 'svelte'],
                description: 'Frontend framework to use'
              },
              backend: {
                type: 'string',
                enum: ['nodejs', 'python', 'go', 'java'],
                description: 'Backend technology to use'
              }
            },
            required: ['productDescription', 'frontend', 'backend']
          }
        }
      }
    ];
  }

  getClient() {
    if (!this.client) {
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not set. Please add it to backend/.env or Replit Secrets.');
      }
      this.client = axios.create({
        baseURL: 'https://openrouter.ai/api/v1',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://replit.com',
          'X-Title': 'AI Website Builder'
        }
      });
    }
    return this.client;
  }

  async chat(messages, tools = this.tools) {
    try {
      const client = this.getClient();
      const response = await client.post('/chat/completions', {
        model: this.model,
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.6,
        max_tokens: 4096,
        top_p: 0.95
      });

      return response.data;
    } catch (error) {
      console.error('OpenRouter API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async streamChat(messages, tools = this.tools) {
    try {
      const client = this.getClient();
      const response = await client.post('/chat/completions', {
        model: this.model,
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.6,
        max_tokens: 4096,
        top_p: 0.95,
        stream: true
      }, {
        responseType: 'stream'
      });

      return response.data;
    } catch (error) {
      console.error('OpenRouter Stream Error:', error.response?.data || error.message);
      throw error;
    }
  }

  getSystemPrompt() {
    return {
      role: 'system',
      content: `You are an expert AI website builder assistant. You help users create complete websites through natural conversation.

CRITICAL WORKFLOW - FOLLOW THIS EXACT SEQUENCE:

When user provides complete requirements, execute these steps IN ORDER:

STEP 1: Call research_best_practices ONCE
STEP 2: Call generate_prd IMMEDIATELY after research completes
STEP 3: Call generate_user_stories IMMEDIATELY after PRD completes
STEP 4: Call generate_task_list IMMEDIATELY after user stories complete
STEP 5: Call generate_website_code IMMEDIATELY after task list completes

DO NOT:
- Call research_best_practices more than once
- Skip any steps
- Ask for user input between steps
- Wait or pause between tool calls

WHEN USER REQUIREMENTS ARE INCOMPLETE:
- Ask 2-3 specific questions to clarify
- Once you have: tech stack preferences, main features, and authentication needs
- Then start the workflow from STEP 1

EXAMPLE GOOD FLOW:
User: "Build a blog with React and authentication"
You: Call research_best_practices → Call generate_prd → Call generate_user_stories → Call generate_task_list → Call generate_website_code
Final response: "I've generated your complete blog website! Check the generated-projects folder."

EXAMPLE BAD FLOW:
User: "Build a blog"
You: Call research_best_practices → Call research_best_practices again ❌ WRONG!

Remember: Once you start the workflow, complete all 5 steps without stopping.`
    };
  }
}

export default new ConversationService();
