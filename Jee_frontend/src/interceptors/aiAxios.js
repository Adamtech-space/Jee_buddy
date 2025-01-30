import axios from 'axios';

const aiInstance = axios.create({
  baseURL: import.meta.env.VITE_AI_URL,
  withCredentials: true,
  // timeout: 30000, // 30 seconds timeout
});

// Request interceptor
aiInstance.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { access } = JSON.parse(tokens);
      config.headers.Authorization = `Bearer ${access.token}`;
      console.log('Added authorization token');
    } else {
      console.warn('No tokens found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
aiInstance.interceptors.response.use(
  (response) => {
    console.log('Received response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method
    });
    return response;
  },
  async (error) => {
    console.error('Response interceptor error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      console.log('Unauthorized access, redirecting to login');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default aiInstance; 