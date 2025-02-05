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
    try {
      const tokens = getDecryptedItem('tokens');
     

      if (tokens?.access?.token) {
        config.headers.Authorization = `Bearer ${tokens.access.token}`;
      
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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default aiInstance; 