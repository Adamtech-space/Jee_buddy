import axios from 'axios';
import { getDecryptedItem } from '../utils/encryption';

const aiInstance = axios.create({
  baseURL: import.meta.env.VITE_AI_URL,
  withCredentials: true,
  // timeout: 30000, // 30 seconds timeout
});

// Request interceptor
aiInstance.interceptors.request.use(
  (config) => {
    console.log('Making AI request to:', config.url);
    try {
      const tokens = getDecryptedItem('tokens');
      console.log('AI Request - Token status:', {
        exists: !!tokens,
        hasAccessToken: !!tokens?.access?.token,
        tokenPreview: tokens?.access?.token
          ? `${tokens.access.token.substr(0, 10)}...`
          : 'none',
      });

      if (tokens?.access?.token) {
        config.headers.Authorization = `Bearer ${tokens.access.token}`;
        console.log(
          'Added AI auth header:',
          config.headers.Authorization.substr(0, 20) + '...'
        );
      } else {
        console.warn('No valid token found for AI request:', config.url);
      }
    } catch (error) {
      console.error(
        'Error processing tokens in AI request interceptor:',
        error
      );
    }
    return config;
  },
  (error) => {
    console.error('AI Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
aiInstance.interceptors.response.use(
  (response) => {
    console.log('AI Response received:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method,
    });
    return response;
  },
  async (error) => {
    console.error('AI Response error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response?.status === 401) {
      console.log('AI Service - Unauthorized access, redirecting to login');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default aiInstance; 