import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { message } from 'antd';
import { getBooksList } from '../interceptors/services';

const BooksList = () => {
  const navigate = useNavigate();
  const { subject } = useParams();
  const [selectedBook, setSelectedBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const booksData = await getBooksList(subject);
        
        // Process books data to match UI structure
        const processedBooks = booksData.map(book => ({
          title: book.file_name,
          author: 'NCERT', // You can add author field in Supabase if needed
          type: 'Textbook',
          storage_url: book.storage_url,
          topics: [
            {
              id: book.topic,
              name: book.topic,
              color: getRandomColor()
            }
          ]
        }));
        
        setBooks(processedBooks);
      } catch (error) {
        message.error(error.message || 'Failed to fetch books');
      } finally {
        setLoading(false);
      }
    };

    if (subject) {
      fetchBooks();
    }
  }, [subject]);

  const getRandomColor = () => {
    const colors = [
      'from-blue-500 to-blue-700',
      'from-indigo-500 to-indigo-700',
      'from-purple-500 to-purple-700',
      'from-pink-500 to-pink-700',
      'from-red-500 to-red-700',
      'from-orange-500 to-orange-700',
      'from-yellow-500 to-yellow-700',
      'from-green-500 to-green-700'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleBookClick = (book) => {
    setSelectedBook(selectedBook?.title === book.title ? null : book);
  };

  const handleTopicClick = (book, topicId) => {
    // Open PDF in a new tab or viewer component
    if (book.storage_url) {
      window.open(book.storage_url, '_blank');
    } else {
      message.warning('PDF URL not available');
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
                    onClick={() => handleTopicClick(book, topic.id)}
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
                          Click to view PDF
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