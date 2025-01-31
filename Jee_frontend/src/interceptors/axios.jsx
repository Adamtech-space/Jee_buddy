import axios from "axios";
import {
  setEncryptedItem,
  getDecryptedItem,
  removeItem,
} from '../utils/encryption';

let activeRequests = 0;

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

apiInstance.interceptors.request.use(
  (config) => {
    activeRequests++;
    setGlobalLoading(true, config.url);

    try {
      const tokens = getDecryptedItem('tokens');
      console.log('Decrypted tokens:', {
        exists: !!tokens,
        hasAccessToken: !!tokens?.access?.token,
        tokenPreview: tokens?.access?.token
          ? `${tokens.access.token.substr(0, 10)}...`
          : 'none',
      });

      if (tokens?.access?.token) {
        config.headers.Authorization = `Bearer ${tokens.access.token}`;
        console.log(
          'Added auth header:',
          config.headers.Authorization.substr(0, 20) + '...'
        );
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
    console.error('Response error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
    });

    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Attempting token refresh...');
      originalRequest._retry = true;

      try {
        const tokens = getDecryptedItem('tokens');
        console.log('Refresh token exists:', !!tokens?.refresh?.token);

        if (tokens?.refresh?.token) {
          const response = await apiInstance.post('/auth/refresh-token', {
            refreshToken: tokens.refresh.token,
          });

          if (response.data.tokens) {
            console.log('Token refresh successful');
            setEncryptedItem('tokens', response.data.tokens);
            apiInstance.defaults.headers.common['Authorization'] =
              `Bearer ${response.data.tokens.access.token}`;

            return apiInstance(originalRequest);
          }
        }
        console.warn('No refresh token available');
        throw new Error('No refresh token available');
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        removeItem('tokens');
        removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
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