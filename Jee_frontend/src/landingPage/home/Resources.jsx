import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Resources = () => {
  const resources = [
    {
      title: "NCERT Books & Solutions",
      features: [
        "Complete NCERT solutions with detailed explanations",
        "Chapter-wise important concepts and formulas",
        "Visual explanations of complex topics"
      ],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: "Previous Year Papers",
      features: [
        "Last 15 years' JEE papers with solutions",
        "Topic-wise question classification",
        "Difficulty-level analysis for better preparation"
      ],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "Mock Tests",
      features: [
        "Weekly mock tests following JEE pattern",
        "Personalized performance analysis",
        "Question paper discussion sessions"
      ],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      title: "AI Learning Assistant",
      features: [
        "24/7 doubt resolution support",
        "Concept clarification with examples",
        "Personalized learning recommendations"
      ],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100
      }
    }
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        damping: 12
      }
    }
  };

  return (
    <section className="relative py-20 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/90" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Comprehensive Study Resources
          </h2>
          <p className="text-lg text-gray-300">
            Everything you need for your JEE preparation journey
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {resources.map((resource, index) => (
            <motion.div 
              key={index}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.02,
                y: -5
              }}
              className="group relative p-8 rounded-2xl transition-all duration-300
                        bg-gray-900/50 border border-gray-800 backdrop-blur-sm
                        hover:bg-gray-800/50 hover:border-blue-500/50"
            >
              <div className="flex items-start gap-6">
                <motion.div 
                  className="w-14 h-14 flex items-center justify-center rounded-xl 
                            bg-gradient-to-r from-blue-600 to-purple-600 text-white
                            group-hover:scale-110 transition-all duration-300"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {resource.icon}
                </motion.div>

                <div className="flex-1">
                  <motion.h3 
                    className="text-xl font-semibold mb-4 text-gray-100
                              group-hover:text-blue-400 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    {resource.title}
                  </motion.h3>

                  <motion.ul className="space-y-3">
                    {resource.features.map((feature, idx) => (
                      <motion.li 
                        key={idx} 
                        variants={listItemVariants}
                        className="flex items-start gap-3"
                      >
                        <motion.div 
                          className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full 
                                    bg-blue-900/50 text-blue-400
                                    flex items-center justify-center"
                          whileHover={{ scale: 1.2 }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                        <span className="text-gray-400 group-hover:text-gray-300 transition-colors">
                          {feature}
                        </span>
                      </motion.li>
                    ))}
                  </motion.ul>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Resources; 