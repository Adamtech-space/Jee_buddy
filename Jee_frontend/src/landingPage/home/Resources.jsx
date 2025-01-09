import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Resources = () => {
  const resources = [
    {
      title: 'NCERT Books & Solutions',
      features: [
        'Complete NCERT solutions with detailed explanations',
        'Chapter-wise important concepts and formulas',
        'Visual explanations of complex topics',
      ],
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      title: 'Previous Year Papers',
      features: [
        "Last 15 years' JEE papers with solutions",
        'Topic-wise question classification',
        'Difficulty-level analysis for better preparation',
      ],
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.9,
      rotateX: -15,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 100,
        duration: 0.6,
      },
    },
  };

  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section
      id="resources"
      className="relative py-20 overflow-hidden bg-transparent"
    >
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">
            Comprehensive Study Resources
          </h2>
          <p className="text-lg text-gray-300">
            Everything you need for your JEE preparation journey
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {resources.map((resource, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                y: -5,
                transition: { duration: 0.2 },
              }}
              className="group relative p-8 rounded-2xl transition-all duration-300
                        bg-white/10 border border-white/20
                        hover:bg-white/15 hover:border-[#6366f1]/50"
            >
              <motion.div
                className="flex items-start gap-6"
                initial={{ x: -20, opacity: 0 }}
                animate={inView ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="w-12 h-12 flex items-center justify-center rounded-xl 
                            bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white
                            group-hover:scale-110 transition-all duration-300"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {resource.icon}
                </motion.div>

                <div className="flex-1">
                  <motion.h3
                    className="text-xl font-semibold mb-4 text-white
                              group-hover:text-[#8b5cf6] transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    {resource.title}
                  </motion.h3>

                  <motion.ul className="space-y-3">
                    {resource.features.map((feature, idx) => (
                      <motion.li
                        key={idx}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={
                          inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
                        }
                        transition={{ delay: 0.3 + idx * 0.1 }}
                      >
                        <motion.div
                          className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full 
                                    bg-[#6366f1]/20 text-[#6366f1]
                                    flex items-center justify-center"
                          whileHover={{ scale: 1.2 }}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </motion.div>
                        <span className="text-gray-200 group-hover:text-white transition-colors">
                          {feature}
                        </span>
                      </motion.li>
                    ))}
                  </motion.ul>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Resources;
