import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Rahul Kumar',
      role: 'JEE Advanced 2023',
      content:
        'JEE Buddy helped me understand complex concepts through their interactive learning platform. The AI-powered assistance was available 24/7 to clear my doubts.',
      image: 'https://i.pravatar.cc/100?img=1',
    },
    {
      name: 'Priya Sharma',
      role: 'JEE Mains 2023',
      content:
        'The practice tests and personalized feedback helped me improve my weak areas. I could track my progress and focus on topics that needed more attention.',
      image: 'https://i.pravatar.cc/100?img=2',
    },
    {
      name: 'Amit Patel',
      role: 'JEE Advanced 2023',
      content:
        "The structured study material and mock tests were exactly what I needed. The platform's analytics helped me understand my preparation level clearly.",
      image: 'https://i.pravatar.cc/100?img=3',
    },
  ];

  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section
      id="testimonials"
      className="relative py-32 bg-black overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Success Stories
          </h2>
          <p className="text-lg text-gray-300">Hear from our top rankers</p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.2 },
            },
          }}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: 'spring',
                    damping: 12,
                    stiffness: 100,
                  },
                },
              }}
              whileHover={{
                scale: 1.02,
                y: -5,
                transition: { duration: 0.2 },
              }}
              className="group relative p-8 rounded-2xl transition-all duration-300
                        backdrop-blur-md bg-gray-900/30 border border-gray-800
                        hover:bg-gray-800/50 hover:border-blue-500/50"
            >
              <div className="absolute -top-2 -right-2 w-20 h-20">
                <div className="absolute transform rotate-45 bg-gradient-to-r from-blue-600 to-purple-600 w-3 h-3" />
              </div>

              <div className="flex items-center gap-4 mb-6">
                <motion.div className="relative" whileHover={{ scale: 1.1 }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-30" />
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover relative z-10 border-2 border-gray-800 p-0.5 bg-gray-900"
                  />
                </motion.div>
                <div>
                  <motion.h3
                    className="font-semibold text-gray-100 group-hover:text-blue-400 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    {testimonial.name}
                  </motion.h3>
                  <p className="text-sm text-gray-400">{testimonial.role}</p>
                  <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    {testimonial.rank}
                  </p>
                </div>
              </div>

              <div className="relative">
                <svg
                  className="absolute -top-4 -left-2 w-8 h-8 text-blue-600/20"
                  fill="currentColor"
                  viewBox="0 0 32 32"
                >
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                <p className="text-gray-300 relative">{testimonial.content}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
