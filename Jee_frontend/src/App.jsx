import AppRoutes from './routes';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { LoadingProvider } from './context/LoadingContext';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Make setGlobalLoading available globally
    window.setGlobalLoading = (loading) => {
      const event = new CustomEvent('setLoading', { detail: loading });
      window.dispatchEvent(event);
    };
  }, []);

  return (
    <LoadingProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <div className="min-h-screen text-white">
            <AppRoutes />
          </div>
        </SubscriptionProvider>
      </AuthProvider>
    </LoadingProvider>
  );
}

export default App;