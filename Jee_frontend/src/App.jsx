import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { LoadingProvider } from './context/LoadingContext';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const App = () => {
  const location = useLocation();

  useEffect(() => {
    // Make setGlobalLoading available globally
    window.setGlobalLoading = (loading) => {
      const event = new CustomEvent('setLoading', { detail: loading });
      window.dispatchEvent(event);
    };
  }, []);

  return (
    <BrowserRouter>
      <LoadingProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <div className="min-h-screen text-white">
              <AppRoutes />
            </div>
          </SubscriptionProvider>
        </AuthProvider>
      </LoadingProvider>
    </BrowserRouter>
  );
};

export default App;