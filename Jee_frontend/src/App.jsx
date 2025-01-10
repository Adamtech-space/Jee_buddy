import AppRoutes from './routes';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <div className="min-h-screen text-white">
          <AppRoutes />
        </div>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;