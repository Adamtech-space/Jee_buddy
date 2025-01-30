import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import AuthLoader from '../components/AuthLoader';
import { useLocation } from 'react-router-dom';

const LoadingContext = createContext();

// Simplified auth validation
const validateAuthTokens = async () => {
  const tokens = JSON.parse(localStorage.getItem('tokens'));
  return !!tokens; // Direct boolean conversion
};

export const LoadingProvider = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const initialCheckDone = useRef(false);
  const loadingTimeoutRef = useRef(null);

  // Single source auth check
  useEffect(() => {
    const checkAuth = async () => {
      if (initialCheckDone.current) return;
      initialCheckDone.current = true;
      
      const isValid = await validateAuthTokens();
      setIsAuthenticated(isValid);
      setIsLoading(false);
    };

    // Only check auth if not coming from auth flow
    if (!location.state?.fromAuth) {
      checkAuth();
    } else {
      // If coming from auth flow, trust the auth state
      setIsLoading(false);
    }
  }, [location.state]);

  // Replace the debouncedSetLoading function with:
  const setLoadingDirect = useCallback((value) => {
    // Clear any pending timeouts first
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    setIsLoading(value);
  }, []);

  // Route change handler
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleRouteChange = () => {
      if (location.state?.fromAuth) return;
      
      setLoadingDirect(true);
      const timer = setTimeout(() => setLoadingDirect(false), 50);
      return () => clearTimeout(timer);
    };

    handleRouteChange();
  }, [location.pathname, isAuthenticated, setLoadingDirect, location.state]);

  // Global loading control
  useEffect(() => {
    const handleGlobalLoading = (event) => {
      setLoadingDirect(event.detail.loading);
    };
    window.addEventListener('setLoading', handleGlobalLoading);
    return () => window.removeEventListener('setLoading', handleGlobalLoading);
  }, [setLoadingDirect]);

  // Scroll prevention with cleanup
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
      return;
    }
    
    const timer = setTimeout(() => {
      document.body.style.overflow = 'unset';
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'unset';
    };
  }, [isLoading]);

  // Context value memoization
  const contextValue = useMemo(() => ({
    isLoading,
    setIsLoading: setLoadingDirect,
    isAuthenticated,
    setIsAuthenticated: setIsAuthenticated,
  }), [isLoading, setLoadingDirect, isAuthenticated]);

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