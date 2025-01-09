import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const words = 'Master JEE with AI'.split(' ');

  const scrollToDemo = (e) => {
    e.preventDefault();
    const demoSection = document.getElementById('demo');
    if (demoSection) {
      demoSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <section id="home" className="relative min-h-[55vh] flex items-center overflow-hidden">
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
              onClick={scrollToDemo}
              className="px-8 py-3 border-2 border-[#6366f1] text-[#6366f1] rounded-lg font-medium 
                       hover:bg-[#6366f1] hover:text-white transition-colors
                       backdrop-blur-sm bg-white/5"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
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
