import aiInstance from './aiAxios';

class AIService {
  async askQuestion(message, context = {}) {
    try {
      const response = await aiInstance.post('/ai/chat', {
        message,
        context: {
          selectedText: context.selectedText || '',
          pinnedText: context.pinnedText || '',
          subject: context.subject || '',
          topic: context.topic || '',
          ...context
        }
      });
      return response.data;
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  }

  async getHelpResponse(type, context = {}) {
    try {
      const response = await aiInstance.post('/ai/help', {
        type,
        context: {
          subject: context.subject || '',
          topic: context.topic || '',
          selectedText: context.selectedText || '',
          pinnedText: context.pinnedText || '',
          ...context
        }
      });
      return response.data;
    } catch (error) {
      console.error('AI Help Error:', error);
      throw error;
    }
  }

  async analyzeFile(file, context = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', JSON.stringify(context));

      const response = await aiInstance.post('/ai/analyze-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('File Analysis Error:', error);
      throw error;
    }
  }
}

export const aiService = new AIService(); 