import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
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

  const floatingElements = [
    { type: 'formula', content: 'E = mc²', size: 'text-3xl' },
    { type: 'formula', content: '∫(x²)dx', size: 'text-3xl' },
    { type: 'formula', content: 'F = ma', size: 'text-2xl' },
    { type: 'formula', content: 'PV = nRT', size: 'text-2xl' },
  ];

  return (
    <section className="hero-section relative min-h-screen bg-black flex items-center overflow-hidden">
      {dimensions.width > 0 &&
        floatingElements.map((element, index) => (
          <motion.div
            key={index}
            className={`absolute text-gray-600/20 ${element.size || ''}`}
            initial={{
              x: Math.random() * dimensions.width,
              y: Math.random() * dimensions.height,
            }}
            animate={{
              x: [
                Math.random() * dimensions.width,
                Math.random() * dimensions.width,
                Math.random() * dimensions.width,
              ],
              y: [
                Math.random() * dimensions.height,
                Math.random() * dimensions.height,
                Math.random() * dimensions.height,
              ],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
            }}
          >
            {element.type === 'formula' ? element.content : element.icon}
          </motion.div>
        ))}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900/90" />

      <div className="container mx-auto px-4 relative py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Animated Title */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
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

          {/* Animated Subtitle */}
          <motion.p
            className="text-xl text-gray-300 mb-8"
            variants={fadeInUp}
            initial="hidden"
            animate={isVisible ? 'visible' : 'hidden'}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Your personalized AI tutor for JEE preparation. Get instant help,
            practice questions, and detailed explanations.
          </motion.p>

          {/* Interactive CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={scrollToDemo}
              className="px-8 py-3 border-2 border-blue-500 text-blue-400 rounded-lg font-medium 
                         hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              Try Now
            </motion.button>
          </div>

          {/* Floating Stats */}
          {/* <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-8">
            {[
              { number: '10K+', label: 'Students' },
              { number: '95%', label: 'Success Rate' },
              { number: '24/7', label: 'Support' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="p-4 bg-gray-800/50 rounded-lg shadow-lg border border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.2 }}
                whileHover={{
                  y: -5,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                }}
              >
                <motion.h3
                  className="text-2xl font-bold text-blue-400"
                  whileHover={{ scale: 1.1 }}
                >
                  {stat.number}
                </motion.h3>
                <p className="text-gray-300">{stat.label}</p>
              </motion.div>
            ))}
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default Hero;
