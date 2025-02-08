import axios from "axios";
import {
  setEncryptedItem,
  getDecryptedItem,
  removeItem,
} from '../utils/encryption';

let activeRequests = 0;
let isRefreshing = false;
let failedQueue = [];

const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get loading state setter from context
const setGlobalLoading = (loading, url) => {
  // Only show loader for auth-related operations
  const authPaths = ['/auth/login', '/auth/register', '/auth/refresh-token'];

  // Skip loader for all internal requests except auth
  if (!url || !authPaths.some((path) => url.includes(path))) {
    return;
  }

  window.setGlobalLoading?.({ loading, url });
};

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiInstance.interceptors.request.use(
  (config) => {
    activeRequests++;
    setGlobalLoading(true, config.url);

    // Skip token check for authentication callback routes
    const skipTokenPaths = ['/auth/google/callback'];
    if (skipTokenPaths.some(path => config.url.includes(path))) {
      return config;
    }

    try {
      const tokens = getDecryptedItem('tokens');
     

      if (tokens?.access?.token) {
        config.headers.Authorization = `Bearer ${tokens.access.token}`;
       
      } else {
        console.warn('No valid token found for request:', config.url);
      }
    } catch (error) {
      console.error('Error processing tokens in request interceptor:', error);
    }

    return config;
  },
  (error) => {
    activeRequests--;
    if (activeRequests === 0) {
      setGlobalLoading(false, error.config?.url);
    }
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

apiInstance.interceptors.response.use(
  (response) => {
    activeRequests--;
    if (activeRequests === 0) {
      setGlobalLoading(false, response.config.url);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Skip handling for non-API errors and specific routes
    if (!error.config || !error.response || 
        ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/google/callback']
        .some(path => originalRequest.url.includes(path))) {
      activeRequests--;
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiInstance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = getDecryptedItem('tokens');
        if (!tokens?.refresh?.token) throw new Error('No refresh token available');
        
        const { data } = await apiInstance.post('/auth/refresh-token', {
          refreshToken: tokens.refresh.token
        });

        setEncryptedItem('tokens', data.tokens);
        apiInstance.defaults.headers.common['Authorization'] = `Bearer ${data.tokens.access.token}`;
        
        processQueue(null, data.tokens.access.token);
        return apiInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Only logout for non-auth related routes
        if (!originalRequest.url.includes('/auth/')) {
          removeItem('tokens');
          removeItem('user');
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    activeRequests--;
    if (activeRequests === 0) {
      setGlobalLoading(false, error.config?.url);
    }
    
    return Promise.reject(error);
  }
);

export default apiInstance;