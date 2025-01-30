import { useState, useEffect } from 'react';
import { useLocation, useParams, Outlet, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ChatBubbleLeftRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Navbar from '../Navbar';
import ChatBot from '../ChatBot';
import { SelectionProvider } from '../../context/SelectionContext';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { getBooksList } from '../../interceptors/services';

const KeyboardShortcut = ({ shortcut }) => (
  <span className="inline-flex items-center text-[9px] text-gray-500 mt-0.5">
    <span className="opacity-60">Press :</span>
    {shortcut.split('+').map((key, index) => (
      <span key={key}>
        {index > 0 && <span className="mx-0.5 opacity-60">+</span>}
        <span className="font-medium opacity-75">{key}</span>
      </span>
    ))}
  </span>
);

KeyboardShortcut.propTypes = {
  shortcut: PropTypes.string.isRequired
};

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const { subject } = useParams();
  const navigate = useNavigate();

  const menuItems = [
    { icon: '📚', label: 'Books', path: 'books' },
    { icon: '🗂️', label: 'Flash Cards', path: 'flashcards' },
    { icon: '📝', label: 'My Study Materials', path: 'materials' },
    { icon: '❓', label: 'Question Bank', path: 'question-bank' },
  ];

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

  if (!location.pathname.includes('/dashboard')) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-40 flex md:z-0 pt-16">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 h-screen pt-16 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="p-4">
            <div className="flex items-center mb-1">
              <button
                className="p-2 mr-3 text-gray-400 hover:text-white 
                  bg-gray-800/50 hover:bg-gray-800 rounded-lg 
                  transition-colors duration-200"
                onClick={() => navigate('/subject-selection')}
                title="Back to Subject Selection"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-white capitalize">
                {subject}
              </h2>
            </div>
            <div className="flex items-center ">
              <span className="text-sm text-gray-400">JEE Preparation</span>
              <span className="ml-2 text-[10px] text-gray-500">
                <span className="opacity-60">Press:</span>
                <span className="ml-1 font-medium">Ctrl + Shift + B</span>
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="mt-4">
            <ul className="space-y-2 px-3">
              {menuItems.map((item) => {
                const isActive = location.pathname.includes(`/${item.path}`);
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(`/dashboard/${subject}/${item.path}`);
                        if (window.innerWidth < 768) {
                          setIsMobileOpen(false);
                        }
                      }}
                      className={`w-full flex items-center px-4 py-3 rounded-lg
                        transition-colors duration-200 text-base ${
                          isActive
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                    >
                      <span className="text-xl mr-3">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  isMobileOpen: PropTypes.bool.isRequired,
  setIsMobileOpen: PropTypes.func.isRequired
};

const DefaultLayout = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [chatWidth, setChatWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBooks, setFilteredBooks] = useState({});
  const [allBooks, setAllBooks] = useState({});
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');
  const scrollDirection = useScrollDirection();
  const { subject } = useParams();

  // Fetch books when component mounts or subject changes
  useEffect(() => {
    const fetchBooks = async () => {
      if (!subject) return;
      
      try {
        const response = await getBooksList(subject);
        const booksData = response.data;

        // Group books by class (XI or XII)
        const groupedBooks = booksData.reduce((acc, book) => {
          const isClass12 = book.topic.toLowerCase().includes('xii') || 
                          book.file_name.toLowerCase().includes('xii');
          const className = isClass12 ? 'Class XII' : 'Class XI';
          
          if (!acc[className]) {
            acc[className] = [];
          }
          
          acc[className].push({
            ...book,
            displayName: book.file_name.replace('.pdf', '')
                                     .replace('Unit', 'Unit:')
                                     .split('Unit:')
                                     .map(part => part.trim())
                                     .filter(Boolean)
          });
          
          return acc;
        }, {});

        setAllBooks(groupedBooks);
        setFilteredBooks(groupedBooks);
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };

    fetchBooks();
  }, [subject]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Toggle chat with Ctrl+Shift+L
      if (e.ctrlKey && e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setIsChatOpen(prev => !prev);
      }
      // Toggle sidebar with Ctrl+Shift+B
      if (e.ctrlKey && e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Handle chat width changes
  const handleChatResize = (newWidth) => {
    setChatWidth(newWidth);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredBooks(allBooks);
      return;
    }

    // Filter books based on search query
    const filtered = Object.entries(allBooks).reduce((acc, [className, classBooks]) => {
      const filteredClassBooks = classBooks.filter(book => 
        book.topic.toLowerCase().includes(query.toLowerCase()) ||
        book.file_name.toLowerCase().includes(query.toLowerCase())
      );

      if (filteredClassBooks.length > 0) {
        acc[className] = filteredClassBooks;
      }

      return acc;
    }, {});

    setFilteredBooks(filtered);
  };

  return (
    <SelectionProvider>
      <div className="min-h-screen bg-black overflow-x-hidden">
        {/* Fixed navbar at top */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
            isChatOpen={isChatOpen}
            setIsChatOpen={setIsChatOpen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        </div>

        <div className="flex min-h-screen pt-16 relative">
          {/* Sidebar */}
          {isDashboard && !isFullScreen && (
            <div
              className={`fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out ${
                !isSidebarOpen ? '-translate-x-64' : 'translate-x-0'
              } ${isMobileOpen ? 'z-40' : 'z-0'}`}
            >
              <Sidebar
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
              />
            </div>
          )}

          {/* Main content */}
          <main
            className={`flex-1 w-full transition-all duration-300 ease-in-out ${
              isDashboard && !isFullScreen && isSidebarOpen ? 'md:pl-64' : ''
            } px-2 sm:px-4 md:px-6`}
            style={{
              paddingRight:
                isDashboard &&
                isChatOpen &&
                !isFullScreen &&
                window.innerWidth >= 768
                  ? `${chatWidth}px`
                  : '0',
              transition: isResizing ? 'none' : 'all 0.3s ease-out',
              display: isFullScreen ? 'none' : 'block',
            }}
          >
            {/* Search Bar - Only show in books route */}
            {isDashboard && location.pathname.includes('/books') && (
              <div
                className={`fixed z-40 transition-all duration-300 ease-in-out bg-black/95 backdrop-blur-sm ${
                  scrollDirection === 'down'
                    ? '-translate-y-full'
                    : 'translate-y-0'
                } ${
                  isDashboard && !isFullScreen && isSidebarOpen
                    ? 'md:left-64'
                    : 'left-0'
                } right-0 top-16 w-full`}
                style={{
                  right:
                    isDashboard &&
                    isChatOpen &&
                    !isFullScreen &&
                    window.innerWidth >= 768
                      ? `${chatWidth}px`
                      : '0',
                }}
              >
                <div className="w-full h-full px-2 sm:px-4 md:px-6 py-2">
                  <div className="relative w-full flex justify-center md:justify-start">
                    <div className="relative w-full max-w-xl sm:max-w-md md:max-w-xl">
                      <input
                        type="text"
                        placeholder="Search topics, chapters, or concepts..."
                        className="w-full bg-gray-900 text-white border border-gray-800 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                        onChange={(e) => handleSearch(e.target.value)}
                        value={searchQuery}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-4 w-4 md:h-5 md:w-5 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Add spacing div to prevent content from being hidden - only in books route */}
            {isDashboard && location.pathname.includes('/books') && (
              <div className="h-[3.25rem]" />
            )}
            <div className="max-w-full">
              {location.pathname.includes('/dashboard') ? (
                <Outlet
                  context={{
                    setSelectedText,
                    setIsChatOpen,
                    isChatOpen,
                    filteredBooks,
                  }}
                />
              ) : (
                children
              )}
            </div>
          </main>

          {/* Chat toggle button - Only show on tablet and larger screens when chat is closed */}
          {isDashboard &&
            !isChatOpen &&
            !isFullScreen &&
            window.innerWidth >= 768 && (
              <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-30 hover:bg-blue-600 transition-colors"
                aria-label="Open AI Chat"
              >
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
              </button>
            )}

          {/* Mobile chat toggle button - Only show on mobile when chat is closed */}
          {isDashboard &&
            !isChatOpen &&
            !isFullScreen &&
            window.innerWidth < 768 && (
              <button
                onClick={() => {
                  setIsChatOpen(true);
                  setIsFullScreen(true);
                }}
                className="fixed bottom-4 right-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-30 hover:bg-blue-600 transition-colors"
                aria-label="Open AI Chat"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
              </button>
            )}

          {/* ChatBot */}
          {isDashboard && (
            <div
              className={`fixed transform transition-transform duration-300 ease-in-out ${
                isFullScreen ? 'inset-0' : 'top-16 bottom-0 right-0'
              } ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
              style={{
                width:
                  isFullScreen || window.innerWidth < 768
                    ? '100%'
                    : `${chatWidth}px`,
                zIndex: isFullScreen ? 60 : 40,
              }}
            >
              <ChatBot
                isOpen={isChatOpen}
                setIsOpen={setIsChatOpen}
                isFullScreen={isFullScreen}
                setIsFullScreen={setIsFullScreen}
                subject={location.pathname.split('/')[2]}
                topic={location.pathname.split('/')[4]}
                selectedText={selectedText}
                setSelectedText={setSelectedText}
                onResize={(width) => {
                  if (window.innerWidth >= 768) {
                    setIsResizing(true);
                    handleChatResize(width);
                    clearTimeout(window.resizeTimer);
                    window.resizeTimer = setTimeout(() => {
                      setIsResizing(false);
                    }, 100);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </SelectionProvider>
  );
};

DefaultLayout.propTypes = {
  children: PropTypes.node
};

export default DefaultLayout; 