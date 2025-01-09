import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Pricing = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0,
      y: 50
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100
      }
    }
  };

  return (
    <section id="pricing" className="relative py-32 bg-black overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/90" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-300">
            Choose the plan that works best for you
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto -mt-6"
        >
          {[
            {
              name: "Basic",
              price: "₹999",
              duration: "/month",
              features: [
                "Access to AI Learning Assistant",
                "Basic Study Materials",
                "Practice Questions",
                "Progress Tracking",
                "Email Support"
              ]
            },
            {
              name: "Pro",
              price: "₹1,999",
              duration: "/month",
              popular: true,
              features: [
                "Everything in Basic",
                "Advanced Study Materials",
                "Mock Tests",
                "Personalized Learning Path",
                "Priority Support",
                "Performance Analytics"
              ]
            },
            {
              name: "Premium",
              price: "₹2,999",
              duration: "/month",
              features: [
                "Everything in Pro",
                "1-on-1 Mentoring",
                "Live Doubt Sessions",
                "Interview Preparation",
                "Career Guidance",
                "Lifetime Access"
              ]
            }
          ].map((plan, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ 
                y: -10,
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className={`relative p-8 rounded-2xl transition-all duration-300
                         backdrop-blur-md bg-gray-900/50 border border-gray-800
                         hover:bg-gray-800/50 hover:border-blue-500/50 shadow-xl
                         ${plan.popular ? 'md:-mt-8 z-10' : ''}
                         ${index === 1 ? 'md:scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 
                               bg-gradient-to-r from-blue-600 to-purple-600
                               text-white text-sm rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-100 mb-4">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-transparent bg-clip-text 
                                 bg-gradient-to-r from-blue-400 to-purple-400">
                    {plan.price}
                  </span>
                  <span className="text-gray-400">{plan.duration}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                className={`w-full py-3 rounded-lg transition-all duration-300 transform
                           ${plan.popular 
                             ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                             : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 hover:border-blue-500'}`}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
