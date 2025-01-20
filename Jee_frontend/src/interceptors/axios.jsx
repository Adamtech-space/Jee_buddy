import axios from "axios";

const apiInstance = axios.create({
  baseURL: "http://localhost:5000/v1",
  // baseURL: "https://jee-buddy-backend.vercel.app/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

apiInstance.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse(localStorage.getItem("tokens"));
    if (tokens?.access?.token) {
      config.headers.Authorization = `Bearer ${tokens.access.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = JSON.parse(localStorage.getItem("tokens"));
        if (tokens?.refresh?.token) {
          // Call refresh token endpoint (you'll need to implement this)
          const response = await axios.post("/auth/refresh-token", {
            refreshToken: tokens.refresh.token,
          });

          if (response.data.tokens) {
            localStorage.setItem("tokens", JSON.stringify(response.data.tokens));
            apiInstance.defaults.headers.common["Authorization"] = 
              `Bearer ${response.data.tokens.access.token}`;
            
            // Retry the original request
            return apiInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        // If refresh token fails, logout user
        localStorage.removeItem("tokens");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiInstance;
