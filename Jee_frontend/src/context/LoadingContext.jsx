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

// Synchronous auth check function to reuse
const checkAuthStatus = () => {
  try {
    return Boolean(
      localStorage.getItem('tokens') && localStorage.getItem('user')
    );
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

export const LoadingProvider = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    checkAuthStatus()
  );
  const loadingTimeoutRef = useRef(null);

  // Super quick loading setter
  const debouncedSetLoading = useCallback((value) => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    if (value) {
      setIsLoading(true);
    } else {
      loadingTimeoutRef.current = setTimeout(() => setIsLoading(false), 20);
    }
  }, []);

  // Quick initial auth check
  useEffect(() => {
    debouncedSetLoading(false);
    return () =>
      loadingTimeoutRef.current && clearTimeout(loadingTimeoutRef.current);
  }, [debouncedSetLoading]);

  // Quick route change loader
  useEffect(() => {
    if (!isAuthenticated) return;

    const majorRoutePaths = [
      '/login',
      '/register',
      '/subject-selection',
      '/settings',
    ];
    if (majorRoutePaths.some((path) => location.pathname.startsWith(path))) {
      debouncedSetLoading(true);
      loadingTimeoutRef.current = setTimeout(
        () => debouncedSetLoading(false),
        50
      );
    }

    return () =>
      loadingTimeoutRef.current && clearTimeout(loadingTimeoutRef.current);
  }, [location.pathname, isAuthenticated, debouncedSetLoading]);

  // Global loading events
  useEffect(() => {
    const handleGlobalLoading = (event) =>
      debouncedSetLoading(event.detail.loading);
    window.addEventListener('setLoading', handleGlobalLoading);
    return () => window.removeEventListener('setLoading', handleGlobalLoading);
  }, [debouncedSetLoading]);

  // Quick auth update
  const updateAuth = useCallback(
    (status) => {
      setIsAuthenticated(status);
      debouncedSetLoading(true);
      loadingTimeoutRef.current = setTimeout(
        () => debouncedSetLoading(false),
        50
      );
    },
    [debouncedSetLoading]
  );

  // Prevent scroll during loading with short timeout
  useEffect(() => {
    if (!isLoading) {
      document.body.style.overflow = 'unset';
      return;
    }
    document.body.style.overflow = 'hidden';
    const maxTimeout = setTimeout(() => debouncedSetLoading(false), 500);
    return () => {
      document.body.style.overflow = 'unset';
      clearTimeout(maxTimeout);
    };
  }, [isLoading, debouncedSetLoading]);

  const contextValue = useMemo(
    () => ({
      isLoading,
      setIsLoading: debouncedSetLoading,
      isAuthenticated,
      setIsAuthenticated: updateAuth,
    }),
    [isLoading, debouncedSetLoading, isAuthenticated, updateAuth]
  );

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
