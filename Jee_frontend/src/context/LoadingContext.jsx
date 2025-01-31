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

// Improved auth validation
const validateAuthTokens = async () => {
  try {
    console.log('Validating auth tokens...');
    const tokens = getDecryptedItem('tokens');
    const user = getDecryptedItem('user');

    console.log('Auth validation:', {
      hasTokens: !!tokens,
      hasUser: !!user,
      tokenValid: !!tokens?.access?.token,
      userValid: !!user?.id,
    });

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
        console.log('Initial auth check already done');
        return;
      }

      console.log('Performing initial auth check...');
      try {
        const isValid = await validateAuthTokens();
        console.log('Auth check result:', isValid);
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

    // Only check auth if not coming from auth flow
    if (!location.state?.fromAuth) {
      checkAuth();
    } else {
      console.log('Coming from auth flow, trusting auth state');
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [location.state]);

  // Replace the debouncedSetLoading function with:
  const setLoadingDirect = useCallback((value) => {
    console.log('Setting loading state:', value);
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

      console.log('Route changed, updating loading state');
      setLoadingDirect(true);
      const timer = setTimeout(() => setLoadingDirect(false), 50);
      return () => clearTimeout(timer);
    };

    handleRouteChange();
  }, [location.pathname, isAuthenticated, setLoadingDirect, location.state]);

  // Global loading control
  useEffect(() => {
    const handleGlobalLoading = (event) => {
      console.log('Global loading event:', event.detail);
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
      {isLoading && <AuthLoader />}
    </LoadingContext.Provider>
  );
};

LoadingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useLoading = () => useContext(LoadingContext);