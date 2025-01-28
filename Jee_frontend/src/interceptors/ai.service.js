import aiInstance from './aiAxios';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageCallbacks = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    const baseUrl = import.meta.env.VITE_AI_URL;
    this.baseUrl = baseUrl.replace(/\/$/, '').replace('http://', 'ws://').replace('https://', 'wss://');
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const tokens = localStorage.getItem('tokens');
    const accessToken = tokens ? JSON.parse(tokens).access.token : '';
    
    const wsUrl = `${this.baseUrl}/ws/chat/?token=${accessToken}`;
    console.log('WebSocket Base URL:', this.baseUrl);
    console.log('Connecting to WebSocket:', wsUrl);
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket Connected');
      this.reconnectAttempts = 0;
      window.dispatchEvent(new CustomEvent('wsConnected'));
    };

    this.ws.onclose = () => {
      console.log('WebSocket Disconnected');
      this.handleReconnect();
      window.dispatchEvent(new CustomEvent('wsDisconnected'));
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message_id && this.messageCallbacks.has(data.message_id)) {
          const { resolve, reject } = this.messageCallbacks.get(data.message_id);
          if (data.error) {
            reject(new Error(data.error));
          } else {
            // Dispatch success event for auto-disabling features
            window.dispatchEvent(new CustomEvent('aiResponse', { 
              detail: { success: true } 
            }));
            resolve(data);
          }
          this.messageCallbacks.delete(data.message_id);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      setTimeout(() => this.connect(), delay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async sendMessage(message, context) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
      });
    }

    return new Promise((resolve, reject) => {
      const messageId = Date.now().toString();
      const payload = {
        message_id: messageId,
        question: message,
        context: {
          user_id: context.user_id,
          session_id: context.session_id,
          subject: context.subject || '',
          interaction_type: context.type,
          pinnedText: context.pinnedText || '',
          selectedText: context.selectedText || '',
          image: context.image || null,
          Deep_think: context.Deep_think || false,
          history_limit: 100,
          chat_history: []
        }
      };

      this.messageCallbacks.set(messageId, { resolve, reject });
      this.ws.send(JSON.stringify(payload));

      // Set timeout for response
      setTimeout(() => {
        if (this.messageCallbacks.has(messageId)) {
          this.messageCallbacks.delete(messageId);
          reject(new Error('WebSocket response timeout'));
        }
      }, 30000);
    });
  }
}

// Create WebSocket instance
const wsService = new WebSocketService();

export const aiService = {
  // Initialize WebSocket connection
  initializeWebSocket() {
    wsService.connect();
  },

  // Close WebSocket connection
  closeWebSocket() {
    wsService.disconnect();
  },

  // Modified askQuestion to use WebSocket
  async askQuestion(message, context) {
    try {
      console.log('Sending WebSocket message:', { message, context });
      const response = await wsService.sendMessage(message, context);
      console.log('WebSocket response:', response);
      return response;
    } catch (error) {
      console.error('WebSocket request failed:', error);
      console.error('Error details:', {
        message: error.message
      });
      throw { message: error.message || 'Failed to get response' };
    }
  },

  // Keep the rest of the methods using HTTP for now
  async getHelpResponse(type, context) {
    try {
      console.log('Sending help request with data:', { type, context });
      const response = await wsService.sendMessage(
        context.question ? `${context.question} (${type})` : `Help me with: ${type}`,
        {
          ...context,
          interaction_type: type
        }
      );
      console.log('Help response:', response);
      return response;
    } catch (error) {
      console.error('Help request failed:', error);
      throw { message: error.message || 'Failed to get help response' };
    }
  },

  // Keep existing HTTP methods
  async analyzeFile(file, context) {
    try {
      console.log('Analyzing file:', { fileName: file.name, context });
      
      const base64File = await this._fileToBase64(file);
      const requestData = {
        question: `Analyze this image: ${file.name}`,
        context: {
          user_id: context.user_id,
          session_id: context.session_id,
          subject: context.subject || '',
          topic: context.topic || '',
          interaction_type: 'analyze',
          pinnedText: '',
          selectedText: '',
          image: base64File,
          history_limit: 100,
          chat_history: []
        }
      };

      const response = await aiInstance.post('api/solve-math/', requestData);
      return response.data;
    } catch (error) {
      console.error('File analysis failed:', error);
      throw error.response?.data || { message: 'Failed to analyze file' };
    }
  },

  async _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  },

  // Keep other HTTP methods
  async checkSubscriptionStatus(userId) {
    try {
      const response = await aiInstance.get(`api/subscription/status/?user_id=${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to check subscription status' };
    }
  },

  async createSubscription(subscriptionData) {
    try {
      const response = await aiInstance.post('api/subscription/create/', subscriptionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create subscription' };
    }
  },

  async verifySubscription(verificationData) {
    try {
      const response = await aiInstance.post('api/subscription/callback/', verificationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify subscription' };
    }
  },

  async getUserUsage(userId) {
    try {
      const response = await aiInstance.get(`/api/usage/stats/?user_id=${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch usage data');
    }
  },

  async getChatHistory(userId, sessionId) {
    try {
      const response = await aiInstance.get(`/api/chat/history`, {
        params: { user_id: userId, session_id: sessionId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 