import { useState, useRef, useEffect } from 'react';
import { 
  XMarkIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { aiService } from '../interceptors/ai.service';
import { saveFlashCard } from '../interceptors/services';
import SelectionPopup from './SelectionPopup';
import { SaveOutlined } from '@ant-design/icons';
import { useSelection } from '../context/SelectionContext';
import { message } from 'antd';

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
  onResize 
}) => {
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [pinnedImage, setPinnedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const resizeRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);
  const [displayedResponse, setDisplayedResponse] = useState('');
  const { handleTextSelection } = useSelection();
  const [selectedTextPreview, setSelectedTextPreview] = useState(null);

  // Get user profile from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUserProfile(JSON.parse(userData));
    }
  }, []);

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

  const handleSaveToFlashCard = async (text) => {
    if (!text) {
      message.error('Please select some text to save');
      return;
    }

    const hide = message.loading('Saving to flash cards...', 0);
    try {
      const payload = {
        subject: subject || 'General',
        topic: 'AI Chat Bot',
        content: text,
        source: 'AI Chat Bot',
      };

      const response = await saveFlashCard(payload);
      hide();

      if (response) {
        message.success({
          content: 'Successfully saved to flash cards!',
          icon: <SaveOutlined style={{ color: '#52c41a' }} />,
          duration: 3,
        });
        // Clear the selection after handling
        window.getSelection()?.removeAllRanges();
      } else {
        throw new Error('Failed to save flash card');
      }
    } catch (error) {
      hide();
      message.error({
        content: error?.message || 'Failed to save to flash cards',
        duration: 3,
      });
    }
  };

  const handleAskAI = (text) => {
    if (!text) return;
    
    // Set the selected text preview
    setSelectedTextPreview({
      content: text,
      source: 'Selected Text'
    });

    // Clear the selection
    window.getSelection()?.removeAllRanges();
  };

  const helpButtons = [
    { type: 'explain', icon: '📝', text: 'Step-by-Step' },
    { type: 'basics', icon: '🧠', text: 'Basics' },
    { type: 'test', icon: '🎯', text: 'Test Me' },
    { type: 'similar', icon: '🔄', text: 'Examples' },
    { type: 'solve', icon: '✨', text: 'Solve' },
    { type: 'keypoints', icon: '🔍', text: 'Key Points' },
  ];

  // Scroll to bottom effect
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  };

  // Update scroll effect
  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedResponse, isTyping]);

  // Typing effect
  useEffect(() => {
    if (
      isTyping &&
      currentTypingIndex < messages[messages.length - 1]?.content.length
    ) {
      const timer = setTimeout(() => {
        setDisplayedResponse(
          messages[messages.length - 1].content.slice(0, currentTypingIndex + 1)
        );
        setCurrentTypingIndex((prev) => prev + 1);
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
            fileName: file.name,
          });
        };
        reader.readAsDataURL(file);
      } catch (error) {
        const errorMessage = `Image upload failed: ${error?.message || 'Please try again'}`;
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            type: 'text',
            content: errorMessage,
          },
        ]);
        setDisplayedResponse(errorMessage);
        setCurrentTypingIndex(errorMessage.length);
        // Reset file input to allow selecting the same file again
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() && !pinnedImage && !selectedTextPreview) return;

    let questionText = chatMessage;

    // If there's selected text, use it as the question
    if (selectedTextPreview) {
      questionText = selectedTextPreview.content;
      setMessages(prev => [...prev, {
        sender: 'user',
        type: 'selected-text',
        content: selectedTextPreview.content,
        source: selectedTextPreview.source
      }]);
      setSelectedTextPreview(null);
    }

    if (chatMessage.trim()) {
      setMessages(prev => [...prev, {
        sender: 'user',
        type: 'text',
        content: chatMessage
      }]);
    }

    setChatMessage('');
    setIsLoading(true);

    try {
      const response = await aiService.askQuestion(questionText, {
        subject,
        topic,
        type: 'solve',
        image: pinnedImage?.content?.split(',')[1],
      });

      const aiMessage = {
        sender: 'assistant',
        type: 'text',
        content: response.solution,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setDisplayedResponse('');
      setCurrentTypingIndex(0);
      setIsTyping(true);
    } catch (error) {
      const errorMessage = `Failed to process message: ${error?.message || 'Please try again'}`;
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          type: 'text',
          content: errorMessage,
        },
      ]);
      setDisplayedResponse(errorMessage);
      setCurrentTypingIndex(errorMessage.length);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHelpClick = async (type) => {
    try {
      const helpMessage = {
        sender: 'user',
        type: 'text',
        content: `Help me with: ${type}`,
      };
      setMessages((prev) => [...prev, helpMessage]);
      setIsLoading(true);

      const lastImageMessage = [...messages]
        .reverse()
        .find((msg) => msg.type === 'image');

      const response = await aiService.getHelpResponse(type, {
        subject,
        topic,
        type,
        image: lastImageMessage?.content?.split(',')[1],
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          type: 'text',
          content: response.solution,
        },
      ]);
    } catch (error) {
      const errorMessage = `Failed to process request: ${error?.message || 'Please try again'}`;
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          type: 'text',
          content: errorMessage,
        },
      ]);
      setDisplayedResponse(errorMessage);
      setCurrentTypingIndex(errorMessage.length);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (msg, index) => {
    const isLastMessage = index === messages.length - 1;
    const content =
      isLastMessage && msg.sender === 'assistant'
        ? displayedResponse
        : msg.content;

    return (
      <div
        key={index}
        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {msg.sender === 'assistant' && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
                clipRule="evenodd"
              />
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
              <div className="mt-2 text-sm text-gray-300">{msg.fileName}</div>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
              {content}
              {isLastMessage && msg.sender === 'assistant' && isTyping && (
                <span className="inline-block w-2 h-5 bg-blue-400 animate-pulse ml-1">
                  |
                </span>
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
      if (screenWidth < 640) {
        // mobile
        setWidth(screenWidth);
      } else if (screenWidth < 1024) {
        // tablet
        setWidth(400);
      } else {
        // desktop
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
      } ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      style={{
        width: isFullScreen || window.innerWidth < 640 ? '100%' : `${width}px`,
        zIndex: isFullScreen ? 60 : 50,
      }}
      onMouseUp={(e) => {
        if (!(e.target instanceof HTMLInputElement)) {
          handleTextSelection(e);
        }
      }}
      onTouchEnd={(e) => {
        if (!(e.target instanceof HTMLInputElement)) {
          handleTextSelection(e);
        }
      }}
    >
      {/* Selection Popup */}
      <SelectionPopup
        onSaveToFlashCard={handleSaveToFlashCard}
        onAskAI={handleAskAI}
      />

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
      <div
        className={`flex items-center justify-between p-2 sm:p-3 md:p-4 border-b border-gray-800 ${
          isFullScreen ? 'px-3 sm:px-5 md:px-6' : ''
        } bg-gray-900`}
      >
        <div className="flex items-center space-x-2">
          <div className="flex flex-col">
            <h3 className="text-sm sm:text-lg md:text-xl font-bold text-white">
              AI Study Assistant
            </h3>
            <div className="hidden sm:block">
              <KeyboardShortcut shortcut="Ctrl+Shift+L" />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 sm:h-5 sm:w-5 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-2 shadow-xl">
              <div className="flex gap-1">
                <div
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input with Pinned Content */}
      <div className="p-2 border-t border-gray-800 bg-gray-900">
        {/* Selected Text Preview - Show this before pinned image */}
        {selectedTextPreview && (
          <div className="mb-2 flex items-start bg-gray-800/50 rounded-lg p-1.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-xs text-gray-400">Selected Text</span>
                <span className="text-[10px] text-gray-500">•</span>
                <span className="text-[10px] text-gray-500 truncate">
                  {selectedTextPreview.source}
                </span>
              </div>
              <div className="text-xs text-gray-300 line-clamp-2">
                {selectedTextPreview.content}
              </div>
            </div>
            <button
              onClick={() => setSelectedTextPreview(null)}
              className="ml-1.5 p-1 hover:bg-gray-700/50 rounded-full transition-colors flex-shrink-0"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-white" />
            </button>
          </div>
        )}

        {/* Pinned Image Preview */}
        {pinnedImage && (
          <div className="mb-2 flex items-center bg-gray-800/50 rounded-lg p-2">
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
              className="ml-2 p-1 hover:bg-gray-700/50 rounded-full transition-colors"
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
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
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
              disabled={!chatMessage.trim() && !pinnedImage && !selectedTextPreview}
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
  onResize: PropTypes.func
};

export default ChatBot;