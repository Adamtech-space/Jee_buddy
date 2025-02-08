// AuthCallback.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiInstance from '../../interceptors/axios';
import { useLoading } from '../../context/LoadingContext';
import AuthLoader from '../../components/AuthLoader';
import { setEncryptedItem, getDecryptedItem } from '../../utils/encryption';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setIsLoading, setIsAuthenticated } = useLoading();
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      setIsLoading(true);
      try {
        const code = new URLSearchParams(window.location.search).get('code');

        if (!code) {
          setAuthError('Authentication failed - Missing authorization code');
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Maintain loader for 2s
          navigate('/login', { replace: true });
          return;
        }

        // Clean URL before processing
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        const { data } = await apiInstance.get(
          `/auth/google/callback?code=${code}`
        );

        if (!data?.tokens?.access?.token || !data.user) {
          throw new Error('Invalid token response from server');
        }

        // Delay state update to ensure token is set
        await new Promise(resolve => setTimeout(resolve, 100));
        setEncryptedItem('tokens', data.tokens);
        setEncryptedItem('user', data.user);

        // Verify token was stored correctly
        const storedTokens = getDecryptedItem('tokens');
        if (!storedTokens?.access?.token) {
          throw new Error('Failed to persist authentication tokens');
        }

        // Atomic state update before navigation
        setIsAuthenticated(true);

        // Immediate navigation with state flag
        navigate('/subject-selection', {
          replace: true,
          state: { fromAuth: true },
        });
      } catch (error) {
        setAuthError(error.message);
        localStorage.clear(); // Keep this to clear any other potential items
        navigate('/login', {
          replace: true,
          state: { error: error.message },
        });
      } finally {
        // Sync loading state with navigation completion
        setTimeout(() => setIsLoading(false), 300);
      }
    };

    handleAuthCallback();
  }, [navigate, setIsLoading, setIsAuthenticated]);

  return <AuthLoader errorMessage={authError} />;
};

export default AuthCallback;