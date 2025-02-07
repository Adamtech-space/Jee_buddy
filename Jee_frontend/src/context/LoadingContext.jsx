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
import { getDecryptedItem } from '../utils/encryption';

const LoadingContext = createContext();

// Routes that should skip the loading animation
const SKIP_LOADER_ROUTES = [
  '/dashboard/physics/books',
  '/dashboard/physics/flashcards',
  '/dashboard/physics/materials',
  '/dashboard/physics/question-bank',
];

// Function to check if current path should skip loader
const shouldSkipLoader = (pathname) => {
  return SKIP_LOADER_ROUTES.some(route => pathname.includes(route));
};

// Improved auth validation
const validateAuthTokens = async () => {
  try {
    const tokens = getDecryptedItem('tokens');
    const user = getDecryptedItem('user');

    return !!(tokens?.access?.token && user); // Check both tokens and user exist
  } catch (error) {
    console.error('Auth validation error:', error);
    return false;
  }
};

export const LoadingProvider = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const initialCheckDone = useRef(false);
  const loadingTimeoutRef = useRef(null);

  // Single source auth check
  useEffect(() => {
    const checkAuth = async () => {
      if (initialCheckDone.current) {
        return;
      }

      try {
        const isValid = await validateAuthTokens();
        setIsAuthenticated(isValid);
      } catch (error) {
        console.error('Auth check failed:', error);
        setError(error);
        setIsAuthenticated(false);
      } finally {
        initialCheckDone.current = true;
        setIsLoading(false);
      }
    };

    if (!location.state?.fromAuth) {
      checkAuth();
    } else {
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [location.state]);

  const setLoadingDirect = useCallback((value) => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    setIsLoading(value);
  }, []);

  // Route change handler with smoother transitions
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleRouteChange = () => {
      if (location.state?.fromAuth) return;
      if (shouldSkipLoader(location.pathname)) {
        setLoadingDirect(false);
        return;
      }

      setLoadingDirect(true);
      loadingTimeoutRef.current = setTimeout(() => setLoadingDirect(false), 50);
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
  const contextValue = useMemo(
    () => ({
      isLoading,
      setIsLoading: setLoadingDirect,
      isAuthenticated,
      setIsAuthenticated,
      error,
    }),
    [isLoading, setLoadingDirect, isAuthenticated, error]
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4 max-w-lg w-full">
          <h2 className="text-red-500 text-xl font-bold mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-300 mb-4">
            {error.message || 'An error occurred during authentication'}
          </p>
          <button
            onClick={() => (window.location.href = '/login')}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {isLoading && !shouldSkipLoader(location.pathname) && (
        <div className="fixed inset-0 bg-black/50 z-50 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <AuthLoader />
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

LoadingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useLoading = () => useContext(LoadingContext);