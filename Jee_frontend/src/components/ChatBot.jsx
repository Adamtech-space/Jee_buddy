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
import { useSelection } from '../context/SelectionContext';
import SelectionPopup from './SelectionPopup';

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
  const { user } = useAuthContext();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showHelpButtons, setShowHelpButtons] = useState(false);
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [pinnedImage, setPinnedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const resizeRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);
  const [displayedResponse, setDisplayedResponse] = useState('');
  const { handleTextSelection } = useSelection();
  const [selectedTextPreview, setSelectedTextPreview] = useState(null);

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

  // Listen for AI questions from other components
  useEffect(() => {
    const handleAIQuestion = (event) => {
      if (event.detail?.question) {
        setSelectedTextPreview({
          content: event.detail.question,
          source: event.detail.source || 'Selected Text'
        });
      }
    };

    window.addEventListener('setAIQuestion', handleAIQuestion);
    return () => window.removeEventListener('setAIQuestion', handleAIQuestion);
  }, []);

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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !pinnedImage && !selectedTextPreview) return;

    let questionText = message;

    // Add selected text to messages if it exists
    if (selectedTextPreview) {
      setMessages(prev => [...prev, {
        sender: 'user',
        type: 'selected-text',
        content: selectedTextPreview.content,
        source: selectedTextPreview.source
      }]);
      questionText = selectedTextPreview.content; // Use selected text as question
      setSelectedTextPreview(null);
    }

    if (pinnedImage) {
      setMessages(prev => [...prev, {
        sender: 'user',
        type: 'image',
        content: pinnedImage.content,
        fileName: pinnedImage.fileName
      }]);
      setPinnedImage(null);
    }

    if (message.trim()) {
      setMessages(prev => [...prev, { 
        sender: 'user', 
        type: 'text',
        content: message
      }]);
    }
    setMessage('');

    try {
      const lastImageMessage = [...messages].reverse().find(msg => msg.type === 'image');
      
      const response = await aiService.askQuestion(questionText, {
        subject,
        topic,
        type: 'solve',
        image: (pinnedImage?.content || lastImageMessage?.content)?.split(',')[1],
        sessionId: user?.sessionId
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

      const lastImageMessage = [...messages].reverse().find(msg => msg.type === 'image');
      
      const response = await aiService.getHelpResponse(type, {
        subject,
        topic,
        image: lastImageMessage?.content?.split(',')[1],
        sessionId: user?.sessionId
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
    }
  };

  const handleSaveToFlashCard = (text) => {
    console.log('Save to flash card:', text);
  };

  const handleAskAI = (text) => {
    setMessage(text);
    handleSubmit({ preventDefault: () => {} });
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
                className="max-w-full rounded-lg"
              />
              <div className="mt-2 text-sm text-gray-300">
                {msg.fileName}
              </div>
            </div>
          ) : msg.type === 'selected-text' ? (
            <div className="relative mb-2">
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="text-sm text-gray-300 mb-2">Selected Text from: {msg.source}</div>
                <div className="text-white">{msg.content}</div>
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

  return (
    <>
      <div
        ref={resizeRef}
        className={`fixed top-0 bottom-0 right-0 flex flex-col bg-gray-900 text-white rounded-tl-xl shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: `${width}px` }}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        {/* Resize Handle */}
        {!isFullScreen && (
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
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-white">AI Study Assistant</h3>
              <KeyboardShortcut shortcut="Ctrl+Shift+L" />
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

        {/* Help Buttons */}
        {showHelpButtons && (
          <div className="p-2 border-b border-gray-800 flex flex-wrap gap-2">
            {helpButtons.map((button) => (
              <button
                key={button.type}
                onClick={() => {
                  handleHelpClick(button.type);
                  setShowHelpButtons(false);
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm text-gray-300 hover:text-white"
              >
                <span>{button.icon}</span>
                <span>{button.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          {/* Selected Text Preview */}
          {selectedTextPreview && (
            <div className="mb-3 flex items-center bg-gray-800 rounded-lg p-2">
              <div className="flex-1">
                <div className="text-sm text-gray-300 mb-1">Selected Text</div>
                <div className="text-white text-sm truncate">
                  {selectedTextPreview.content.length > 100 
                    ? `${selectedTextPreview.content.substring(0, 100)}...` 
                    : selectedTextPreview.content}
                </div>
              </div>
              <button
                onClick={() => setSelectedTextPreview(null)}
                className="ml-2 p-1 hover:bg-gray-700 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
              </button>
            </div>
          )}

          {/* Pinned Image Preview */}
          {pinnedImage && (
            <div className="mb-3 flex items-center bg-gray-800 rounded-lg p-2">
              <div className="relative w-12 h-12 flex-shrink-0">
                <img
                  src={pinnedImage.content}
                  alt="Pinned"
                  className="w-full h-full object-cover rounded"
                />
              </div>
              <div className="ml-2 flex-1 text-sm text-gray-300 truncate">
                {pinnedImage.fileName}
              </div>
              <button
                onClick={() => setPinnedImage(null)}
                className="ml-2 p-1 hover:bg-gray-700 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question..."
              className="w-full bg-gray-800 text-white rounded-lg pl-4 pr-24 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <PaperClipIcon className="h-5 w-5 text-gray-400 hover:text-white" />
              </button>
              <button
                type="submit"
                disabled={!message.trim() && !pinnedImage && !selectedTextPreview}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-5 w-5 text-gray-400 hover:text-white" />
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
      <SelectionPopup
        onSaveToFlashCard={handleSaveToFlashCard}
        onAskAI={handleAskAI}
      />
    </>
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