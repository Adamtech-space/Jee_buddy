import apiInstance from "./axios.jsx";
import {
  setEncryptedItem,
  getDecryptedItem,
  removeItem,
} from '../utils/encryption';

// User authentication services
export const userLogin = async (data) => {
  try {
    
    const response = await apiInstance.post("/auth/login", data);
    
    if (response.data.tokens && response.data.user) {
      // Store tokens and user data with encryption
      setEncryptedItem('tokens', response.data.tokens);
      setEncryptedItem('user', response.data.user);

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
      setEncryptedItem('tokens', response.data.tokens);
      setEncryptedItem('user', response.data.user);
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
      setEncryptedItem('tokens', response.data.tokens);
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
    removeItem('tokens');
    window.location.href = "/login";
  } catch (error) {
    removeItem('tokens');
    window.location.href = "/login";
  }
};

export const getCurrentUser = () => {
  try {
    return getDecryptedItem('user');
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = () => {
  try {
    const tokens = getDecryptedItem('tokens');
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

    
    const response = await apiInstance.get(
      `/study-materials?${params.toString()}`
    );
    
    
    
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

// Profile services
export const getProfile = async () => {
  try {
    const response = await apiInstance.get('/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch profile' };
  }
};

// Function to check if user has access based on tokens and plan
export const checkUserAccess = () => {
  try {
    const profile = getDecryptedItem('profile');
    if (!profile) return false;

    // If user has any paid plan, they have access
    if (profile.current_plan_id) {
      const PLAN_IDS = {
        BASIC: 'plan_PhmnKiiVXD3B1M',
        PRO: 'plan_PhmnlqjWH24hwy',
        PREMIUM: 'plan_Phmo9yOZAKb0P8'
      };

      // Check if user has an active paid plan
      const hasPaidPlan = Object.values(PLAN_IDS).includes(profile.current_plan_id);
      
      // If user has paid plan and payment status is completed, grant access
      if (hasPaidPlan && profile.payment_status === 'completed') {
        return true;
      }
    }

    // If no paid plan, check token limit
    return profile.total_tokens < 1000;
  } catch (error) {
    console.error('Error checking user access:', error);
    return false;
  }
};

// Function to update profile in local storage
export const updateProfileCache = async () => {
  try {
    const response = await getProfile();
    if (response.status === 'success' && response.data) {
      setEncryptedItem('profile', response.data);
      return response.data;
    }
    throw new Error('Invalid profile data received');
  } catch (error) {
    console.error('Error updating profile cache:', error);
    throw error;
  }
};

// Function to get user's current plan name
export const getCurrentPlanName = () => {
  try {
    const profile = getDecryptedItem('profile');
    if (!profile?.current_plan_id) return 'Free';

    switch (profile.current_plan_id) {
      case 'plan_PhmnKiiVXD3B1M':
        return 'Basic';
      case 'plan_PhmnlqjWH24hwy':
        return 'Pro';
      case 'plan_Phmo9yOZAKb0P8':
        return 'Premium';
      default:
        return 'Free';
    }
  } catch (error) {
    console.error('Error getting plan name:', error);
    return 'Free';
  }
};

// Function to get remaining tokens
export const getRemainingTokens = () => {
  try {
    const profile = getDecryptedItem('profile');
    if (!profile) return 0;
    return Math.max(1000 - profile.total_tokens, 0);
  } catch (error) {
    console.error('Error getting remaining tokens:', error);
    return 0;
  }
};

