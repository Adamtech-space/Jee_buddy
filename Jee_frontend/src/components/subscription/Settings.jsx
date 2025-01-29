import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const navigate = useNavigate();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 100,
      },
    },
  };

  return (
    <section id="pricing" className="relative py-20 overflow-hidden">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 text-gray-300 
                   hover:text-white bg-[#4a1942]/40 rounded-lg border border-[#6e2960]/50 
                   hover:bg-[#4a1942]/60 transition-all duration-300"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back
      </button>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-20 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Choose the plan that works best for you
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-3  gap-6 max-w-6xl mx-auto"
        >
          {[
            {
              name: 'Basic',
              price: '₹499',
              duration: '/month',
              features: [
                'Access to AI Learning Assistant',
                'Basic Study Materials',
                'Limited AI Usage',
                'Email Support',
              ],
            },
            {
              name: 'Pro',
              price: '₹1,499',
              duration: '/month',
              popular: true,
              features: [
                'Everything in Basic',
                'Extra AI Usage',
                'Advanced Study Materials',
                'Question Bank',
                'Strength and Weakness Analysis',
              ],
            },
            {
              name: 'Premium',
              price: '₹4,9990000',
              duration: '/month',
              features: [
                'Everything in Pro',
                'Unlimited AI Usage',
                'AI Generated Question Bank',
                'Performance Analytics',
                'Priority Support',
              ],
            },
          ].map((plan, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{
                y: -10,
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
              className={`relative p-8 rounded-2xl transition-all duration-300
                         backdrop-blur-lg bg-[#4a1942]/40 border border-[#6e2960]/50
                         hover:bg-[#4a1942]/60 hover:border-[#9d3c87]/50 shadow-xl
                         ${plan.popular ? 'md:-mt-8 z-10 bg-[#562052]/50' : ''}
                         ${index === 1 ? 'md:scale-105' : ''}`}
            >
              {plan.popular && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 
                               bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]
                               text-white text-sm rounded-full shadow-lg"
                >
                  Most Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-[#6366f1]">
                    {plan.price}
                  </span>
                  <span className="text-gray-200">{plan.duration}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 text-gray-300"
                  >
                    <svg
                      className="w-5 h-5 text-blue-400"
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
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-lg transition-all duration-300 transform
                           ${
                             plan.popular
                               ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:from-[#5558e6] hover:to-[#7c4feb]'
                               : 'bg-[#3d1635] text-gray-200 hover:bg-[#4a1942] border border-[#6e2960] hover:border-[#9d3c87]'
                           }`}
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
