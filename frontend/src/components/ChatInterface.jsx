import React, { useState, useRef, useEffect } from 'react';
import conversationService from '../services/conversationService';
import './ChatInterface.css';

function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI website builder assistant. Tell me what kind of website you'd like to create, and I'll help bring it to life! I can research best practices, plan your project, and generate the complete code.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [toolStatus, setToolStatus] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      let assistantContent = '';
      const assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      await conversationService.streamMessage(
        userMessage.content,
        (chunk) => {
          assistantContent += chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = assistantContent;
            return newMessages;
          });
        },
        (toolCall) => {
          const toolNames = {
            'research_best_practices': '🔍 Researching best practices...',
            'generate_prd': '📋 Generating Product Requirements Document...',
            'generate_user_stories': '📝 Creating user stories...',
            'generate_task_list': '✅ Generating development tasks...',
            'generate_website_code': '💻 Generating complete website code...'
          };
          const toolName = toolCall.tools[0]?.function?.name;
          setToolStatus(toolNames[toolName] || '⚙️ Processing...');
        },
        () => {
          setIsLoading(false);
          setIsTyping(false);
          setToolStatus('');
        },
        (error) => {
          console.error('Stream error:', error);
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = `Error: ${error.message}`;
            return newMessages;
          });
          setIsLoading(false);
          setIsTyping(false);
          setToolStatus('');
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      }]);
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await conversationService.clearConversation();
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm your AI website builder assistant. Tell me what kind of website you'd like to create, and I'll help bring it to life!",
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const examplePrompts = [
    "Build me a blog website with authentication",
    "Create an online store for handmade jewelry",
    "I need a portfolio website for a photographer",
    "Build a todo app with user accounts"
  ];

  const handleExampleClick = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-content">
          <h1>AI Website Builder</h1>
          <p>Powered by Groq + OpenRouter + MCP</p>
        </div>
        <button onClick={handleClearChat} className="clear-button">
          Clear Chat
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-text">{msg.content}</div>
              <div className="message-time">{formatTime(msg.timestamp)}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              {toolStatus ? (
                <div className="tool-status">
                  <div className="tool-status-text">{toolStatus}</div>
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="example-prompts">
          <h3 className="example-title">Try these examples:</h3>
          <div className="example-grid">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                className="example-prompt"
                onClick={() => handleExampleClick(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-input">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe the website you want to build..."
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default ChatInterface;
