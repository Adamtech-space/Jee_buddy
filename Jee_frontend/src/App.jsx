import { useState } from 'react';
import Navbar from './components/Navbar';
import AppRoutes from './routes';

function App() {
  const [quote] = useState({
    text: "The only way to learn mathematics is to do mathematics.",
    author: "Paul Halmos"
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="pt-16">
        <AppRoutes quote={quote} />
      </main>
    </div>
  );
}

export default App;