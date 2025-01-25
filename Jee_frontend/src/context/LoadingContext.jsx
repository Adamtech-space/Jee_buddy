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
  // Initialize with true to show loader during initial auth check
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => checkAuthStatus());

  // Initial auth check with loader
  useEffect(() => {
    const initialAuthCheck = async () => {
      // Show loader for at least 1 second for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };
    initialAuthCheck();
  }, []);

  // Clear loading state on route changes, but not during initial load
  useEffect(() => {
    if (!isLoading) return; // Skip if already not loading
    
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, isLoading]);

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
      console.warn('Loading timeout reached - forcing state clear');
      setIsLoading(false);
    }, 8000); // Increased to 8 seconds for better reliability

    return () => {
      document.body.style.overflow = 'unset';
      clearTimeout(maxLoadingTimeout);
    };
  }, [isLoading]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isLoading,
    setIsLoading: (value) => {
      if (value) {
        setIsLoading(true);
      } else {
        // Small delay when hiding loader for smooth transition
        setTimeout(() => setIsLoading(false), 300);
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
