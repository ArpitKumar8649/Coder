import conversationService from '../services/conversationService.js';
import mcpService from '../services/mcpService.js';

const conversationSessions = new Map();

export const conversationController = {
  async chat(req, res) {
    try {
      const { message, sessionId } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      const session = sessionId || `session_${Date.now()}`;
      let conversationHistory = conversationSessions.get(session) || [
        conversationService.getSystemPrompt()
      ];

      conversationHistory.push({
        role: 'user',
        content: message
      });

      console.log(`\n💬 User [${session}]: ${message}`);

      let conversationResponse = await conversationService.chat(conversationHistory);
      let assistantMessage = conversationResponse.choices[0].message;

      while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        conversationHistory.push(assistantMessage);

        console.log(`\n🔧 OpenRouter wants to use ${assistantMessage.tool_calls.length} tool(s)`);

        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          console.log(`\n⚙️  Executing: ${toolName}`);
          console.log(`   Arguments:`, toolArgs);

          let toolResult;

          try {
            toolResult = await conversationController.executeToolCall(toolName, toolArgs);
            console.log(`✅ Tool completed successfully`);
          } catch (error) {
            console.error(`❌ Tool execution failed:`, error.message);
            toolResult = {
              error: error.message,
              success: false
            };
          }

          conversationHistory.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
        }

        conversationResponse = await conversationService.chat(conversationHistory);
        assistantMessage = conversationResponse.choices[0].message;
      }

      conversationHistory.push(assistantMessage);

      conversationSessions.set(session, conversationHistory);

      console.log(`\n🤖 Assistant: ${assistantMessage.content}\n`);

      res.json({
        success: true,
        data: {
          message: assistantMessage.content,
          sessionId: session,
          conversationLength: conversationHistory.length
        }
      });

    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async streamChat(req, res) {
    try {
      const { message, sessionId } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const session = sessionId || `session_${Date.now()}`;
      let conversationHistory = conversationSessions.get(session) || [
        conversationService.getSystemPrompt()
      ];

      conversationHistory.push({
        role: 'user',
        content: message
      });

      console.log(`\n💬 User [${session}]: ${message}`);

      let continueLoop = true;

      while (continueLoop) {
        const stream = await conversationService.streamChat(conversationHistory);

        let accumulatedContent = '';
        let accumulatedToolCalls = [];
        let finishReason = null;

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          finishReason = chunk.choices[0]?.finish_reason;

          if (delta?.content) {
            accumulatedContent += delta.content;
            res.write(`data: ${JSON.stringify({
              type: 'content',
              content: delta.content
            })}\n\n`);
          }

          if (delta?.tool_calls) {
            for (const toolCallDelta of delta.tool_calls) {
              if (!accumulatedToolCalls[toolCallDelta.index]) {
                accumulatedToolCalls[toolCallDelta.index] = {
                  id: toolCallDelta.id,
                  type: 'function',
                  function: { name: '', arguments: '' }
                };
              }

              if (toolCallDelta.function?.name) {
                accumulatedToolCalls[toolCallDelta.index].function.name += toolCallDelta.function.name;
              }
              if (toolCallDelta.function?.arguments) {
                accumulatedToolCalls[toolCallDelta.index].function.arguments += toolCallDelta.function.arguments;
              }
            }
          }
        }

        if (finishReason === 'tool_calls' && accumulatedToolCalls.length > 0) {
          const assistantMessage = {
            role: 'assistant',
            content: accumulatedContent || null,
            tool_calls: accumulatedToolCalls
          };

          conversationHistory.push(assistantMessage);

          res.write(`data: ${JSON.stringify({
            type: 'tool_call',
            tools: accumulatedToolCalls
          })}\n\n`);

          console.log(`\n🔧 OpenRouter wants to use ${accumulatedToolCalls.length} tool(s)`);

          for (const toolCall of accumulatedToolCalls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);

            console.log(`\n⚙️  Executing: ${toolName}`);
            console.log(`   Arguments:`, toolArgs);

            let toolResult;

            try {
              toolResult = await conversationController.executeToolCall(toolName, toolArgs);
              console.log(`✅ Tool completed successfully`);
            } catch (error) {
              console.error(`❌ Tool execution failed:`, error.message);
              toolResult = {
                error: error.message,
                success: false
              };
            }

            conversationHistory.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult)
            });
          }

        } else {
          conversationHistory.push({
            role: 'assistant',
            content: accumulatedContent
          });

          console.log(`\n🤖 Assistant: ${accumulatedContent}\n`);
          continueLoop = false;
        }
      }

      conversationSessions.set(session, conversationHistory);

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();

    } catch (error) {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message
      })}\n\n`);
      res.end();
    }
  },

  async executeToolCall(toolName, args) {
    switch (toolName) {
      case 'research_best_practices':
        return await mcpService.research(args.query);

      case 'generate_prd':
        return await mcpService.generatePRD(args.productDescription);

      case 'generate_user_stories':
        return await mcpService.generateUserStories(args.prdContent);

      case 'generate_task_list':
        return await mcpService.generateTaskList(args.userStoriesContent);

      case 'generate_website_code':
        return await mcpService.generateStarterKit(
          args.productDescription,
          args.frontend,
          args.backend
        );

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  },

  async getHistory(req, res) {
    try {
      const { sessionId } = req.params;

      const history = conversationSessions.get(sessionId);

      if (!history) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        data: {
          sessionId,
          messages: history.filter(msg => msg.role !== 'system'),
          messageCount: history.length - 1
        }
      });

    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async clearHistory(req, res) {
    try {
      const { sessionId } = req.params;

      conversationSessions.delete(sessionId);

      res.json({
        success: true,
        message: 'Conversation history cleared'
      });

    } catch (error) {
      console.error('Clear history error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};