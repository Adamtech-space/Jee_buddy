import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [loading, setLoading] = useState(true);

  // Add useEffect to simulate loading
  useEffect(() => {
    if (filteredBooks && Object.keys(filteredBooks).length > 0) {
      setLoading(false);
    }
  }, [filteredBooks]);

  // Memoize the ripple effect handler
  const createRipple = useCallback((e, element) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('div');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple-effect';

    element.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }, []);

  // Memoize handlers
  const handleBookClick = useCallback(
    (book, e) => {
      const container = e.currentTarget;
      createRipple(e, container);
      setSelectedBook(selectedBook?.id === book.id ? null : book);
    },
    [selectedBook, createRipple]
  );

  const handlePdfClick = useCallback(
    (url, e) => {
      const button = e.currentTarget;
      createRipple(e, button);
      const encodedUrl = encodeURIComponent(url);
      navigate(`/dashboard/${subject}/pdf/${encodedUrl}`, {
        state: { pdfUrl: url },
      });
    },
    [navigate, subject, createRipple]
  );

  // Memoize animation variants
  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    }),
    []
  );

  const itemVariants = useMemo(
    () => ({
      hidden: { y: 20, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: {
          type: 'spring',
          stiffness: 100,
        },
      },
    }),
    []
  );

  // Memoize book rendering
  const renderBook = useCallback(
    ([className, classBooks]) => (
      <div key={className} className="space-y-6">
        <h3 className="text-2xl font-semibold text-white">{className}</h3>
        <div className="grid grid-cols-1 gap-6">
          {classBooks.map((book) => (
            <motion.div
              key={book.id}
              variants={itemVariants}
              className={`bg-gray-900 rounded-xl h-auto transition-all duration-300 ${
                selectedBook?.id === book.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div
                className="cursor-pointer relative overflow-hidden"
                onClick={(e) => handleBookClick(book, e)}
              >
                <h3 className="text-2xl m-4 font-bold text-white">
                  {book.displayName[0]}
                </h3>
                {book.displayName[1] && (
                  <p className="text-gray-400 m-4 text-sm">
                    Unit: {book.displayName[1]}
                  </p>
                )}
              </div>

              <motion.div
                initial="hidden"
                animate={selectedBook?.id === book.id ? 'visible' : 'hidden'}
                variants={{
                  visible: { height: 'auto', opacity: 1 },
                  hidden: { height: 0, opacity: 0 },
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4">
                  <motion.button
                    onClick={(e) => handlePdfClick(book.storage_url, e)}
                    className={`w-full p-2 mx-2 mb-4 rounded-xl relative overflow-hidden
                            transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-700
                            flex items-center justify-between group pr-4`}
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
                      className="text-white mr-2"
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
    ),
    [selectedBook, itemVariants, handleBookClick, handlePdfClick]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!filteredBooks || Object.keys(filteredBooks).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No books available for this subject.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h2 className="text-3xl font-bold mb-8 capitalize">
        {subject} Books for JEE Preparation
      </h2>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-8"
      >
        {Object.entries(filteredBooks).map(renderBook)}
      </motion.div>
    </div>
  );
};

export default BooksList;
