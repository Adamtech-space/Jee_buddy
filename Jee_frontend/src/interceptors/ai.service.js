import aiInstance from './aiAxios';

export const aiService = {
  async askQuestion(message, context) {
    try {
      console.log('Sending request with data:', { message, context });
      
      const requestData = {
        question: message,
        context: {
          user_id: context.user_id,
          session_id: context.session_id,
          subject: context.subject || '',
          topic: context.topic || '',
          interaction_type: context.type,
          pinnedText: context.pinnedText || '',
          selectedText: context.selectedText || '',
          image: context.image || null,
          history_limit: 100,
          chat_history: [] // The backend will fetch history based on user_id
        }
      };

      console.log('Final request payload:', requestData);

      const response = await aiInstance.post('api/solve-math/', requestData);
      console.log('AI response:', response.data);
      return response.data;
    } catch (error) {
      console.error('AI request failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error.response?.data || { message: 'Failed to get AI response' };
    }
  },

  async getHelpResponse(type, context) {
    try {
      console.log('Sending help request with data:', { type, context });
      
      const requestData = {
        question: `Help me with: ${type}`,
        context: {
          user_id: context.user_id,
          session_id: context.session_id,
          subject: context.subject || '',
          topic: context.topic || '',
          interaction_type: type,
          pinnedText: context.pinnedText || '',
          selectedText: context.selectedText || '',
          image: context.image || null,
          history_limit: 100,
          chat_history: []
        }
      };

      console.log('Final help request payload:', requestData);

      const response = await aiInstance.post('api/solve-math/', requestData);
      console.log('Help response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Help request failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error.response?.data || { message: 'Failed to get help response' };
    }
  },

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

      console.log('Final analyze request payload:', requestData);

      const response = await aiInstance.post('api/solve-math/', requestData);
      console.log('Analysis response:', response.data);
      return response.data;
    } catch (error) {
      console.error('File analysis failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
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
  }
}; 