import axios from "axios";

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
  if (!url || !authPaths.some(path => url.includes(path))) {
    return;
  }

  window.setGlobalLoading?.({ loading, url });
};

apiInstance.interceptors.request.use(
  (config) => {
    activeRequests++;
    setGlobalLoading(true, config.url);

    const tokens = JSON.parse(localStorage.getItem('tokens'));
    if (tokens?.access?.token) {
      config.headers.Authorization = `Bearer ${tokens.access.token}`;
    }
    return config;
  },
  (error) => {
    activeRequests--;
    if (activeRequests === 0) {
      setGlobalLoading(false, error.config?.url);
    }
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

    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = JSON.parse(localStorage.getItem('tokens'));
        if (tokens?.refresh?.token) {
          const response = await apiInstance.post('/auth/refresh-token', {
            refreshToken: tokens.refresh.token,
          });

          if (response.data.tokens) {
            localStorage.setItem(
              'tokens',
              JSON.stringify(response.data.tokens)
            );
            apiInstance.defaults.headers.common['Authorization'] =
              `Bearer ${response.data.tokens.access.token}`;

            return apiInstance(originalRequest);
          }
        }
        throw new Error('No refresh token available');
      } catch (refreshError) {
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
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