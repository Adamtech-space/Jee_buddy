import { useState, useRef, useEffect } from 'react';
import { 
  XMarkIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { aiService } from '../interceptors/ai.service';
import { useAuthContext } from '../context/AuthContext';

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

const ChatBot = ({ 
  isOpen, 
  setIsOpen, 
  isFullScreen, 
  setIsFullScreen, 
  subject, 
  topic, 
  selectedText,
  setSelectedText,
  onResize 
}) => {
  const { user } = useAuthContext();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [pinnedImage, setPinnedImage] = useState(null);
  const [pinnedText, setPinnedText] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const resizeRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);
  const [displayedResponse, setDisplayedResponse] = useState('');

  // Effect to handle selected text
  useEffect(() => {
    if (selectedText && isOpen) {
      setPinnedText(selectedText);
      setSelectedText(''); // Clear the selection after using it
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [selectedText, isOpen, setSelectedText]);

  // Get user profile from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUserProfile(JSON.parse(userData));
    }
  }, []);

  const helpButtons = [
    { type: "explain", icon: "📝", text: "Step-by-Step" },
    { type: "basics", icon: "🧠", text: "Basics" },
    { type: "test", icon: "🎯", text: "Test Me" },
    { type: "similar", icon: "🔄", text: "Examples" },
    { type: "solve", icon: "✨", text: "Solve" },
    { type: "keypoints", icon: "🔍", text: "Key Points" }
  ];

  // Scroll to bottom effect
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  // Update scroll effect
  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedResponse, isTyping]);

  // Typing effect
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

  // Handle resize functionality
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      e.preventDefault();
      
      const newWidth = window.innerWidth - e.clientX;
      
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Image = reader.result;
          setPinnedImage({
            content: base64Image,
            fileName: file.name
          });
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('File upload failed:', error);
        setMessages(prev => [...prev, {
          sender: 'assistant',
          type: 'text',
          content: "I'm sorry, I couldn't upload the image at the moment. Please try again."
        }]);
      }
      // Reset file input to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !pinnedImage && !pinnedText) return;

    let currentImage = null;
    if (pinnedImage) {
      currentImage = pinnedImage.content;
      setMessages(prev => [...prev, {
        sender: 'user',
        type: 'image',
        content: pinnedImage.content,
        fileName: pinnedImage.fileName
      }]);
      setPinnedImage(null);
    }

    if (pinnedText) {
      setMessages(prev => [...prev, {
        sender: 'user',
        type: 'text',
        content: `Selected text: "${pinnedText}"`
      }]);
      setPinnedText(null);
    }

    if (message.trim()) {
      const newMessage = { 
        sender: 'user', 
        type: 'text',
        content: message
      };
      setMessages(prev => [...prev, newMessage]);
    }
    setMessage('');
    setIsLoading(true);

    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      const response = await aiService.askQuestion(message, {
        subject,
        topic,
        type: 'solve', // interaction_type
        image: currentImage?.split(',')[1],
        pinnedText: pinnedText,
        user_id: userData?.id,
        session_id: userData?.current_session_id
      });

      const aiMessage = {
        sender: 'assistant',
        type: 'text',
        content: response.solution
      };
      setMessages(prev => [...prev, aiMessage]);
      setDisplayedResponse('');
      setCurrentTypingIndex(0);
      setIsTyping(true);
    } catch (error) {
      console.error('Chat request failed:', error);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        type: 'text',
        content: "I'm sorry, I couldn't process your message at the moment. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHelpClick = async (type) => {
    try {
      const helpMessage = {
        sender: 'user',
        type: 'text',
        content: `Help me with: ${type}`
      };
      setMessages(prev => [...prev, helpMessage]);
      setIsLoading(true);

      const lastImageMessage = [...messages].reverse().find(msg => msg.type === 'image');
      
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      const response = await aiService.getHelpResponse(type, {
        subject,
        topic,
        type, // interaction_type from help button
        image: lastImageMessage?.content?.split(',')[1],
        user_id: userData?.id,
        session_id: userData?.current_session_id
      });

      setMessages(prev => [...prev, {
        sender: 'assistant',
        type: 'text',
        content: response.solution
      }]);
    } catch (error) {
      console.error('Help request failed:', error);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        type: 'text',
        content: "I'm sorry, I couldn't process your request at the moment. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (msg, index) => {
    const isLastMessage = index === messages.length - 1;
    const content = isLastMessage && msg.sender === 'assistant' ? displayedResponse : msg.content;

    return (
      <div 
        key={index} 
        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
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
          {msg.type === 'image' ? (
            <div className="relative mb-2">
              <img 
                src={msg.content} 
                alt="Uploaded content" 
                className="max-w-full h-auto rounded-lg object-contain"
                style={{ maxHeight: '300px' }}
              />
              <div className="mt-2 text-sm text-gray-300">
                {msg.fileName}
              </div>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
              {content}
              {isLastMessage && msg.sender === 'assistant' && isTyping && (
                <span className="inline-block w-2 h-5 bg-blue-400 animate-pulse ml-1">|</span>
              )}
            </pre>
          )}
        </div>

        {msg.sender === 'user' && userProfile?.picture && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden ml-2">
            <img 
              src={userProfile.picture} 
              alt={userProfile.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    );
  };

  // Update initial width based on screen size
  useEffect(() => {
    const updateWidth = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 640) { // mobile
        setWidth(screenWidth);
      } else if (screenWidth < 1024) { // tablet
        setWidth(400);
      } else { // desktop
        setWidth(450);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div
      ref={resizeRef}
      className={`fixed flex flex-col bg-gray-900 text-white shadow-2xl transform transition-all duration-300 ease-in-out ${
        isFullScreen 
          ? 'inset-0 rounded-none' 
          : 'top-0 bottom-0 right-0 rounded-tl-xl'
      } ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ 
        width: isFullScreen || window.innerWidth < 640 ? '100%' : `${width}px`,
        zIndex: isFullScreen ? 60 : 50
      }}
    >
      {/* Resize Handle - Only show on desktop */}
      {!isFullScreen && window.innerWidth >= 1024 && (
        <>
          {isResizing && (
            <div className="fixed inset-0 bg-black bg-opacity-0 z-50" />
          )}
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
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500 transition-colors" />
            {isResizing && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
            )}
          </div>
        </>
      )}

      {/* Header */}
      <div className={`flex items-center justify-between p-2 sm:p-3 md:p-4 border-b border-gray-800 ${isFullScreen ? 'px-3 sm:px-5 md:px-6' : ''} bg-gray-900`}>
        <div className="flex items-center space-x-2">
          <div className="flex flex-col">
            <h3 className="text-sm sm:text-lg md:text-xl font-bold text-white">AI Study Assistant</h3>
            <div className="hidden sm:block">
              <KeyboardShortcut shortcut="Ctrl+Shift+L" />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
          >
            {isFullScreen ? (
              <ArrowsPointingInIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            ) : (
              <ArrowsPointingOutIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              if (isFullScreen) {
                setIsFullScreen(false);
              }
            }}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Help Buttons - Always visible */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="flex overflow-x-auto gap-1 p-1.5 hide-scrollbar">
          {helpButtons.map((button) => (
            <button
              key={button.type}
              onClick={() => handleHelpClick(button.type)}
              className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-[11px] sm:text-sm text-gray-300 hover:text-white whitespace-nowrap flex-shrink-0"
            >
              <span className="text-base">{button.icon}</span>
              <span>{button.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 bg-gray-900 hide-scrollbar">
        {messages.map(renderMessage)}
        {isLoading && (
          <div className="flex justify-start mb-2">
            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-5 sm:w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-2 shadow-xl">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input with Pinned Content */}
      <div className="p-2 border-t border-gray-800 bg-gray-900">
        {/* Pinned Text */}
        {pinnedText && (
          <div className="mb-2 flex items-center bg-gray-800 rounded-lg p-1.5">
            <div className="flex-1 text-xs text-gray-300 line-clamp-2">
              <span className="text-blue-400 font-medium">Selected text:</span> {pinnedText}
            </div>
            <button
              onClick={() => setPinnedText(null)}
              className="ml-1 p-1 hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-white" />
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a question..."
            className="w-full bg-gray-800 text-white text-sm rounded-lg pl-3 pr-20 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
            >
              <PaperClipIcon className="h-4 w-4 text-gray-400 hover:text-white" />
            </button>
            <button
              type="submit"
              disabled={!message.trim() && !pinnedImage && !pinnedText}
              className="p-1.5 hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-4 w-4 text-gray-400 hover:text-white" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
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
  selectedText: PropTypes.string,
  setSelectedText: PropTypes.func,
  onResize: PropTypes.func
};

export default ChatBot; 