import { useState, useRef, useEffect } from 'react';
import { 
  XMarkIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const PinIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    className={className}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M12 2L12 22M12 2L8 6M12 2L16 6M12 22L8 18M12 22L16 18M5 12H19" 
    />
  </svg>
);

PinIcon.propTypes = {
  className: PropTypes.string
};

const ChatBot = ({ onAskQuestion, isOpen, setIsOpen, isFullScreen, setIsFullScreen }) => {
  const [message, setMessage] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [pinnedText, setPinnedText] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const helpButtons = [
    { type: "explain", icon: "📝", text: "Step-by-Step" },
    { type: "basics", icon: "🧠", text: "Basics" },
    { type: "test", icon: "🎯", text: "Test Me" },
    { type: "similar", icon: "🔄", text: "Examples" },
    { type: "solve", icon: "✨", text: "Solve" },
    { type: "keypoints", icon: "🔍", text: "Key Points" },
    // Additional buttons for full screen
    { type: "challenge", icon: "🏆", text: "Challenge" },
    { type: "mistakes", icon: "⚠️", text: "Mistakes" },
    { type: "realworld", icon: "🌍", text: "Real-World" },
    { type: "related", icon: "🔗", text: "Topics" },
    { type: "mnemonic", icon: "💡", text: "Shortcut" },
    { type: "ask-similar", icon: "🤔", text: "Similar" }
  ];

  const visibleButtons = isFullScreen ? helpButtons : helpButtons.slice(0, 6);

  const handleHelpClick = (type) => {
    const helpMessages = {
      explain: "Please explain this step by step",
      basics: "What are the basic concepts I need to understand?",
      test: "Test my understanding with some questions",
      similar: "Show me similar examples",
      solve: "Help me solve this problem",
      keypoints: "What are the key points to remember?",
      challenge: "Give me a challenging problem",
      mistakes: "What are common mistakes to avoid?",
      realworld: "How is this used in the real world?",
      related: "What are related topics I should know?",
      mnemonic: "Is there a shortcut or trick to remember this?",
      "ask-similar": "Show me similar questions"
    };

    // Send the help message directly without showing in input
    onAskQuestion({ message: helpMessages[type] });
    
    // Add only the AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        content: "I understand your question. Let me help you with that..."
      }]);
    }, 1000);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        setIsOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [setIsOpen]);

  // Add scroll to bottom effect
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() && !pinnedText) return;

    const newMessage = { 
      sender: 'user', 
      content: pinnedText ? `${pinnedText}\n\n${message}`.trim() : message 
    };
    setMessages(prev => [...prev, newMessage]);
    onAskQuestion({ message: newMessage.content });
    setMessage('');
    // Don't clear pinned text after sending - it stays until unpinned

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        content: "I understand your question. Let me help you with that..."
      }]);
    }, 1000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file);
    }
  };

  // Handle text selection from content
  useEffect(() => {
    const handleSelectedText = (event) => {
      const text = event.detail.text;
      setSelectedText(text);
      setIsOpen(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    window.addEventListener('askAboutSelection', handleSelectedText);
    return () => window.removeEventListener('askAboutSelection', handleSelectedText);
  }, [setIsOpen]);

  const handlePinText = () => {
    setPinnedText(selectedText);
    setSelectedText('');
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 border-l border-gray-800 ${!isOpen ? 'hidden' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h3 className="text-xl font-bold text-white">AI Study Assistant</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
          >
            {isFullScreen ? (
              <ArrowsPointingInIcon className="w-5 h-5" />
            ) : (
              <ArrowsPointingOutIcon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Help Buttons */}
      <div className={`p-2 border-b border-gray-800 ${isFullScreen ? 'grid grid-cols-4 gap-2' : 'flex flex-wrap gap-2'}`}>
        {visibleButtons.map((button) => (
          <button
            key={button.type}
            onClick={() => handleHelpClick(button.type)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm text-gray-300 hover:text-white"
          >
            <span>{button.icon}</span>
            <span>{button.text}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const messageContent = typeof message.content === 'object' 
            ? message.content.text 
            : message.content;

          return (
            <div 
              key={index} 
              className={`flex items-start space-x-3 ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender !== 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2C3C33] flex items-center justify-center">
                  <UserCircleIcon className="w-6 h-6 text-[#4ADE80]" />
                </div>
              )}
              
              <div className={`
                max-w-[80%] rounded-lg p-3 
                ${message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-800 text-gray-100'
                }
              `}>
                <ReactMarkdown
                  className={`prose ${message.sender === 'user' ? 'prose-dark' : 'prose-light'} max-w-none`}
                  components={{
                    code({inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md text-sm"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code 
                          className={`${message.sender === 'user' 
                            ? 'bg-blue-600/50 text-white' 
                            : 'bg-gray-900 text-gray-100'
                          } rounded px-1 py-0.5`}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({children}) => <ul className="list-disc pl-4 mb-2 last:mb-0">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-4 mb-2 last:mb-0">{children}</ol>,
                    li: ({children}) => <li className="mb-1 last:mb-0">{children}</li>
                  }}
                >
                  {messageContent}
                </ReactMarkdown>
              </div>

              {message.sender === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <UserCircleIcon className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        {selectedText && (
          <div className="mb-2 p-2 bg-gray-800 rounded-lg flex items-start justify-between">
            <div className="text-sm text-gray-300 whitespace-pre-wrap break-words mr-2 flex-1">
              {selectedText}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePinText}
                className="p-1 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                title="Pin text"
              >
                <PinIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedText('')}
                className="p-1 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        {pinnedText && (
          <div className="mb-2 p-2 bg-blue-900/30 rounded-lg flex items-start justify-between">
            <div className="text-sm text-blue-200 whitespace-pre-wrap break-words mr-2 flex-1">
              {pinnedText}
            </div>
            <button
              onClick={() => setPinnedText('')}
              className="p-1 text-blue-300 hover:text-white transition-colors flex-shrink-0"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={pinnedText || selectedText ? "Add a message..." : "Ask a question..."}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-20 py-2 text-white 
                      placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
                aria-label="Attach file"
              >
                <PaperClipIcon className="w-5 h-5" />
              </button>
              <button
                type="submit"
                className="p-1.5 text-blue-500 hover:text-blue-400 transition-colors"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="w-5 h-5 rotate-90" />
              </button>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
        </form>
      </div>
    </div>
  );
};

ChatBot.propTypes = {
  onAskQuestion: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  isFullScreen: PropTypes.bool.isRequired,
  setIsFullScreen: PropTypes.func.isRequired
};

export default ChatBot; 