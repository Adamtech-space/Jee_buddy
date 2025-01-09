import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiInstance from '../../interceptors/axios';

const LoadingMessages = [
  "Setting up your personalized study space...",
  "Preparing your learning materials...",
  "Getting your JEE resources ready...",
  "Initializing your study dashboard..."
];

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [loadingMessage, setLoadingMessage] = useState(LoadingMessages[0]);
  const [loadingIndex, setLoadingIndex] = useState(0);

  // Rotate through loading messages
  useEffect(() => {
    if (status === 'loading') {
      const interval = setInterval(() => {
        setLoadingIndex((prev) => {
          const nextIndex = (prev + 1) % LoadingMessages.length;
          setLoadingMessage(LoadingMessages[nextIndex]);
          return nextIndex;
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = new URLSearchParams(window.location.search).get('code');
        if (!code) {
          setStatus('error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        window.history.replaceState({}, document.title, window.location.pathname);
        
        const response = await apiInstance.get(`/auth/google/callback?code=${code}`);
        
        if (response.data.tokens && response.data.user) {
          localStorage.setItem('tokens', JSON.stringify(response.data.tokens));
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setStatus('success');
          setTimeout(() => navigate('/subject-selection'), 1000);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Auth error:', error.response?.data?.message || error.message);
        setStatus('error');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  const renderLoadingContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="space-y-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                  />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-500 mb-2">Welcome to JEE Buddy!</h2>
              <p className="text-lg font-medium text-white">{loadingMessage}</p>
              <p className="text-sm text-gray-400 mt-2">This may take a few moments...</p>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="space-y-6">
            <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-500 mb-2">Welcome aboard!</h2>
              <p className="text-lg font-medium text-white">Your study space is ready</p>
              <p className="text-sm text-gray-400 mt-2">Taking you to your personalized dashboard...</p>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="space-y-6">
            <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-500 mb-2">Oops!</h2>
              <p className="text-lg font-medium text-white">Something went wrong</p>
              <p className="text-sm text-gray-400 mt-2">Please try signing in again...</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full border border-gray-700">
        <div className="text-center">
          {renderLoadingContent()}
        </div>
        <div className="mt-8 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              status === 'error' ? 'bg-red-500' : 
              status === 'success' ? 'bg-green-500' : 'bg-blue-500'
            } ${
              status === 'loading' ? 'animate-progress' : 'w-full'
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback; 