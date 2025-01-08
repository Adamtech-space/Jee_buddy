import apiInstance from "./axios.jsx";

// User authentication services
export const userLogin = async (data) => {
  try {
    const response = await apiInstance.post("/auth/login", data);
    if (response.data.tokens) {
      localStorage.setItem("tokens", JSON.stringify(response.data.tokens));
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

export const userRegister = async (data) => {
  try {
    const response = await apiInstance.post("/auth/register", data);
    if (response.data.tokens) {
      localStorage.setItem("tokens", JSON.stringify(response.data.tokens));
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Registration failed" };
  }
};

export const googleSignIn = async () => {
  try {
    const response = await apiInstance.get("/auth/google");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Google sign-in failed" };
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await apiInstance.post("/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to send reset email" };
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await apiInstance.post(`/auth/reset-password?token=${token}`, { password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Password reset failed" };
  }
};

export const logout = async () => {
  try {
    localStorage.removeItem("tokens");
    localStorage.removeItem("user");
    return { success: true };
  } catch (error) {
    throw { message: "Logout failed" };
  }
};

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = () => {
  try {
    const tokens = JSON.parse(localStorage.getItem("tokens"));
    return !!tokens?.access?.token;
  } catch {
    return false;
  }
};

