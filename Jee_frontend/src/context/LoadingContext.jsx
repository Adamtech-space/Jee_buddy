import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthLoader from '../components/AuthLoader';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

  useEffect(() => {
    const handleLoading = (event) => {
      // Handle both auth and subscription endpoints
      const isAuthEndpoint = event.detail.url?.includes('/auth/');
      const isSubscriptionEndpoint =
        event.detail.url?.includes('/subscription/');

      if (isAuthEndpoint) {
        setIsAuthLoading(event.detail.loading);
      } else if (isSubscriptionEndpoint) {
        setIsSubscriptionLoading(event.detail.loading);
      }

      // Prevent scrolling when any loader is shown
      if (event.detail.loading) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    };

    window.addEventListener('setLoading', handleLoading);
    return () => {
      window.removeEventListener('setLoading', handleLoading);
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        isAuthLoading,
        setIsAuthLoading,
        isSubscriptionLoading,
        setIsSubscriptionLoading,
      }}
    >
      {children}
      {(isAuthLoading || isSubscriptionLoading) && <AuthLoader />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
