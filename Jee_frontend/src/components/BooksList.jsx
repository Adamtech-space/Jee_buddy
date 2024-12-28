import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

const BooksList = () => {
  const navigate = useNavigate();
  const { subject } = useParams();
  const [selectedBook, setSelectedBook] = useState(null);

  const bookCategories = {
    physics: [
      {
        category: 'NCERT',
        books: [
          { 
            title: 'NCERT Physics Class 11', 
            author: 'NCERT', 
            type: 'Textbook',
            topics: [
              { id: 'kinematics', name: 'Kinematics', color: 'from-blue-500 to-blue-700' },
              { id: 'laws_of_motion', name: 'Laws of Motion', color: 'from-indigo-500 to-indigo-700' },
              { id: 'work_energy', name: 'Work, Energy and Power', color: 'from-purple-500 to-purple-700' },
              { id: 'rotational_motion', name: 'Rotational Motion', color: 'from-pink-500 to-pink-700' }
            ]
          },
          { 
            title: 'NCERT Physics Class 12', 
            author: 'NCERT', 
            type: 'Textbook',
            topics: [
              { id: 'electrostatics', name: 'Electrostatics', color: 'from-red-500 to-red-700' },
              { id: 'current', name: 'Current Electricity', color: 'from-orange-500 to-orange-700' },
              { id: 'magnetic_effects', name: 'Magnetic Effects', color: 'from-yellow-500 to-yellow-700' },
              { id: 'emi', name: 'EMI and AC', color: 'from-green-500 to-green-700' }
            ]
          }
        ]
      }
    ],
    chemistry: [
      {
        category: 'NCERT',
        books: [
          { 
            title: 'NCERT Chemistry Class 11', 
            author: 'NCERT', 
            type: 'Textbook',
            topics: [
              { id: 'chemical_bonding', name: 'Chemical Bonding', color: 'from-blue-500 to-blue-700' },
              { id: 'states_of_matter', name: 'States of Matter', color: 'from-indigo-500 to-indigo-700' },
              { id: 'thermodynamics_chem', name: 'Thermodynamics', color: 'from-purple-500 to-purple-700' },
              { id: 'equilibrium', name: 'Equilibrium', color: 'from-pink-500 to-pink-700' }
            ]
          },
          { 
            title: 'NCERT Chemistry Class 12', 
            author: 'NCERT', 
            type: 'Textbook',
            topics: [
              { id: 'solid_state', name: 'Solid State', color: 'from-red-500 to-red-700' },
              { id: 'solutions', name: 'Solutions', color: 'from-orange-500 to-orange-700' },
              { id: 'electrochemistry', name: 'Electrochemistry', color: 'from-yellow-500 to-yellow-700' },
              { id: 'organic_chemistry', name: 'Organic Chemistry', color: 'from-green-500 to-green-700' }
            ]
          }
        ]
      }
    ],
    mathematics: [
      {
        category: 'NCERT',
        books: [
          { 
            title: 'NCERT Mathematics Class 11', 
            author: 'NCERT', 
            type: 'Textbook',
            topics: [
              { id: 'sets_functions', name: 'Sets and Functions', color: 'from-blue-500 to-blue-700' },
              { id: 'trigonometry', name: 'Trigonometry', color: 'from-indigo-500 to-indigo-700' },
              { id: 'straight_lines', name: 'Straight Lines', color: 'from-purple-500 to-purple-700' },
              { id: 'conic_sections', name: 'Conic Sections', color: 'from-pink-500 to-pink-700' }
            ]
          },
          { 
            title: 'NCERT Mathematics Class 12', 
            author: 'NCERT', 
            type: 'Textbook',
            topics: [
              { id: 'matrices', name: 'Matrices', color: 'from-red-500 to-red-700' },
              { id: 'determinants', name: 'Determinants', color: 'from-orange-500 to-orange-700' },
              { id: 'calculus', name: 'Calculus', color: 'from-yellow-500 to-yellow-700' },
              { id: 'vector_algebra', name: 'Vector Algebra', color: 'from-green-500 to-green-700' }
            ]
          }
        ]
      }
    ]
  };

  const books = bookCategories[subject]?.[0]?.books || [];

  const handleBookClick = (book) => {
    setSelectedBook(selectedBook?.title === book.title ? null : book);
  };

  const handleTopicClick = (topicId) => {
    navigate(`/dashboard/${subject}/books/${topicId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
    <div className="p-4 md:p-6 lg:p-8">
      <h2 className="text-3xl font-bold mb-8 capitalize">{subject} Books for JEE Preparation</h2>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6"
      >
        {books.map((book, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className={`bg-gray-900 rounded-xl p-6 transition-all duration-300 ${
              selectedBook?.title === book.title ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div
              className="cursor-pointer"
              onClick={() => handleBookClick(book)}
            >
              <h3 className="text-2xl font-bold text-white mb-2">{book.title}</h3>
              <p className="text-gray-400 text-sm mb-4">Author: {book.author}</p>
            </div>

            <motion.div
              initial="hidden"
              animate={selectedBook?.title === book.title ? "visible" : "hidden"}
              variants={{
                visible: { height: "auto", opacity: 1 },
                hidden: { height: 0, opacity: 0 }
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <h4 className="text-xl font-semibold mb-4">Topics:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {book.topics.map((topic) => (
                  <motion.button
                    key={topic.id}
                    onClick={() => handleTopicClick(topic.id)}
                    className={`w-full p-6 rounded-xl shadow-lg hover:shadow-2xl 
                              transition-all duration-300 bg-gradient-to-r ${topic.color}
                              flex items-center justify-between group`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center">
                      <span className="text-4xl mr-4 group-hover:scale-110 transition-transform">
                        📝
                      </span>
                      <div className="text-left">
                        <span className="text-xl font-bold text-white block">
                          {topic.name}
                        </span>
                        <span className="text-sm text-gray-200 opacity-80">
                          Start learning {topic.name.toLowerCase()}
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
          </motion.div>
        ))}
      </motion.div>

      {books.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No books available for this subject.</p>
        </div>
      )}
    </div>
  );
};

export default BooksList;