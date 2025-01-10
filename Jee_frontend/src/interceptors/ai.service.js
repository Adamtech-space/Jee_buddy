import aiInstance from './aiAxios';

export const aiService = {
  async askQuestion(message, context) {
    try {
      // Get current user ID and session ID from profile
      const currentUserId = localStorage.getItem('uuid') || context.uuid;
      const currentSessionId = localStorage.getItem('current_session_id');

      if (!currentUserId || !currentSessionId) {
        // Fetch from profile if not in localStorage
        try {
          const profileResponse = await aiInstance.get('api/profile/');
          const profile = profileResponse.data;
          
          // Generate a default session ID if none exists
          const sessionId = profile.current_session_id;
          const userId = profile.id;
          
          localStorage.setItem('uuid', userId);
          localStorage.setItem('current_session_id', sessionId);
          
          // Update the current values
          currentUserId = userId;
          currentSessionId = sessionId;
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          // Set default session ID if profile fetch fails
          const defaultSessionId = `session_${Date.now()}`;
          localStorage.setItem('current_session_id', defaultSessionId);
          currentSessionId = defaultSessionId;
        }
      }

      const requestData = {
        question: message,
        context: {
          user_id: currentUserId || 'default_user',
          session_id: currentSessionId,
          subject: context.subject || '',
          topic: context.topic || '',
          interaction_type: context.type || 'solve',
          pinnedText: context.pinnedText || '',
          selectedText: context.selectedText || '',
          image: context.image || null,
          history_limit: 100,
          chat_history: [] // The backend will fetch history based on user_id
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
      const currentUserId = localStorage.getItem('uuid');
      const currentSessionId = localStorage.getItem('current_session_id');

      const response = await aiInstance.post('api/solve-math/', {
        question: `Help me with: ${type}`,
        context: {
          user_id: currentUserId,
          session_id: currentSessionId,
          subject: context.subject || '',
          topic: context.topic || '',
          pinnedText: context.pinnedText || '',
          image: context.image || null,
          history_limit: 100
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