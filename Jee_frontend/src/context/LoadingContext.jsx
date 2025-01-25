import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import AuthLoader from '../components/AuthLoader';
import { useLocation } from 'react-router-dom';

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
  const location = useLocation();
  // Initialize with precomputed auth status for faster initial load
  const [isLoading, setIsLoading] = useState(() => !checkAuthStatus());
  const [isAuthenticated, setIsAuthenticated] = useState(() => checkAuthStatus());

  // Clear loading state on route changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Small delay to ensure smooth transitions

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  // Memoized auth update function
  const updateAuth = useCallback((status) => {
    setIsAuthenticated(status);
    // Use RAF for smoother state updates
    requestAnimationFrame(() => {
      setIsLoading(false);
    });
  }, []);

  // Optimized loading effect with cleanup
  useEffect(() => {
    if (!isLoading) {
      document.body.style.overflow = 'unset';
      return;
    }

    document.body.style.overflow = 'hidden';
    
    // Auto-clear loading state after maximum timeout
    const maxLoadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5 second maximum loading time

    return () => {
      document.body.style.overflow = 'unset';
      clearTimeout(maxLoadingTimeout);
    };
  }, [isLoading]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isLoading,
    setIsLoading: (value) => {
      // If setting to true, allow it
      // If setting to false, add small delay for smooth transition
      if (value) {
        setIsLoading(true);
      } else {
        setTimeout(() => setIsLoading(false), 100);
      }
    },
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
