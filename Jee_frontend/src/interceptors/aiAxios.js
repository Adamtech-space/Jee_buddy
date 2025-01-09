import axios from 'axios';

const aiInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000/', // AI backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
aiInstance.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { access } = JSON.parse(tokens);
      config.headers.Authorization = `Bearer ${access.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
aiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default aiInstance; 