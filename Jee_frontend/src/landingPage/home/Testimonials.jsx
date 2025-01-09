import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import pic1 from '../images/pic1.png';
import pic2 from '../images/pic2.png';
import pic3 from '../images/pic3.png';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Rahul Kumar',
      content: 'The AI tutor was like having a personal mentor! It helped me master tough Physics concepts, especially in Mechanics. ',
      image: pic1,
    },
    {
      name: 'Rithesh',
      content: `The personalized practice helped me tackle my weak topics. The AI explanations made complex topics feel simple. !`,
      image: pic2,
    },
    {
      name: 'Amit Patel',
      content: 'Uploading pictures of tough problems and getting instant, detailed solutions was a game-changer. ',
      image: pic3,
    },
  ];

  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section id="testimonials" className="relative overflow-hidden">
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#18183a] to-[#291a49]">
            Success Stories
          </h2>
          <p className="text-lg text-white/80">Hear from our top rankers</p>
        </motion.div>

        <motion.div
          ref={ref}
          className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 },
            },
          }}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: {
                  opacity: 0,
                  y: 30,
                  scale: 0.9,
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: 'spring',
                    damping: 15,
                    stiffness: 100,
                  },
                },
              }}
              whileHover={{
                scale: 1.02,
                y: -5,
                transition: { duration: 0.2 },
              }}
              className="group relative overflow-hidden"
            >
              {/* Main Card */}
              <div
                className="relative p-8 rounded-2xl transition-all duration-300
                            bg-[#1e1b4b]/30 backdrop-blur-sm
                            border border-indigo-500/20 hover:border-indigo-500/40"
              >
                {/* Profile section */}
                <div className="flex items-center gap-4 mb-6">
                  <motion.div className="relative" whileHover={{ scale: 1.1 }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full blur-lg opacity-40" />
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover relative z-10 
                               ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-transparent"
                    />
                  </motion.div>
                  <div>
                    <motion.h3
                      className="font-semibold text-white text-lg tracking-wide"
                      whileHover={{ x: 5 }}
                    >
                      {testimonial.name}
                    </motion.h3>
                    <p className="text-indigo-300 font-medium">
                      {testimonial.role}
                    </p>
                  </div>
                </div>

                {/* Quote icon */}
                <div className="absolute top-6 right-6">
                  <svg
                    className="w-8 h-8 text-indigo-500/20"
                    fill="currentColor"
                    viewBox="0 0 32 32"
                  >
                    <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                  </svg>
                </div>

                {/* Testimonial content */}
                <motion.p
                  className="relative text-white/90 leading-relaxed font-light"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {testimonial.content}
                </motion.p>

                {/* Decorative elements */}
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
