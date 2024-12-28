import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SubjectSelection = () => {
  const navigate = useNavigate();
  const subjects = [
    { id: 'physics', name: 'Physics', icon: '⚛️', color: 'from-blue-500 to-blue-700' },
    { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: 'from-green-500 to-green-700' },
    { id: 'maths', name: 'Mathematics', icon: '📐', color: 'from-purple-500 to-purple-700' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-md w-full space-y-8 p-8"
      >
        <motion.div 
          variants={itemVariants}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-2">Choose Your Subject</h2>
          <p className="text-gray-400 text-lg">Select a subject to start your journey</p>
        </motion.div>

        <div className="grid gap-6 mt-8">
          {subjects.map((subject) => (
            <motion.button
              key={subject.id}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/dashboard/${subject.id}`)}
              className={`w-full p-6 rounded-xl shadow-lg hover:shadow-2xl 
                        transition-all duration-300 bg-gradient-to-r ${subject.color}
                        flex items-center justify-between group`}
            >
              <div className="flex items-center">
                <span className="text-4xl mr-4 group-hover:scale-110 transition-transform">
                  {subject.icon}
                </span>
                <div className="text-left">
                  <span className="text-xl font-bold text-white block">
                    {subject.name}
                  </span>
                  <span className="text-sm text-gray-200 opacity-80">
                    Start learning {subject.name.toLowerCase()}
                  </span>
                </div>
              </div>
              <motion.div 
                className="text-white"
                whileHover={{ x: 5 }}
              >
                →
              </motion.div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SubjectSelection;