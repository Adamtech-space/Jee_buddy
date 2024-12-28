import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const { subject } = useParams();
  const navigate = useNavigate();

  const menuItems = [
    { icon: "📚", label: "Books", path: "books" },
    { icon: "🗂️", label: "Flash Cards", path: "flashcards" },
    { icon: "📝", label: "Saved Notes", path: "notes" },
    { icon: "📑", label: "Study Materials", path: "materials" }
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`bg-gray-900 min-h-screen border-r border-gray-800 fixed left-0 top-16 bottom-0
                  z-40 transition-all duration-300 ease-in-out
                  ${isCollapsed && !isMobileOpen ? 'w-16' : 'w-64'}
                  ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        onMouseEnter={() => !isMobileOpen && setIsCollapsed(false)}
        onMouseLeave={() => !isMobileOpen && setIsCollapsed(true)}
      >
        <div className={`p-4 ${isCollapsed && !isMobileOpen ? 'text-center' : ''}`}>
          {(!isCollapsed || isMobileOpen) && (
            <>
              <h2 className="text-xl font-bold text-white capitalize">{subject}</h2>
              <p className="text-sm text-gray-400 mt-2">JEE Preparation</p>
            </>
          )}
        </div>

        <nav className="mt-8">
          <ul className="space-y-2 px-2">
            {menuItems.map((item) => {
              const isActive = location.pathname.includes(`/${item.path}`);
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(`/dashboard/${subject}/${item.path}`)}
                    className={`w-full flex items-center ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-start'}
                              px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                    title={isCollapsed && !isMobileOpen ? item.label : ''}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {(!isCollapsed || isMobileOpen) && <span className="ml-3">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </motion.div>
    </AnimatePresence>
  );
};

const ChatBot = ({ pinnedQuestions, onPinQuestion, onAskQuestion }) => {
  const [message, setMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(null);
  const fileInputRef = useRef(null);
  const [pinnedTopics, setPinnedTopics] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onAskQuestion({ message, topic: currentTopic });
      setMessage('');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // TODO: Implement file upload logic
      console.log('File selected:', file);
    }
  };

  const handlePinContent = (content, topic) => {
    setPinnedTopics(prev => ({
      ...prev,
      [topic]: [...(prev[topic] || []), content]
    }));
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      {/* Mobile chat icon */}
      <button
        onClick={toggleChat}
        className="md:hidden fixed bottom-4 right-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-50"
      >
        <span className="text-2xl">💬</span>
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {(isChatOpen || window.innerWidth >= 768) && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed md:right-0 inset-0 md:inset-auto md:top-16 md:bottom-0 md:w-80 
                     flex flex-col bg-gray-900 z-40 border-l border-gray-800"
          >
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">AI Study Assistant</h3>
              <button onClick={() => setIsChatOpen(false)} className="md:hidden">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Search input */}
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              {/* Current topic indicator */}
              {currentTopic && (
                <div className="mb-4 p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                  <p className="text-sm text-blue-400">Currently studying: {currentTopic}</p>
                </div>
              )}

              {/* Pinned content */}
              {Object.entries(pinnedTopics).map(([topic, contents]) => (
                <div key={topic} className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    {topic}
                  </h4>
                  <div className="space-y-2">
                    {contents.map((content, i) => (
                      <div key={i} className="bg-gray-800 p-2 rounded text-sm flex justify-between items-center">
                        <span>{content}</span>
                        <button onClick={() => {
                          setPinnedTopics(prev => ({
                            ...prev,
                            [topic]: prev[topic].filter((_, index) => index !== i)
                          }));
                        }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-800">
              <form onSubmit={handleSubmit}>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-20 py-2 text-white 
                            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-2 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      📎
                    </button>
                    <button
                      type="submit"
                      className="text-blue-500 hover:text-blue-400 p-1"
                    >
                      ➤
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const DashboardLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pinnedQuestions, setPinnedQuestions] = useState([]);

  const handlePinQuestion = (question) => {
    setPinnedQuestions([...pinnedQuestions, question]);
  };

  const handleAskQuestion = (question) => {
    // TODO: Implement AI chat functionality
    console.log('Asked:', question);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        <main 
          className={`flex-1 transition-all duration-300 
                     ${isCollapsed && !isMobileOpen ? 'ml-16' : 'ml-0 md:ml-64'} pt-16`}
        >
          <div className="md:mr-80 overflow-y-auto min-h-[calc(100vh-4rem)] p-6">
            {children}
          </div>
          <ChatBot
            pinnedQuestions={pinnedQuestions}
            onPinQuestion={handlePinQuestion}
            onAskQuestion={handleAskQuestion}
          />
        </main>
      </div>
    </div>
  );
};

const SavedNotes = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold mb-6">Saved Notes</h2>
    <div className="bg-gray-800 rounded-lg p-6">
      <p className="text-gray-400">Your saved notes will appear here. Start taking notes during your study sessions!</p>
    </div>
  </div>
);

const AddedMaterials = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold mb-6">Added Materials</h2>
    <div className="bg-gray-800 rounded-lg p-6">
      <p className="text-gray-400">Your added study materials will appear here. Start adding materials to enhance your learning!</p>
    </div>
  </div>
);

export default DashboardLayout;