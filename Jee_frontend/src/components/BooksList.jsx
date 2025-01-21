import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { pdfjs } from 'react-pdf';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const BooksList = () => {
  const navigate = useNavigate();
  const { subject } = useParams();
  const [selectedBook, setSelectedBook] = useState(null);
  const { filteredBooks } = useOutletContext();

  const handleBookClick = (book) => {
    setSelectedBook(selectedBook?.id === book.id ? null : book);
  };

  const handlePdfClick = (url) => {
    const encodedUrl = encodeURIComponent(url);
    navigate(`/dashboard/${subject}/pdf/${encodedUrl}`, { state: { pdfUrl: url } });
  };

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

  if (!filteredBooks || Object.keys(filteredBooks).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No books available for this subject.</p>
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
        className="grid grid-cols-1 gap-8"
      >
        {Object.entries(filteredBooks).map(([className, classBooks]) => (
          <div key={className} className="space-y-6">
            <h3 className="text-2xl font-semibold text-white">{className}</h3>
            <div className="grid grid-cols-1 gap-6">
              {classBooks.map((book) => (
                <motion.div
                  key={book.id}
                  variants={itemVariants}
                  className={`bg-gray-900 rounded-xl p-6 transition-all duration-300 ${
                    selectedBook?.id === book.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => handleBookClick(book)}
                  >
                    <h3 className="text-2xl font-bold text-white mb-2">{book.displayName[0]}</h3>
                    {book.displayName[1] && (
                      <p className="text-gray-400 text-sm mb-4">Unit: {book.displayName[1]}</p>
                    )}
                  </div>

                  <motion.div
                    initial="hidden"
                    animate={selectedBook?.id === book.id ? "visible" : "hidden"}
                    variants={{
                      visible: { height: "auto", opacity: 1 },
                      hidden: { height: 0, opacity: 0 }
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4">
                      <motion.button
                        onClick={() => handlePdfClick(book.storage_url)}
                        className={`w-full p-6 rounded-xl shadow-lg hover:shadow-2xl 
                                  transition-all duration-300 bg-gradient-to-r ${getRandomColor()}
                                  flex items-center justify-between group`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center">
                          <span className="text-4xl mr-4 group-hover:scale-110 transition-transform">
                            📚
                          </span>
                          <div className="text-left">
                            <span className="text-xl font-bold text-white block">
                              View PDF
                            </span>
                            <span className="text-sm text-gray-200 opacity-80">
                              Click to open the book
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
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default BooksList;