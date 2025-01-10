import AppRoutes from './routes';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen text-white">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
}

export default App;