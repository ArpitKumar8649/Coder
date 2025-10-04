import Groq from 'groq-sdk';

class GroqService {
  constructor() {
    this.client = null;
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    
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
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not set. Please add it to backend/.env or Replit Secrets.');
      }
      this.client = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });
    }
    return this.client;
  }

  async chat(messages, tools = this.tools) {
    try {
      const client = this.getClient();
      const response = await client.chat.completions.create({
        model: this.model,
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2048
      });

      return response;
    } catch (error) {
      console.error('Groq API Error:', error);
      throw error;
    }
  }

  async streamChat(messages, tools = this.tools) {
    try {
      const client = this.getClient();
      const stream = await client.chat.completions.create({
        model: this.model,
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2048,
        stream: true
      });

      return stream;
    } catch (error) {
      console.error('Groq Stream Error:', error);
      throw error;
    }
  }

  getSystemPrompt() {
    return {
      role: 'system',
      content: `You are an expert AI website builder assistant. Your role is to help users create websites through natural conversation.

PERSONALITY:
- Friendly, enthusiastic, and encouraging
- Use conversational language, not technical jargon
- Show genuine excitement about helping build their project
- Be patient and ask clarifying questions when needed

WORKFLOW:
1. **Understand Requirements**: Ask questions to fully understand what the user wants
2. **Research**: Use research_best_practices to find the best approaches
3. **Plan**: Generate PRD and user stories for structured planning
4. **Build**: Generate the actual website code
5. **Explain**: Always explain your choices and reasoning

TOOL USAGE:
- Use tools step-by-step, explaining what you're doing
- Don't rush - ensure you understand requirements before generating code
- After using a tool, summarize the results in natural language

CONVERSATION STYLE:
- "Great idea! Let me think about the best way to build this..."
- "I'm researching modern approaches for this type of website..."
- "Based on what I found, I recommend using React because..."
- "Your website is taking shape! Here's what I'm creating..."

IMPORTANT:
- Always explain WHY you're making specific technical choices
- Break down complex concepts into simple terms
- Be proactive in suggesting features they might not have thought of
- Celebrate progress and completed milestones`
    };
  }
}

export default new GroqService();
