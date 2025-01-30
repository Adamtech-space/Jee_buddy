import { Link } from 'react-router-dom';

const Hero = ({ quote }) => {
  return (
    <section className="hero-section min-h-screen flex items-center text-center relative overflow-hidden">
      {/* rr */}

      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 z-0"></div>
      <div className="container mx-auto px-4 relative z-10">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-[slideInDown_1s_ease]">
          Master JEE with AI-Powered Learning
        </h1>
        <p className="text-xl md:text-2xl mb-8 animate-[fadeIn_2s_ease]">
          Personalized preparation strategy, instant feedback, and expert
          guidance at your fingertips
        </p>
        <div
          id="quote-container"
          className="mb-8 bg-black/50 p-6 rounded-lg max-w-3xl mx-auto"
        >
          <p className="quote-text text-lg italic mb-2">{quote?.text}</p>
          <p className="quote-author text-blue-500 font-medium">
            {quote?.author}
          </p>
        </div>
        <Link
          to="/login"
          className="inline-block bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors transform hover:scale-105 duration-200"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
};

export default Hero;
