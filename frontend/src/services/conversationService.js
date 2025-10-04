import axios from 'axios';

const getBackendURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return '/api';
  
  const hostname = window.location.hostname;
  if (hostname.includes('replit.dev')) {
    return `https://${hostname.replace('-00-', '-01-')}/api`;
  }
  return 'http://localhost:3002/api';
};

const API_BASE_URL = getBackendURL();

class ConversationService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 180000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.sessionId = this.getOrCreateSessionId();
  }

  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('conversationSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('conversationSessionId', sessionId);
    }
    return sessionId;
  }

  async sendMessage(message) {
    try {
      const response = await this.client.post('/conversation/chat', {
        message,
        sessionId: this.sessionId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async streamMessage(message, onChunk, onComplete, onError) {
    try {
      const response = await fetch(`${API_BASE_URL}/conversation/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: this.sessionId
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'content') {
              onChunk(data.content);
            } else if (data.type === 'done') {
              onComplete();
            } else if (data.type === 'error') {
              onError(data.error);
            }
          }
        }
      }
    } catch (error) {
      onError(this.handleError(error));
    }
  }

  async getHistory() {
    try {
      const response = await this.client.get(`/conversation/history/${this.sessionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async clearConversation() {
    try {
      await this.client.delete(`/conversation/history/${this.sessionId}`);
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('conversationSessionId', this.sessionId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      return new Error(error.response.data.error || 'Server error occurred');
    } else if (error.request) {
      return new Error('No response from server. Please check if backend is running.');
    } else {
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new ConversationService();
