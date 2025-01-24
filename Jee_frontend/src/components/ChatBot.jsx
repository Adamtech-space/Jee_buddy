import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  XMarkIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  PencilIcon,
  StopIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { aiService } from '../interceptors/ai.service';
import { useSelection } from '../hooks/useSelection';

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
  const [chatMessage, setMessage] = useState('');
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
  const [isPinnedText, setIsPinnedText] = useState(false);
  const [isPinnedImage, setIsPinnedImage] = useState(false);
  const [isDeepThinkEnabled, setIsDeepThinkEnabled] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [abortController, setAbortController] = useState(null);
  const [activeHelpType, setActiveHelpType] = useState(null);

  // Smooth scrolling functionality
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, []);

  // Update scroll logic for smoother control
  useEffect(() => {
    const container = document.querySelector('.overflow-y-auto');
    if (!container) return;

    let userScrolling = false;
    let lastScrollTop = container.scrollTop;
    let touchStartY = 0; // Track touch start position

    const handleScroll = () => {
      const isAtBottom =
        Math.abs(
          container.scrollHeight - container.scrollTop - container.clientHeight
        ) < 100;
      const isScrollingDown = container.scrollTop > lastScrollTop;
      lastScrollTop = container.scrollTop;

      if (isScrollingDown && isAtBottom) {
        userScrolling = false;
      } else {
        userScrolling = !isAtBottom;
      }
    };

    // Add touch event handlers for better mobile support
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const touchY = e.touches[0].clientY;
      const isScrollingUp = touchY > touchStartY;

      if (isScrollingUp) {
        userScrolling = true; // User is actively scrolling up
      }

      touchStartY = touchY;
    };

    const observer = new MutationObserver(() => {
      if (!userScrolling) {
        requestAnimationFrame(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
          });
        });
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
    });

    // Add event listeners
    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Mouse wheel event for more precise control
    container.addEventListener(
      'wheel',
      () => {
        userScrolling = true;
      },
      { passive: true }
    );

    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('wheel', () => {
        userScrolling = true;
      });
    };
  }, [messages]);

  // Modify typing effect to allow free scrolling
  useEffect(() => {
    let timer;
    const currentMessage = messages[messages.length - 1];
    const container = document.querySelector('.overflow-y-auto');
    
    if (isTyping && currentMessage?.sender === 'assistant' && 
        currentTypingIndex < currentMessage.content.length) {
      timer = setTimeout(() => {
        if (!isTyping) return;
        
        setDisplayedResponse(
          currentMessage.content.slice(0, currentTypingIndex + 1)
        );
        setCurrentTypingIndex(prev => prev + 1);
        
        // Only auto-scroll if user is already at the bottom
        if (container) {
          const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 100;
          if (isAtBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }
      }, 1);
    } else if (isTyping && currentMessage?.sender === 'assistant') {
      setIsTyping(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isTyping, currentTypingIndex, messages]);

  // Add message editing function
  const handleEditMessage = (messageId, content) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  // Save edited message and regenerate response
  const handleSaveEdit = async (messageId) => {
    // Find the edited message and its index
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    // Update the edited message
    const updatedMessages = messages.slice(0, messageIndex + 1).map(msg => 
      msg.id === messageId ? { ...msg, content: editingContent } : msg
    );
    
    setMessages(updatedMessages);
    setEditingMessageId(null);
    setEditingContent('');

    // Regenerate response
    setIsLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user')) || {};
      const sessionId = userData.current_session_id;

      if (!sessionId) {
        throw new Error('No valid session ID found');
      }

      const response = await aiService.askQuestion(editingContent, {
        user_id: userData.id || 'anonymous',
        session_id: sessionId,
        subject: subject || '',
        topic: topic || '',
        type: 'solve',
        pinnedText: '',
        selectedText: '',
        source: 'Chat',
        Deep_think: isDeepThinkEnabled,
      });

      const aiMessage = {
        id: Date.now(),
        sender: 'assistant',
        type: 'text',
        content: response.solution,
      };
      
      setMessages([...updatedMessages, aiMessage]);
      setDisplayedResponse('');
      setCurrentTypingIndex(0);
      setIsTyping(true);
      
    } catch (error) {
      console.error('ChatBot - Error regenerating response:', error);
      const errorMessage = `Failed to regenerate response: ${error?.message || 'Please try again'}`;
      setMessages([
        ...updatedMessages,
        {
          id: Date.now(),
          sender: 'assistant',
          type: 'text',
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Modify cancel response to stop typing effect immediately
  const handleCancelResponse = useCallback(() => {
    setIsTyping(false); // Stop typing effect immediately
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsLoading(false);
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'assistant') {
        const finalContent = displayedResponse || lastMessage.content;
        setMessages(prev => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            content: finalContent,
          };
          return updatedMessages;
        });
        setDisplayedResponse(finalContent);
        setCurrentTypingIndex(finalContent.length);
      }
    }
  }, [abortController, messages, displayedResponse]);

  // Modify handleSubmit to properly handle cancellation
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!chatMessage.trim() && !pinnedImage && !selectedTextPreview) {
      return;
    }

    // If currently generating, cancel instead
    if (isLoading || isTyping) {
      handleCancelResponse();
      return;
    }

    // Create new AbortController
    const controller = new AbortController();
    setAbortController(controller);

    // Add user message first
    const messageId = Date.now();
    const userMessage = pinnedImage ? {
      id: messageId,
      sender: 'user',
      type: 'image',
      content: pinnedImage.content,
      fileName: pinnedImage.fileName,
      question: chatMessage
    } : {
      id: messageId,
      sender: 'user',
      type: selectedTextPreview ? 'selected-text' : 'text',
      content: chatMessage,
      source: selectedTextPreview?.source,
      selectedText: selectedTextPreview?.content
    };

    setMessages(prev => [...prev, userMessage]);

    // Clear states if not pinned
    const questionContext = selectedTextPreview;
    const imageToSend = pinnedImage;
    if (!isPinnedText) setSelectedTextPreview(null);
    if (!isPinnedImage) setPinnedImage(null);
    setMessage('');
    setIsLoading(true);

    try {
      const userData = JSON.parse(localStorage.getItem('user')) || {};
      const sessionId = userData.current_session_id;

      if (!sessionId) {
        throw new Error('No valid session ID found');
      }

      const questionWithInteraction = `${chatMessage} (${activeHelpType || 'solve'})`;

      const response = await aiService.askQuestion(questionWithInteraction, {
        user_id: userData.id || 'anonymous',
        session_id: sessionId,
        subject: subject || '',
        topic: topic || '',
        type: activeHelpType || 'solve',
        pinnedText: '',
        selectedText: questionContext?.content || '',
        source: questionContext?.source || 'Chat',
        image: imageToSend?.content?.split(',')[1] || null,
        Deep_think: isDeepThinkEnabled,
        signal: controller.signal,
      });

      // Check if cancelled before updating state
      if (controller.signal.aborted) {
        return;
      }

      const aiMessage = {
        id: Date.now(),
        sender: 'assistant',
        type: 'text',
        content: response.solution,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setDisplayedResponse('');
      setCurrentTypingIndex(0);
      setIsTyping(true);
      setIsDeepThinkEnabled(false);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }
      console.error('ChatBot - Error processing message:', error);
      const errorMessage = `Failed to process message: ${error?.message || 'Please try again'}`;
      setMessages(prev => [...prev, {
        id: Date.now(),
          sender: 'assistant',
          type: 'text',
          content: errorMessage,
      }]);
      setDisplayedResponse(errorMessage);
      setCurrentTypingIndex(errorMessage.length);
    } finally {
      if (!controller.signal.aborted) {
      setIsLoading(false);
        setAbortController(null);
    }
    }
  }, [chatMessage, selectedTextPreview, pinnedImage, isPinnedText, isPinnedImage, subject, topic, isDeepThinkEnabled, handleCancelResponse, activeHelpType, isLoading, isTyping]);

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
        const text = event.detail.question;
        const source = event.detail.source || 'Selected Text';
        
        // Set the selected text preview
        setSelectedTextPreview({
          content: text,
          source: source
        });

        // Open chat if not already open
        if (!isOpen) {
          setIsOpen(true);
        }

        // Focus the input for user to type their question
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    window.addEventListener('setAIQuestion', handleAIQuestion);
    return () => {
      window.removeEventListener('setAIQuestion', handleAIQuestion);
    };
  }, [isOpen, setIsOpen]);

  const helpButtons = [
    { type: 'Step-by-Step', icon: '📝', text: 'Step-by-Step' },
    { type: 'Basics', icon: '🧠', text: 'Basics' },
    { type: 'Test Me', icon: '🎯', text: 'Test Me' },
    { type: 'Examples', icon: '🔄', text: 'Examples' },
    { type: 'Solve', icon: '✨', text: 'Solve' },
    { type: 'Key Points', icon: '🔍', text: 'Key Points' },
    { type: 'Explain', icon: '📝', text: 'Explain' },
    { type: 'Similar', icon: '🔄', text: 'Similar' },
  ]

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

  const handleHelpClick = (type) => {
    if (activeHelpType === type) {
      setActiveHelpType(null);
    } else {
      setActiveHelpType(type);
    }
  };

  const renderMessage = (msg, index) => {
    const isLastMessage = index === messages.length - 1;
    const content = isLastMessage && msg.sender === 'assistant' ? displayedResponse : msg.content;
    const isEditing = msg.id === editingMessageId;

    return (
      <div
        key={msg.id || index}
        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4 group items-start`}
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

        {/* Edit button for user messages */}
        {msg.sender === 'user' && !isEditing && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mr-2">
            <button
              onClick={() => handleEditMessage(msg.id, msg.content)}
              className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <PencilIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

        <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[75%]`}>
          <div
            className={`rounded-lg p-3 break-words w-full ${
            msg.sender === 'user'
                ? 'bg-blue-500 text-white'
              : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-xl'
          }`}
      >
            {isEditing ? (
              <div className="flex flex-col gap-2 w-full">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded p-2 min-h-[100px] resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingMessageId(null)}
                    className="px-2 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit(msg.id)}
                    className="px-2 py-1 text-sm bg-blue-500 hover:bg-blue-600 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : msg.type === 'image' ? (
            <div className="space-y-2">
              <div className="relative bg-gray-800/50 rounded p-2">
                <img
                  src={msg.content}
                  alt="Uploaded content"
                  className="w-32 h-32 object-cover rounded"
                />
                {msg.fileName && (
                  <div className="flex items-center gap-1 text-xs text-gray-300 mt-1">
                    <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span>{msg.fileName}</span>
                  </div>
                )}
              </div>
              {msg.question && (
                <div className="text-[15px]">
                  {msg.question}
                </div>
              )}
            </div>
          ) : msg.type === 'selected-text' ? (
            <div className="space-y-2">
                <div className="text-xs bg-gray-800/50 rounded p-2 break-words">
                {msg.selectedText}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-300">
                <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>{msg.source}</span>
              </div>
                <div className="text-[15px] break-words">
                {content}
              </div>
            </div>
          ) : (
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {content}
              {isLastMessage && msg.sender === 'assistant' && isTyping && (
                <span className="inline-block w-2 h-5 bg-blue-400 animate-pulse ml-1">
                  |
                </span>
              )}
              </div>
          )}
          </div>
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

  // Render loading state with SparklesIcon
  const renderLoadingState = () => (
    <div className="flex justify-start mb-2">
      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center mr-2">
        <SparklesIcon
          className="h-3 w-3 sm:h-5 sm:w-5 text-white animate-spin"
          viewBox="0 0 20 20"
          fill="currentColor"
        />
      </div>
      <div className="flex flex-col items-center gap-2 w-full max-w-[80%]">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-3 shadow-xl flex items-center gap-3 w-full">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-4 h-4 text-blue-400 animate-pulse" />
            <div className="flex flex-col gap-1">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" 
                     style={{ animationDuration: '1.5s', animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" 
                     style={{ animationDuration: '1.5s', animationDelay: '300ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" 
                     style={{ animationDuration: '1.5s', animationDelay: '600ms' }} />
              </div>
              <span className="text-xs text-blue-400">Thinking...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
        if (!(e.target instanceof HTMLButtonElement) && 
            !(e.target instanceof HTMLInputElement)) {
          handleTextSelection(e);
        }
      }}
      onTouchEnd={(e) => {
        if (!(e.target instanceof HTMLButtonElement) && 
            !(e.target instanceof HTMLInputElement)) {
          handleTextSelection(e);
        }
      }}
    >
      {/* Resize Handle - Only show on desktop */}
      {!isFullScreen && window.innerWidth >= 1024 && (
        <>
          {isResizing && (
            <div className="fixed inset-0 bg-black bg-opacity-0 " />
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
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-[11px] sm:text-sm flex-shrink-0 ${
                activeHelpType === button.type ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
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
        {isLoading && renderLoadingState()}
        <div ref={messagesEndRef} />
      </div>

      {/* Input with Pinned Content */}
      <div className="p-2 border-t border-gray-800 bg-gray-900">
        {/* Selected Text Preview */}
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPinnedText(!isPinnedText)}
                className="p-1 hover:bg-gray-700/50 rounded-full transition-colors flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" 
                     className={`h-4 w-4 ${isPinnedText ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`} 
                     viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.293 1.293a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 4.414V15a1 1 0 11-2 0V4.414L7.707 5.707a1 1 0 01-1.414-1.414l3-3z" />
                </svg>
              </button>
              <button
                onClick={() => setSelectedTextPreview(null)}
                className="p-1 hover:bg-gray-700/50 rounded-full transition-colors flex-shrink-0"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-white" />
              </button>
            </div>
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPinnedImage(!isPinnedImage)}
                className="p-1 hover:bg-gray-700/50 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" 
                     className={`h-4 w-4 ${isPinnedImage ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`} 
                     viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.293 1.293a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 4.414V15a1 1 0 11-2 0V4.414L7.707 5.707a1 1 0 01-1.414-1.414l3-3z" />
                </svg>
              </button>
              <button
                onClick={() => setPinnedImage(null)}
                className="p-1 hover:bg-gray-700/50 rounded-full transition-colors"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={chatMessage}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a question..."
            className="w-full bg-gray-800 text-white text-sm rounded-lg pl-3 pr-24 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setIsDeepThinkEnabled(!isDeepThinkEnabled)}
              className={`p-1.5 rounded-full transition-all duration-200 ${
                isDeepThinkEnabled 
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 animate-pulse' 
                  : 'hover:bg-gray-700'
              }`}
              title={isDeepThinkEnabled ? "Deep Think: ON" : "Deep Think: OFF"}
            >
              <span className={`text-lg inline-block transition-all duration-200 ${
                isDeepThinkEnabled 
                  ? 'text-blue-400 animate-bounce' 
                  : 'text-gray-400 hover:text-white'
              }`}>
                🧠
              </span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
              title="Upload Image"
            >
              <PaperClipIcon className="h-4 w-4 text-gray-400 hover:text-white" />
            </button>
            <button
              type={isLoading || isTyping ? "button" : "submit"}
              onClick={isLoading || isTyping ? handleCancelResponse : undefined}
              disabled={!chatMessage.trim() && !pinnedImage && !selectedTextPreview}
              className={`p-1.5 hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 ${
                isLoading || isTyping ? 'text-red-500 hover:text-red-400' : ''
              }`}
              title={isLoading || isTyping ? "Stop generating" : "Send Message"}
            >
              {isLoading || isTyping ? (
                <StopIcon className="h-4 w-4" />
              ) : (
              <PaperAirplaneIcon className="h-4 w-4 text-gray-400 hover:text-white" />
              )}
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

// Add this at the end of the file, before the export
const wave = `
@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}
`;

// Add the style tag to inject the animation
const styleTag = document.createElement('style');
styleTag.textContent = wave;
document.head.appendChild(styleTag);