import { useState } from 'react';
import AppRoutes from './routes';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [quote] = useState({
    text: "The only way to learn mathematics is to do mathematics.",
    author: "Paul Halmos"
  });

  return (
    <AuthProvider>
      <div className="min-h-screen text-white">
        <AppRoutes quote={quote} />
      </div>
    </AuthProvider>
  );
}

export default App;