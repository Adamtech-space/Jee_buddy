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
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth error:', error.response?.data?.message || error.message);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="eclipse-loader">
        <style>
          {`
            .eclipse-loader {
              width: 64px;
              height: 64px;
              position: relative;
              background: transparent;
              border-radius: 50%;
              perspective: 1000px;
            }

            .eclipse-loader::before {
              content: '';
              position: absolute;
              width: 16px;
              height: 16px;
              background: #3B82F6;
              border-radius: 50%;
              top: 0;
              left: 50%;
              transform-origin: 50% 32px;
              animation: eclipse 0.4s linear infinite;
            }

            @keyframes eclipse {
              0% {
                transform: rotate(0deg) translateX(0) rotate(0deg);
              }
              100% {
                transform: rotate(360deg) translateX(0) rotate(-360deg);
              }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default AuthCallback; 