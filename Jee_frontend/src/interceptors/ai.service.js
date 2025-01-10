import aiInstance from './aiAxios';

export const aiService = {
  async getCurrentProfile() {
    try {
      const userId = localStorage.getItem('uuid');
      if (!userId) {
        throw new Error('No user ID found');
      }

      const response = await aiInstance.get('api/profile/', {
        headers: {
          'X-User-Id': userId
        }
      });
      
      const profile = response.data;
      localStorage.setItem('uuid', profile.uuid);
      localStorage.setItem('current_session_id', profile.current_session_id);
      
      return profile;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  },

  async askQuestion(message, context) {
    try {
      // Ensure we have current profile info
      let currentUserId = localStorage.getItem('uuid');
      let currentSessionId = localStorage.getItem('current_session_id');

      if (!currentUserId || !currentSessionId) {
        const profile = await this.getCurrentProfile();
        currentUserId = profile.uuid;
        currentSessionId = profile.current_session_id;
      }

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
      // Ensure we have current profile info
      let currentUserId = localStorage.getItem('uuid');
      let currentSessionId = localStorage.getItem('current_session_id');

      if (!currentUserId || !currentSessionId) {
        const profile = await this.getCurrentProfile();
        currentUserId = profile.uuid;
        currentSessionId = profile.current_session_id;
      }

      // Combine pinnedText and selectedText
      const combinedPinnedText = [context.pinnedText, context.selectedText]
        .filter(text => text)
        .join('\n\n');

      const response = await aiInstance.post('api/solve-math/', {
        question: `Help me with: ${type}`,
        context: {
          user_id: currentUserId,
          session_id: currentSessionId,
          subject: context.subject || '',
          topic: context.topic || '',
          pinnedText: combinedPinnedText,
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
      // Ensure we have current profile info
      let currentUserId = localStorage.getItem('uuid');
      let currentSessionId = localStorage.getItem('current_session_id');

      if (!currentUserId || !currentSessionId) {
        const profile = await this.getCurrentProfile();
        currentUserId = profile.uuid;
        currentSessionId = profile.current_session_id;
      }

      // Convert file to base64
      const base64File = await this._fileToBase64(file);

      const response = await aiInstance.post('api/solve-math/', {
        question: `Analyze this image: ${file.name}`,
        context: {
          user_id: currentUserId,
          session_id: currentSessionId,
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