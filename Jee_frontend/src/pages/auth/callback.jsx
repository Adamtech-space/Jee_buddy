// AuthCallback.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiInstance from '../../interceptors/axios';
import { useLoading } from '../../context/LoadingContext';
import AuthLoader from '../../components/AuthLoader';

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
          await new Promise(resolve => setTimeout(resolve, 2000)); // Maintain loader for 2s
          navigate('/login', { replace: true });
          return;
        }

        // Clean URL before processing
        window.history.replaceState({}, document.title, window.location.pathname);

        const { data } = await apiInstance.get(`/auth/google/callback?code=${code}`);
        
        if (!data?.tokens || !data?.user) {
          throw new Error('Invalid authentication response');
        }

        // Atomic state update before navigation
        setIsAuthenticated(true);
        localStorage.setItem('tokens', JSON.stringify(data.tokens));
        localStorage.setItem('user', JSON.stringify(data.user));

        // Immediate navigation with state flag
        navigate('/subject-selection', { 
          replace: true,
          state: { fromAuth: true } 
        });

      } catch (error) {
        setAuthError(error.message);
        localStorage.clear();
        navigate('/login', { 
          replace: true,
          state: { error: error.message }
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