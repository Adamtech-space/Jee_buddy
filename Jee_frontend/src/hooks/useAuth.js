import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setEncryptedItem, getDecryptedItem, removeItem } from '../utils/encryption';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage on mount
    const userData = getDecryptedItem('user');
    if (userData) {
      setUser(userData);
    }
  }, []);

  const login = (userData) => {
    // Save user data to localStorage with encryption
    setEncryptedItem('user', userData);
    setUser(userData);
  };

  const logout = () => {
    // Clear user data from localStorage
    removeItem('user');
    removeItem('sessionId');
    setUser(null);
    navigate('/login');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setEncryptedItem('user', updatedUser);
    setUser(updatedUser);
  };

  return {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  };
}; 