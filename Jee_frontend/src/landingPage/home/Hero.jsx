import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const words = 'Master JEE with AI'.split(' ');

  const handleTryNow = () => {
    navigate('/login');
  };

  return (
    <section
      id="home"
      className="relative min-h-[55vh] flex items-center overflow-hidden"
    >
      <div className="container mx-auto px-4 relative pt-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mr-2"
                variants={{
                  hidden: {
                    opacity: 0,
                    y: 20,
                    rotate: -5,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    rotate: 0,
                    transition: {
                      type: 'spring',
                      damping: 10,
                    },
                  },
                }}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            className="text-xl text-gray-200 mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate={isVisible ? 'visible' : 'hidden'}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Your personalized AI tutor for JEE preparation. Get instant help,
            practice questions, and detailed explanations.
          </motion.p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={handleTryNow}
              className="px-8 py-3.5 bg-sky-800 hover:bg-blue-700 text-white 
                       rounded-lg font-semibold transition-all duration-300
                       hover:shadow-lg hover:shadow-sky-500/30 
                       transform hover:-translate-y-0.5"
              whileHover={{
                scale: 1.05,
                backgroundColor: '#1d4ed8', // bright blue color
              }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              Try Now
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
