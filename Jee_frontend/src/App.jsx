import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { LoadingProvider } from './context/LoadingContext';
import { useEffect } from 'react';
import AppRoutes from './routes';
import { MathJaxContext } from 'better-react-mathjax';

// MathJax configuration
const mathJaxConfig = {
  loader: { load: ["[tex]/html"] },
  tex: {
    packages: { "[+]": ["html"] },
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"]
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"]
    ]
  }
};

const App = () => {
  useEffect(() => {
    // Make setGlobalLoading available globally
    window.setGlobalLoading = (loading) => {
      const event = new CustomEvent('setLoading', { detail: loading });
      window.dispatchEvent(event);
    };
  }, []);

  return (
    <MathJaxContext config={mathJaxConfig}>
      <LoadingProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <div className="min-h-screen text-white">
              <AppRoutes />
            </div>
          </SubscriptionProvider>
        </AuthProvider>
      </LoadingProvider>
    </MathJaxContext>
  );
};

export default App;