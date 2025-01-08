import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Navbar from '../Navbar';
import ChatBot from '../ChatBot';

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
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={`fixed top-16 bottom-0 left-0 bg-gray-900 border-r border-gray-800 w-64 
                   transition-transform duration-300 ease-in-out z-40
                   ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-4">
          <h2 className="text-lg md:text-xl font-bold text-white capitalize">{subject}</h2>
          <p className="text-xs md:text-sm text-gray-400 mt-2">JEE Preparation</p>
        </div>

        <nav className="mt-6 md:mt-8 overflow-y-auto">
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
    </>
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
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');

  const handleAskQuestion = (question) => {
    console.log('Question asked:', question);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Fixed navbar at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar 
          isMobileOpen={isMobileOpen} 
          setIsMobileOpen={setIsMobileOpen}
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
        />
      </div>

      <div className="flex min-h-screen pt-16">
        {/* Sidebar - Only shown in dashboard */}
        <Sidebar 
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        
        {/* Main content */}
        <main className={`flex-1 w-full transition-all duration-300
          ${isDashboard ? 'md:pl-64' : ''} 
          ${isDashboard && isChatOpen && !isFullScreen ? 'md:pr-[320px]' : ''}`}
        >
          <div className="h-full p-4 md:p-6">
            {children}
          </div>
        </main>

        {/* Chat toggle button - Only shown in dashboard */}
        {isDashboard && !isChatOpen && (
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
            className={`fixed transition-all duration-300 transform
              ${isFullScreen ? 'inset-0 z-50' : 'right-0 top-16 bottom-0 w-[320px]'}
              ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <ChatBot 
              onAskQuestion={handleAskQuestion}
              isOpen={isChatOpen}
              setIsOpen={setIsChatOpen}
              isFullScreen={isFullScreen}
              setIsFullScreen={setIsFullScreen}
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