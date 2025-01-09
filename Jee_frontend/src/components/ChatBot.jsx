import { useState, useRef, useEffect } from 'react';
import { 
  XMarkIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  XCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { aiService } from '../interceptors/ai.service';

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

// Add a new KeyboardShortcut component
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

const ChatBot = ({ isOpen, setIsOpen, isFullScreen, setIsFullScreen, subject, topic, onResize }) => {
  const [message, setMessage] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [pinnedText, setPinnedText] = useState('');
  const [messages, setMessages] = useState([]);
  const [showHelpButtons, setShowHelpButtons] = useState(false);
  const [width, setWidth] = useState(450); // Initial width
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const resizeRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);
  const [displayedResponse, setDisplayedResponse] = useState('');

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

  const handleHelpClick = async (type) => {
    try {
      // Add user's help request to messages
      const helpMessage = {
        sender: 'user',
        content: `Help me with: ${type}`
      };
      setMessages(prev => [...prev, helpMessage]);

      // Get AI response
      const response = await aiService.getHelpResponse(type, {
        subject,
        topic,
        selectedText,
        pinnedText
      });

      // Add AI response to messages
      setMessages(prev => [...prev, {
        sender: 'assistant',
        content: response.message
      }]);
    } catch (error) {
      console.error('Help request failed:', error);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        content: "I'm sorry, I couldn't process your request at the moment. Please try again."
      }]);
    }
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

  // Improved scroll handling with smooth behavior
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  // Update scroll effect to trigger on more events
  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedResponse, isTyping]);

  // Enhanced typing effect with better performance
  useEffect(() => {
    if (isTyping && currentTypingIndex < messages[messages.length - 1]?.content.length) {
      const timer = setTimeout(() => {
        setDisplayedResponse(messages[messages.length - 1].content.slice(0, currentTypingIndex + 1));
        setCurrentTypingIndex(prev => prev + 1);
        scrollToBottom();
      }, 10);
      return () => clearTimeout(timer);
    } else if (isTyping) {
      setIsTyping(false);
    }
  }, [isTyping, currentTypingIndex, messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !pinnedText) return;

    const userMessage = pinnedText ? `${pinnedText}\n\n${message}`.trim() : message;

    // Add user message to chat
    const newMessage = { 
      sender: 'user', 
      content: userMessage,
      type: 'text'
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    try {
      // Get AI response
      const response = await aiService.askQuestion(userMessage, {
        subject,
        topic,
        selectedText,
        pinnedText
      });

      // Add AI response to messages
      const aiMessage = {
        sender: 'assistant',
        content: response.solution,
        type: 'text'
      };
      setMessages(prev => [...prev, aiMessage]);
      setDisplayedResponse('');
      setCurrentTypingIndex(0);
      setIsTyping(true);
    } catch (error) {
      console.error('Chat request failed:', error);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        content: "I'm sorry, I couldn't process your message at the moment. Please try again.",
        type: 'text'
      }]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Add file upload message
        setMessages(prev => [...prev, {
          sender: 'user',
          content: `Uploading file: ${file.name}`
        }]);

        // Analyze file
        const response = await aiService.analyzeFile(file, {
          subject,
          topic
        });

        // Add analysis response
        setMessages(prev => [...prev, {
          sender: 'assistant',
          content: response.message
        }]);
      } catch (error) {
        console.error('File analysis failed:', error);
        setMessages(prev => [...prev, {
          sender: 'assistant',
          content: "I'm sorry, I couldn't analyze the file at the moment. Please try again."
        }]);
      }
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

  // Handle resize functionality
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      e.preventDefault();
      
      // Calculate new width from right edge to mouse position
      const newWidth = window.innerWidth - e.clientX;
      
      // Set minimum and maximum width constraints with smoother bounds
      if (newWidth >= 350 && newWidth <= 800) {
        requestAnimationFrame(() => {
          setWidth(newWidth);
          onResize?.(newWidth);
        });
      } else if (newWidth < 350) {
        requestAnimationFrame(() => {
          setWidth(350);
          onResize?.(350);
        });
      } else if (newWidth > 800) {
        requestAnimationFrame(() => {
          setWidth(800);
          onResize?.(800);
        });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.body.classList.remove('resize-active');
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.classList.add('resize-active');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.body.classList.remove('resize-active');
    };
  }, [isResizing, onResize]);

  // Enhanced message rendering with quick options support
  const renderMessage = (msg, index) => {
    const isLastMessage = index === messages.length - 1;
    const content = isLastMessage && msg.sender === 'assistant' ? displayedResponse : msg.content;

    return (
      <div 
        key={index} 
        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
        onMouseUp={handleMessageTextSelection}
      >
        {msg.sender === 'assistant' && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        <div 
          className={`max-w-[80%] rounded-lg p-4 ${
            msg.sender === 'user' 
              ? 'bg-blue-500 text-white ml-2' 
              : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-xl'
          }`}
        >
          <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
            {content}
            {isLastMessage && msg.sender === 'assistant' && isTyping && (
              <span className="inline-block w-2 h-5 bg-blue-400 animate-pulse ml-1">|</span>
            )}
          </pre>
        </div>

        {msg.sender === 'user' && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  // Add text selection handler
  const handleMessageTextSelection = () => {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      setSelectedText(selectedText);
    }
  };

  return (
    <div 
      className={`flex flex-col h-full bg-gray-900 border-l border-gray-800 ${!isOpen ? 'hidden' : ''}`}
      style={{ 
        width: isFullScreen ? '100%' : `${width}px`,
        transition: isResizing ? 'none' : 'width 0.2s ease-out'
      }}
    >
      {/* Resize Handle */}
      {!isFullScreen && (
        <>
          {/* Resize overlay when resizing */}
          {isResizing && (
            <div className="fixed inset-0 bg-black bg-opacity-0 z-50" />
          )}
          
          {/* Resize handle */}
          <div
            ref={resizeRef}
            className="absolute left-0 top-0 bottom-0 w-2 hover:w-1 group z-50 transition-all"
            style={{ cursor: 'ew-resize' }}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
              document.body.style.cursor = 'ew-resize';
              document.body.style.userSelect = 'none';
            }}
          >
            {/* Visual handle indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500 transition-colors" />
            
            {/* Active resize indicator */}
            {isResizing && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
            )}
          </div>
        </>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-white">AI Study Assistant</h3>
            <KeyboardShortcut shortcut=" Ctrl+Shift+L" />
          </div>
          <button
            onClick={() => setShowHelpButtons(!showHelpButtons)}
            className="p-1 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
            aria-label="Toggle help options"
          >
            <QuestionMarkCircleIcon className="w-6 h-6" />
          </button>
        </div>
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

      {/* Help Buttons - Now conditionally rendered */}
      {showHelpButtons && (
        <div className={`p-2 border-b border-gray-800 ${isFullScreen ? 'grid grid-cols-4 gap-2' : 'flex flex-wrap gap-2'}`}>
          {visibleButtons.map((button) => (
            <button
              key={button.type}
              onClick={() => {
                handleHelpClick(button.type);
                setShowHelpButtons(false); // Close help buttons after selection
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm text-gray-300 hover:text-white"
            >
              <span>{button.icon}</span>
              <span>{button.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Updated messages container with hidden scrollbar */}
      <div className="flex-1 overflow-y-auto h-[calc(100%-8rem)] scrollbar-none">
        <div className="space-y-4 p-4">
          {messages.map((msg, index) => renderMessage(msg, index))}
          <div ref={messagesEndRef} />
        </div>
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
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  isFullScreen: PropTypes.bool.isRequired,
  setIsFullScreen: PropTypes.func.isRequired,
  subject: PropTypes.string,
  topic: PropTypes.string,
  onResize: PropTypes.func
};

export default ChatBot; 