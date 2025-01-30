import apiInstance from "./axios.jsx";

// User authentication services
export const userLogin = async (data) => {
  try {
    console.log('Attempting login with:', { email: data.email });
    
    const response = await apiInstance.post("/auth/login", data);
    console.log('Login response:', response.data);
    
    if (response.data.tokens && response.data.user) {
      // Store tokens and user data
      localStorage.setItem("tokens", JSON.stringify(response.data.tokens));
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      // Set the auth header for subsequent requests
      apiInstance.defaults.headers.common['Authorization'] = 
        `Bearer ${response.data.tokens.access.token}`;
      
      return response.data;
    }
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.response?.data) {
      throw error.response.data;
    } else if (error.message.includes('Network Error')) {
      throw { message: 'Unable to connect to server. Please check your internet connection.' };
    }
    throw { message: error.message || "Login failed. Please try again." };
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
    throw error.response?.data || { message: "Failed to initiate Google sign in" };
  }
};

export const handleGoogleCallback = async (code) => {
  try {
    const response = await apiInstance.get(`/auth/google/callback?code=${code}`);
    if (response.data.tokens) {
      localStorage.setItem("tokens", JSON.stringify(response.data.tokens));
      return response.data;
    }
    throw new Error("No tokens received");
  } catch (error) {
    throw error.response?.data || { message: "Failed to complete Google sign in" };
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
    await apiInstance.post("/auth/logout");
    localStorage.removeItem("tokens");
    window.location.href = "/login";
  } catch (error) {
    localStorage.removeItem("tokens");
    window.location.href = "/login";
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

// Books services
export const getBooksList = async (subject, topic) => {
  try {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (topic) params.append('topic', topic);
    
    const response = await apiInstance.get(`/books?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch books" };
  }
};

export const getBookById = async (bookId) => {
  try {
    const response = await apiInstance.get(`/books/${bookId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch book details" };
  }
};

// Flash Cards Services
export const saveFlashCard = async (data) => {
  try {
    const response = await apiInstance.post('/flashcards/saveFlashCard', data);
    return response.data;
  } catch (error) {
    console.error('Save flashcard error:', error);
    throw error.response?.data || { message: 'Failed to save flash card' };
  }
};

export const getFlashCards = async (subject) => {
  const response = await apiInstance.get(`/flashcards/getFlashCards?subject=${subject}`);
  return response.data;
};

export const updateFlashCard = async (cardId, data) => {
  const response = await apiInstance.put(`/flashcards/updateFlashCard/${cardId}`, data);
  return response.data;
};

export const deleteFlashCard = async (cardId) => {
  const response = await apiInstance.delete(`/flashcards/deleteFlashCard/${cardId}`);
  return response.data;
};

// Study Materials services
export const createFolder = async ({ name, parentId, subject }) => {
  try {
    const response = await apiInstance.post('/study-materials/folders', {
      name,
      parentId,
      subject,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create folder' };
  }
};

export const uploadFiles = async (files, parentId, subject) => {
  try {
    const formData = new FormData();
    formData.append('file', files[0]); // Currently handling single file
    if (parentId) {
      formData.append('parentId', parentId);
    }
    // Ensure subject is always included
    if (!subject) {
      throw new Error('Subject is required');
    }
    formData.append('subject', subject);

    console.log('Form data:', {
      file: files[0].name,
      parentId,
      subject,
    });

    const response = await apiInstance.post(
      '/study-materials/files',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to upload file' };
  }
};

export const getStudyMaterials = async (parentId, subject) => {
  try {
    const params = new URLSearchParams();
    if (parentId) params.append('parentId', parentId);
    params.append('subject', subject); // Always include subject

    console.log('Fetching study materials with params:', { parentId, subject });
    
    const response = await apiInstance.get(
      `/study-materials?${params.toString()}`
    );
    
    console.log('Study materials response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching study materials:', error);
    throw (
      error.response?.data || { message: 'Failed to fetch study materials' }
    );
  }
};

export const deleteStudyMaterial = async (itemId) => {
  try {
    const response = await apiInstance.delete(`/study-materials/${itemId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete item' };
  }
};

export const renameStudyMaterial = async (itemId, name) => {
  try {
    const response = await apiInstance.put(`/study-materials/${itemId}`, { name });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to rename item' };
  }
};

export const getFileDownloadUrl = async (itemId) => {
  try {
    const response = await apiInstance.get(`/study-materials/files/${itemId}/download`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get download URL' };
  }
};

export const getQuestionBankList = async (subject) => {
  try {
    const response = await apiInstance.get(`/question-bank?subject=${subject}`);
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch question bank' };
  }
};

