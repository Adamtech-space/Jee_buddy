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
          interaction_type: context.type,
          pinnedText: context.pinnedText || '',
          selectedText: context.selectedText || '',
          image: context.image || null,
          Deep_think: context.Deep_think || false,
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
        question: context.question ? `${context.question} (${type})` : `Help me with: ${type}`,
        context: {
          user_id: context.user_id,
          session_id: context.session_id,
          subject: context.subject || '',
          topic: context.topic || '',
          interaction_type: type,
          pinnedText: context.pinnedText || '',
          selectedText: context.selectedText || '',
          image: context.image || null,
          Deep_think: context.Deep_think || false,
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
  },

  // Subscription related methods
  async checkSubscriptionStatus(userId) {
    try {
      console.log('Checking subscription status for user:', userId);
      if (!userId) {
        throw new Error('User ID is required');
      }
      const response = await aiInstance.get(`api/subscription/status/?user_id=${userId}`);
      console.log('Subscription status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Subscription status check failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error.response?.data || { message: error.message || 'Failed to check subscription status' };
    }
  },

  async createSubscription(subscriptionData) {
    try {
      console.log('Creating subscription with data:', subscriptionData);
      
      // Validate required fields
      if (!subscriptionData.price || !subscriptionData.product_name || !subscriptionData.plan_id || !subscriptionData.user_id) {
        throw new Error('Missing required subscription data');
      }

      const response = await aiInstance.post('api/subscription/create/', subscriptionData);
      console.log('Subscription creation response:', response.data);
      
      if (!response.data) {
        throw new Error('Empty response from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Subscription creation failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });
      if (error.response?.data) {
        throw error.response.data;
      } else if (error.message) {
        throw { message: error.message };
      } else {
        throw { message: 'Failed to create subscription' };
      }
    }
  },

  async verifySubscription(verificationData) {
    try {
      console.log('Verifying subscription with data:', verificationData);
      
      // Validate required fields
      if (!verificationData.razorpay_payment_id || !verificationData.razorpay_subscription_id || 
          !verificationData.razorpay_signature || !verificationData.user_id) {
        throw new Error('Missing required verification data');
      }

      const response = await aiInstance.post('api/subscription/callback/', verificationData);
      console.log('Subscription verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Subscription verification failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });
      if (error.response?.data) {
        throw error.response.data;
      } else if (error.message) {
        throw { message: error.message };
      } else {
        throw { message: 'Failed to verify subscription' };
      }
    }
  },

  async getUserUsage(userId) {
    try {
      console.log('Fetching usage data for user:', userId);
      const response = await aiInstance.get(`/api/usage/stats/?user_id=${userId}`);
      console.log('Usage data response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching usage data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch usage data');
    }
  }
}; 