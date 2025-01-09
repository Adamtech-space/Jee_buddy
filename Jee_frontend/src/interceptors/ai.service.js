import aiInstance from './aiAxios';

export const aiService = {
  async askQuestion(question, context) {
    try {
      const response = await aiInstance.post('api/solve-math/', {
        question,
        context: {
          selectedText: context.selectedText || '',
          pinnedText: context.pinnedText || '',
          // subject: context.subject || '',
          // topic: context.topic || ''
        }
      });
      return response.data;
    } catch (error) {
      console.error('AI request failed:', error);
      throw error.response?.data || { message: 'Failed to get AI response' };
    }
  },

  async getHelpResponse(type, context) {
    try {
      const response = await aiInstance.post('help/', {
        type,
        context: {
          selectedText: context.selectedText || '',
          pinnedText: context.pinnedText || '',
          subject: context.subject || '',
          topic: context.topic || ''
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', JSON.stringify({
        subject: context.subject || '',
        topic: context.topic || ''
      }));

      const response = await aiInstance.post('analyze/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('File analysis failed:', error);
      throw error.response?.data || { message: 'Failed to analyze file' };
    }
  }
}; 