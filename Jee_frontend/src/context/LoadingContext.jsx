import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthLoader from '../components/AuthLoader';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
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

  return (
    <LoadingContext.Provider value={{ isAuthLoading, setIsAuthLoading }}>
      {children}
      {isAuthLoading && <AuthLoader />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
