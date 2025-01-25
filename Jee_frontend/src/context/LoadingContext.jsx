import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AuthLoader from '../components/AuthLoader';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const tokens = localStorage.getItem('tokens');
    const user = localStorage.getItem('user');
    return Boolean(tokens && user);
  });

  const updateAuth = (status) => {
    setIsAuthenticated(status);
    // Add a small delay before removing loader
    setTimeout(() => setIsAuthLoading(false), 300);
  };

  // Handle loading states
  useEffect(() => {
    const handleLoading = (event) => {
      const isAuthEndpoint = event.detail.url?.includes('/auth/');
      const isSubscriptionEndpoint = event.detail.url?.includes('/subscription/');

      if (isAuthEndpoint) {
        setIsAuthLoading(event.detail.loading);
      } else if (isSubscriptionEndpoint) {
        setIsSubscriptionLoading(event.detail.loading);
      } else {
        setIsLoading(event.detail.loading);
      }
    };

    window.addEventListener('setLoading', handleLoading);
    return () => window.removeEventListener('setLoading', handleLoading);
  }, []);

  // Handle scroll locking
  useEffect(() => {
    const isAnyLoading = isLoading || isAuthLoading || isSubscriptionLoading;
    
    if (isAnyLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      // Add a small delay before enabling scroll
      setTimeout(() => {
        document.body.style.overflow = 'unset';
      }, 300);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLoading, isAuthLoading, isSubscriptionLoading]);

  return (
    <LoadingContext.Provider value={{ 
      isLoading, 
      setIsLoading,
      isAuthLoading,
      setIsAuthLoading,
      isSubscriptionLoading,
      setIsSubscriptionLoading,
      isAuthenticated,
      setIsAuthenticated: updateAuth
    }}>
      {children}
      {(isLoading || isAuthLoading || isSubscriptionLoading) && <AuthLoader />}
    </LoadingContext.Provider>
  );
};

LoadingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useLoading = () => useContext(LoadingContext);
