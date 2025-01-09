import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiInstance from '../../interceptors/axios';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = new URLSearchParams(window.location.search).get('code');
        if (!code) {
          console.error('No code found in URL');
          navigate('/login');
          return;
        }

        window.history.replaceState({}, document.title, window.location.pathname);

        const response = await apiInstance.get(`/auth/google/callback?code=${code}`);
        
        if (response.data.tokens && response.data.user) {
          localStorage.setItem('tokens', JSON.stringify(response.data.tokens));
          localStorage.setItem('user', JSON.stringify(response.data.user));
          navigate('/subject-selection');
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Auth error:', error.response?.data?.message || error.message);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
        <p>Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 