import aiInstance from './aiAxios';

export const aiService = {
  async askQuestion(message, context) {
    try {
      // Get current user ID from localStorage or context
      const currentUserId = localStorage.getItem('userId') || context.userId || 'default';
      const currentSessionId = localStorage.getItem('sessionId') || context.sessionId || `session_${Date.now()}`;

      const requestData = {
        question: message,
        context: {
          user_id: currentUserId,
          session_id: currentSessionId,
          subject: context.subject || '',
          topic: context.topic || '',
          interaction_type: context.type || 'solve',
          pinnedText: context.pinnedText || '',
          selectedText: context.selectedText || '',
          image: context.image || null,
          history_limit: 100,
          chat_history: context.chatHistory || []
        }
      };

      console.log("Request data:", requestData);

      const response = await aiInstance.post('api/solve-math/', requestData);
      return response.data;
    } catch (error) {
      console.error('AI request failed:', error);
      throw error.response?.data || { message: 'Failed to get AI response' };
    }
  },

  async getHelpResponse(type, context) {
    try {
      // Combine pinnedText and selectedText
      const combinedPinnedText = [context.pinnedText, context.selectedText]
        .filter(text => text)
        .join('\n\n');

      const response = await aiInstance.post('api/solve-math/', {
        question: `Help me with: ${type}`,
        context: {
          session_id: context.sessionId || localStorage.getItem('sessionId') || 'default',
          subject: context.subject || '',
          topic: context.topic || '',
          pinnedText: combinedPinnedText,
          image: context.image || null
        }
      });
      return response.data;
    } catch (error) {
      console.error('Help request failed:', error);
      throw error.response?.data || { message: 'Failed to get help response' };
    }
  },

  async analyzeFile(file, context) {
    try {
      // Convert file to base64
      const base64File = await this._fileToBase64(file);

      const response = await aiInstance.post('api/solve-math/', {
        question: `Analyze this image: ${file.name}`,
        context: {
          session_id: context.sessionId || localStorage.getItem('sessionId') || 'default',
          interaction_type: 'analyze',
          subject: context.subject || '',
          topic: context.topic || '',
          pinnedText: '',
          image: base64File
        }
      });
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
        // Remove the data:image/jpeg;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}; 