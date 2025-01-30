import aiInstance from './aiAxios';

// Utility functions
const fileToBase64 = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

const handleApiError = (error, defaultMessage) => {
  console.error('API request failed:', error);
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
    throw { message: defaultMessage };
  }
};

// Core AI functions
const askQuestion = async (message, context, options = {}) => {
  try {
    let requestData;
    let headers = {};

    // Check if context is FormData
    if (context instanceof FormData) {
      requestData = context;
      // Don't set Content-Type header - it will be automatically set with boundary
    } else {
      // Handle regular JSON request
      requestData = {
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
      headers = {
        'Content-Type': 'application/json'
      };
    }

    const response = await aiInstance.post('api/solve-math/', requestData, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get AI response');
  }
};

const getHelpResponse = async (type, context) => {
  try {
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

    const response = await aiInstance.post('api/solve-math/', requestData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get help response');
  }
};

const analyzeFile = async (file, context) => {
  try {
    const base64File = await fileToBase64(file);
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
    handleApiError(error, 'Failed to analyze file');
  }
};

// Subscription functions
const checkSubscriptionStatus = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Check if we have cached subscription data
    const cachedData = localStorage.getItem('subscription');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      // Only return cached data if it's valid and not expired
      if (parsedData && parsedData.valid_till && new Date(parsedData.valid_till) > new Date()) {
        return parsedData;
      }
    }

    const response = await aiInstance.get(`api/subscription/status/?user_id=${userId}`);
    console.log('Subscription API response:', response); // Debug log
    
    if (response.data) {
      // Store the fresh data in localStorage
      localStorage.setItem('subscription', JSON.stringify(response.data));
      return response.data;
    } else {
      throw new Error('Invalid response from subscription API');
    }
  } catch (error) {
    console.error('Subscription status check failed:', error);
    // If there's an error, return a default structure
    return {
      status: 'error',
      is_subscribed: false,
      message: error.message || 'Failed to check subscription status'
    };
  }
};

const createSubscription = async (subscriptionData) => {
  try {
    if (!subscriptionData.price || !subscriptionData.product_name || 
        !subscriptionData.plan_id || !subscriptionData.user_id) {
      throw new Error('Missing required subscription data');
    }

    const response = await aiInstance.post('api/subscription/create/', subscriptionData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to create subscription');
  }
};

const verifySubscription = async (verificationData) => {
  try {
    if (!verificationData.razorpay_payment_id || !verificationData.razorpay_subscription_id || 
        !verificationData.razorpay_signature || !verificationData.user_id) {
      throw new Error('Missing required verification data');
    }

    const response = await aiInstance.post('api/subscription/callback/', verificationData);
    
    // Update localStorage with new subscription data if verification is successful
    if (response.data.status === 'success') {
      localStorage.setItem('subscription', JSON.stringify(response.data));
    }
    
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to verify subscription');
  }
};

const getUserUsage = async (userId) => {
  try {
    const response = await aiInstance.get(`/api/usage/stats/?user_id=${userId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch usage data');
  }
};

const getChatHistory = async (userId, sessionId) => {
  try {
    const response = await aiInstance.get(`/api/chat/history`, {
      params: { user_id: userId, session_id: sessionId }
    });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch chat history');
  }
};

export const aiService = {
  askQuestion,
  getHelpResponse,
  analyzeFile,
  checkSubscriptionStatus,
  createSubscription,
  verifySubscription,
  getUserUsage,
  getChatHistory
}; 