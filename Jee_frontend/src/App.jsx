import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { LoadingProvider } from './context/LoadingContext';
import { useEffect, useState } from 'react';
import AppRoutes from './routes';
import { MathJaxContext } from 'better-react-mathjax';

// MathJax configuration
const mathJaxConfig = {
  loader: { load: ['[tex]/html'] },
  tex: {
    packages: { '[+]': ['html'] },
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
    ],
    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]'],
    ],
  },
};

// Error Boundary Component
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (error) => {
      console.error('App Error:', error);
      setError(error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4 max-w-lg w-full">
          <h2 className="text-red-500 text-xl font-bold mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-300 mb-4">
            {error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return children;
};

const App = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      // Make setGlobalLoading available globally
      window.setGlobalLoading = (loading) => {
        const event = new CustomEvent('setLoading', { detail: loading });
        window.dispatchEvent(event);
      };

      setInitialized(true);
    } catch (error) {
      console.error('App initialization error:', error);
    }
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Initializing...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <MathJaxContext config={mathJaxConfig}>
        <LoadingProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <div className="min-h-screen">
                <AppRoutes />
              </div>
            </SubscriptionProvider>
          </AuthProvider>
        </LoadingProvider>
      </MathJaxContext>
    </ErrorBoundary>
  );
};

export default App;