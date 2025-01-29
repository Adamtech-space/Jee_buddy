import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiInstance from '../../interceptors/axios';
import { useLoading } from '../../context/LoadingContext';
import AuthLoader from '../../components/AuthLoader';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setIsLoading, setIsAuthenticated } = useLoading();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsLoading(true); // Show loader immediately
        const code = new URLSearchParams(window.location.search).get('code');
        if (!code) {
          setIsLoading(false);
          navigate('/login', { replace: true });
          return;
        }

        // Clean URL before making request
        window.history.replaceState({}, document.title, window.location.pathname);
        
        const response = await apiInstance.get(`/auth/google/callback?code=${code}`);

        if (response.data.tokens && response.data.user) {
          // Store tokens and user data
          localStorage.setItem('tokens', JSON.stringify(response.data.tokens));
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Set authentication state
          setIsAuthenticated(true);
          setIsLoading(false);

          // Navigate to subject selection
          navigate('/subject-selection', { replace: true });
        } else {
          console.error('Invalid response data:', response.data);
          setIsLoading(false);
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Auth error:', error.response?.data?.message || error.message);
        setIsLoading(false);
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, setIsLoading, setIsAuthenticated]);

  // Return AuthLoader directly for faster visual feedback
  return <AuthLoader />;
};

export default AuthCallback; 