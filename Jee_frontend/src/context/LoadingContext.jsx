import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthLoader from '../components/AuthLoader';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Start with loading true
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Function to check if the app is ready
    const checkInitialization = async () => {
      try {
        // Check for existing auth
        const tokens = localStorage.getItem('tokens');
        const user = localStorage.getItem('user');

        // Add any other initialization checks here

        setIsInitialized(true);
        // Only stop loading if we're not in the middle of an auth operation
        setIsAuthLoading(false);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsInitialized(true);
        setIsAuthLoading(false);
      }
    };

    checkInitialization();

    const handleLoading = (event) => {
      // Only set loading for auth-related endpoints
      const isAuthEndpoint = event.detail.url?.includes('/auth/');
      if (isAuthEndpoint) {
        setIsAuthLoading(event.detail.loading);
        // Prevent scrolling when loader is shown
        if (event.detail.loading) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = 'unset';
        }
      }
    };

    window.addEventListener('setLoading', handleLoading);
    return () => {
      window.removeEventListener('setLoading', handleLoading);
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!isInitialized) {
    return <AuthLoader />;
  }

  return (
    <LoadingContext.Provider value={{ isAuthLoading, setIsAuthLoading }}>
      {children}
      {isAuthLoading && <AuthLoader />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
