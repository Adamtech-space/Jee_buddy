import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import Navbar from '../Navbar';
import ChatBot from '../ChatBot';



const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const { subject } = useParams();
  const navigate = useNavigate();

  const menuItems = [
    { icon: "📚", label: "Books", path: "books" },
    { icon: "🗂️", label: "Flash Cards", path: "flashcards" },
    { icon: "📝", label: "Study Materials", path: "materials" }
  ];

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

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

const DashboardLayout = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setIsChatOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleAskQuestion = (question) => {
    console.log('Asked:', question);
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
        />
      </div>

      <div className="flex min-h-screen pt-16 relative">
        {/* Sidebar - Fixed width on desktop */}
        <Sidebar 
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        
        {/* Main content - with left padding for sidebar on desktop */}
        <main className="flex-1 w-full md:pl-64 px-4 md:px-6">
          <div className="h-full max-w-full">
            {children}
          </div>
        </main>

        {/* ChatBot - Fixed width */}
        <div className="hidden md:block fixed right-0 top-16 bottom-0 w-[450px]">
          <ChatBot 
            onAskQuestion={handleAskQuestion}
            isOpen={isChatOpen}
            setIsOpen={setIsChatOpen}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
          />
        </div>

        {/* Mobile ChatBot */}
        <div className="md:hidden fixed inset-0 z-50" style={{ display: isChatOpen ? 'block' : 'none' }}>
          <ChatBot 
            onAskQuestion={handleAskQuestion}
            isOpen={isChatOpen}
            setIsOpen={setIsChatOpen}
            isFullScreen={true}
            setIsFullScreen={setIsFullScreen}
          />
        </div>
      </div>
    </div>
  );
};

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired
};

export default DashboardLayout;