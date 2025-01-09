import { useState } from 'react';
import AppRoutes from './routes';

function App() {
  const [quote] = useState({
    text: "The only way to learn mathematics is to do mathematics.",
    author: "Paul Halmos"
  });

  return (
    <div className="min-h-screen text-white">
      <AppRoutes quote={quote} />
    </div>
  );
}

export default App;