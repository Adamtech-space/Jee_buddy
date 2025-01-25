import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import AuthLoader from '../components/AuthLoader';

const LoadingContext = createContext();

// Synchronous auth check function to reuse
const checkAuthStatus = () => {
  try {
    return Boolean(localStorage.getItem('tokens') && localStorage.getItem('user'));
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

export const LoadingProvider = ({ children }) => {
  // Initialize with precomputed auth status for faster initial load
  const [isLoading, setIsLoading] = useState(() => !checkAuthStatus());
  const [isAuthenticated, setIsAuthenticated] = useState(() => checkAuthStatus());

  // Memoized auth update function
  const updateAuth = useCallback((status) => {
    setIsAuthenticated(status);
    setIsLoading(false);
  }, []);

  // Optimized loading effect with debounce
  useEffect(() => {
    if (!isLoading) {
      document.body.style.overflow = 'unset';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLoading]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isLoading,
    setIsLoading,
    isAuthenticated,
    setIsAuthenticated: updateAuth
  }), [isLoading, isAuthenticated, updateAuth]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {isLoading && <AuthLoader />}
    </LoadingContext.Provider>
  );
};

LoadingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useLoading = () => useContext(LoadingContext);
