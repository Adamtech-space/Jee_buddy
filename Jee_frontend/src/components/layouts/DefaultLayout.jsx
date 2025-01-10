import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Navbar from '../Navbar';
import ChatBot from '../ChatBot';

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
  const isDashboard = location.pathname.includes('/dashboard');

  const menuItems = [
    { icon: "📚", label: "Books", path: "books" },
    { icon: "🗂️", label: "Flash Cards", path: "flashcards" },
    { icon: "📝", label: "Saved Notes", path: "notes" },
    { icon: "📑", label: "Study Materials", path: "materials" }
  ];

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

  if (!isDashboard) return null;

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
          <div className="p-4">
            <div className="flex flex-col">
              <h2 className="text-lg md:text-xl font-bold text-white capitalize">{subject}</h2>
              <div className="flex items-center space-x-2">
                <p className="text-xs md:text-sm text-gray-400">JEE Preparation</p>
                <KeyboardShortcut shortcut="Ctrl+Shift+B" />
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-1 md:space-y-2 px-2">
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
                      className={`w-full flex items-center justify-start
                                px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all duration-200 
                                text-sm md:text-base ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-base md:text-xl">{item.icon}</span>
                      <span className="ml-2 md:ml-3">{item.label}</span>
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
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');

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

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText && isDashboard) {
        setSelectedText(selectedText);
        if (!isChatOpen) {
          setIsChatOpen(true);
        }
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, [isDashboard, isChatOpen]);

  // Handle chat width changes
  const handleChatResize = (newWidth) => {
    setChatWidth(newWidth);
  };

  return (
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
        {/* Sidebar - Only shown in dashboard and when chat is not fullscreen */}
        {isDashboard && !isFullScreen && (
          <div className={`fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out ${
            !isSidebarOpen ? '-translate-x-64' : 'translate-x-0'
          } ${isMobileOpen ? 'z-40' : 'z-0'}`}>
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
          } px-4 md:px-6`}
          style={{
            paddingRight: isDashboard && isChatOpen && !isFullScreen ? `${chatWidth}px` : '0',
            transition: isResizing ? 'none' : 'all 0.3s ease-out',
            display: isFullScreen ? 'none' : 'block'
          }}
        >
          <div className="h-full max-w-full">
            {children}
          </div>
        </main>

        {/* Chat toggle button - Only shown in dashboard and when not fullscreen */}
        {isDashboard && !isChatOpen && !isFullScreen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-50 hover:bg-blue-600 transition-colors"
            aria-label="Open AI Chat"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
          </button>
        )}

        {/* ChatBot - Only shown in dashboard */}
        {isDashboard && (
          <div 
            className={`fixed transform transition-transform duration-300 ease-in-out ${
              isFullScreen ? 'inset-0' : 'top-16 bottom-0 right-0'
            } ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ 
              width: isFullScreen ? '100%' : `${chatWidth}px`,
              zIndex: isFullScreen ? 60 : 50
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
                setIsResizing(true);
                handleChatResize(width);
                clearTimeout(window.resizeTimer);
                window.resizeTimer = setTimeout(() => {
                  setIsResizing(false);
                }, 100);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

DefaultLayout.propTypes = {
  children: PropTypes.node.isRequired
};

export default DefaultLayout; 