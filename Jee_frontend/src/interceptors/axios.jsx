import axios from "axios";

const apiInstance = axios.create({
  baseURL: "http://localhost:3000",
});

apiInstance.interceptors.request.use(
  (config) => {
    const authToken = localStorage.getItem("token");

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    console.error("Request Error Interceptors", error);
    return Promise.reject(error);
  }
);

apiInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized access - logging out...");
      localStorage.removeItem("token");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiInstance;
