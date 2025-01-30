import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { 
  XMarkIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  StopIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  PencilIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { aiService } from '../interceptors/ai.service';
import { useSelection } from '../hooks/useSelection';
import { MathJax } from 'better-react-mathjax';

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

// Move helpButtons outside component to prevent recreation
const helpButtons = [
  { type: 'Step-by-Step', icon: '📝', text: 'Step-by-Step' },
  { type: 'Basics', icon: '🧠', text: 'Basics' },
  { type: 'Test Me', icon: '🎯', text: 'Test Me' },
  { type: 'Examples', icon: '🔄', text: 'Examples' },
  { type: 'Solve', icon: '✨', text: 'Solve' },
  { type: 'Key Points', icon: '🔍', text: 'Key Points' },
  { type: 'Explain', icon: '📝', text: 'Explain' },
  { type: 'Similar', icon: '🔄', text: 'Similar' },
];

// Memoize the HelpButton component
const HelpButton = memo(({ button, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-1.5 px-3 py-1.5 rounded-lg
      transition-all duration-300 ease-out
      text-xs flex-shrink-0 font-medium
      ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20 scale-105 hover:shadow-blue-500/30 hover:scale-110'
          : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/90 hover:text-white hover:-translate-y-0.5 hover:shadow-md'
      }
    `}
  >
    <span className="text-sm transform transition-transform duration-300 hover:scale-110">
      {button.icon}
    </span>
    <span>{button.text}</span>
  </button>
));

HelpButton.propTypes = {
  button: PropTypes.shape({
    type: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

// Memoize the HelpCarousel component
const HelpCarousel = memo(({ activeHelpType, handleHelpClick }) => {
  const containerRef = useRef(null);
  const [showControls, setShowControls] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollPosition(container.scrollLeft);
      setShowControls(container.scrollWidth > container.clientWidth);
    };

    // Initial check
    handleScroll();

    // Add resize observer to handle container width changes
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(container);

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  const scroll = useCallback((direction) => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div className="bg-gray-900 border-b border-gray-800 relative">
      {/* Left Control */}
      {showControls && scrollPosition > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 bg-gradient-to-r from-gray-900 via-gray-900 to-transparent"
          >
            <div className="bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-all duration-200 transform hover:scale-110 shadow-lg">
              <ChevronLeftIcon className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      )}

      {/* Help Buttons Container */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto gap-1.5 py-2 px-3 hide-scrollbar scroll-smooth"
      >
        {helpButtons.map((button) => (
          <HelpButton
            key={button.type}
            button={button}
            isActive={activeHelpType === button.type}
            onClick={() => handleHelpClick(button.type)}
          />
        ))}
      </div>

      {/* Right Control */}
      {showControls &&
        scrollPosition <
          containerRef.current?.scrollWidth -
            containerRef.current?.clientWidth && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center">
          <button
            onClick={() => scroll('right')}
            className="p-1.5 bg-gradient-to-l from-gray-900 via-gray-900 to-transparent"
          >
            <div className="bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-all duration-200 transform hover:scale-110 shadow-lg">
              <ChevronRightIcon className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
});

HelpCarousel.propTypes = {
  activeHelpType: PropTypes.string,
  handleHelpClick: PropTypes.func.isRequired,
};

// Add display name to HelpButton
HelpButton.displayName = 'HelpButton';

// Add display name to HelpCarousel
HelpCarousel.displayName = 'HelpCarousel';

// Add this memoized message component outside the main ChatBot component
const Message = memo(({ content, className }) => {
  return (
    <MathJax>
      <div 
        className={className}
        dangerouslySetInnerHTML={{ 
          __html: content 
        }} 
      />
    </MathJax>
  );
});

Message.propTypes = {
  content: PropTypes.string.isRequired,
  className: PropTypes.string
};

Message.displayName = 'Message';

const FadeNotification = memo(({ message, type, isEnabled, id }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [id]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-fade-in">
      <div className={`
        px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md
        ${type === 'deep-think' 
          ? 'bg-gradient-to-r from-blue-600/90 to-blue-500/90 text-white ring-1 ring-blue-400/30' 
          : 'bg-gradient-to-r from-gray-900/95 to-gray-800/95 text-white ring-1 ring-white/10'
        }
        flex items-center gap-3 min-w-[200px] justify-center
      `}>
        <div className="flex items-center justify-center w-8 h-8">
          {type === 'deep-think' ? (
            <span className={`text-2xl transform transition-transform duration-300 ${isEnabled ? 'scale-110' : 'scale-90 opacity-80'}`}>
              🧠
            </span>
          ) : (
            <span className={`text-2xl transform transition-transform duration-300 ${isEnabled ? 'scale-110' : 'scale-90 opacity-80'}`}>
              💡
            </span>
          )}
        </div>
        <div className="flex flex-col">
          <div className="text-sm font-medium">
            {message}
          </div>
          <div className="text-xs opacity-80">
            {isEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>
    </div>
  );
});

FadeNotification.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['deep-think', 'help']).isRequired,
  isEnabled: PropTypes.bool,
  id: PropTypes.string.isRequired
};

FadeNotification.displayName = 'FadeNotification';

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
  const messagesContainerRef = useRef(null);
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
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showNotification, setShowNotification] = useState(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Add focus management effect
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        inputRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Add scroll handler to detect when user is at bottom
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
    setShouldAutoScroll(isAtBottom);
  }, []);

  // Update scroll effect for smooth scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const scrollToBottom = () => {
      if (!shouldAutoScroll) return;
      
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    };

    // Scroll on new messages or typing updates
    if (isTyping || messages.length > 0) {
      scrollToBottom();
    }

    // Add scroll listener
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [messages, isTyping, shouldAutoScroll, handleScroll]);

  // Update the typing effect useEffect
  useEffect(() => {
    let timer;
    const currentMessage = messages[messages.length - 1];

    if (
      isTyping &&
      currentMessage?.sender === 'assistant' &&
      currentTypingIndex < currentMessage.content.length
    ) {
      // Increase typing speed by processing more characters at once
      const charsPerTick = 8; // Increased from 3 to 8 characters per tick
      timer = setTimeout(() => {
        if (!isTyping) return;

        const nextIndex = Math.min(
          currentMessage.content.length,
          currentTypingIndex + charsPerTick
        );

        setDisplayedResponse(
          currentMessage.content.slice(0, nextIndex)
        );
        setCurrentTypingIndex(nextIndex);
      }, 5); // Reduced delay from 10ms to 5ms for faster typing
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
  const handleSaveEdit = async () => {
    if (!editingContent.trim()) return;
    
    // Find the index of the message being edited
    const editIndex = messages.findIndex(m => m.id === editingMessageId);
    if (editIndex === -1) return;

    // Keep only messages up to the edited message
    const updatedMessages = messages.slice(0, editIndex + 1).map(m => 
      m.id === editingMessageId 
        ? { ...m, content: editingContent }
        : m
    );
    
    setMessages(updatedMessages);
    setEditingMessageId(null);
    setEditingContent('');

    // Generate new response
    setIsLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user')) || {};
      const sessionId = userData.current_session_id;

      const response = await aiService.askQuestion(editingContent, {
        user_id: userData.id || 'anonymous',
        session_id: sessionId,
        subject: subject || '',
        topic: topic || '',
        type: activeHelpType || '',
        Deep_think: isDeepThinkEnabled,
      });

      // Add new AI response
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
      console.error('Error regenerating response:', error);
      // Show error message if regeneration fails
      const errorMessage = {
        id: Date.now(),
        sender: 'assistant',
        type: 'text',
        content: `Failed to regenerate response: ${error?.message || 'Please try again'}`,
      };
      setMessages([...updatedMessages, errorMessage]);
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
        setMessages((prev) => {
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
  const handleSubmit = useCallback(
    async (e) => {
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
      const userMessage = pinnedImage
        ? {
            id: messageId,
            sender: 'user',
            type: 'image',
            content: pinnedImage.content,
            fileName: pinnedImage.fileName,
            question: chatMessage,
          }
        : {
            id: messageId,
            sender: 'user',
            type: selectedTextPreview ? 'selected-text' : 'text',
            content: chatMessage,
            source: selectedTextPreview?.source,
            selectedText: selectedTextPreview?.content,
          };

      setMessages((prev) => [...prev, userMessage]);

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

        const questionWithInteraction = `${chatMessage} (${activeHelpType || ''})`;

        // Create FormData for the request
        const formData = new FormData();
        formData.append('user_id', userData.id || 'anonymous');
        formData.append('session_id', sessionId);
        formData.append('subject', subject || '');
        formData.append('topic', topic || '');
        formData.append('type', activeHelpType || '');
        formData.append('pinnedText', '');
        formData.append('selectedText', questionContext?.content || '');
        formData.append('source', questionContext?.source || 'Chat');
        formData.append('Deep_think', isDeepThinkEnabled);
        formData.append('question', questionWithInteraction);

        // If there's an image, append it to FormData
        if (imageToSend?.content) {
          // Convert base64 to blob
          const base64Data = imageToSend.content.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);

          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });

          // Append the blob to FormData
          formData.append('image', blob, 'image.png');
        }

        const response = await aiService.askQuestion(
          questionWithInteraction,
          formData,
          {
            signal: controller.signal,
            headers: {
              // Don't set Content-Type header - it will be automatically set with boundary
            },
          }
        );

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

        setMessages((prev) => [...prev, aiMessage]);
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
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'assistant',
            type: 'text',
            content: errorMessage,
          },
        ]);
        setDisplayedResponse(errorMessage);
        setCurrentTypingIndex(errorMessage.length);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setAbortController(null);
        }
      }
    },
    [
      chatMessage,
      selectedTextPreview,
      pinnedImage,
      isPinnedText,
      isPinnedImage,
      subject,
      topic,
      isDeepThinkEnabled,
      handleCancelResponse,
      activeHelpType,
      isLoading,
      isTyping,
    ]
  );

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
      // Handle captured image
      if (event.detail?.imageData) {
        // Pin the image instead of sending immediately
        setPinnedImage({
          content: event.detail.imageData,
          previewImageData: event.detail.previewImageData,
          imageWidth: event.detail.imageWidth,
          imageHeight: event.detail.imageHeight,
          source: event.detail.source,
        });
        setIsPinnedImage(true); // Auto-pin the image

        // Open chat if not already open
        if (!isOpen) {
          setIsOpen(true);
        }

        // Focus the input for user to type their question
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
      // Handle text selection
      else if (event.detail?.question) {
        setSelectedTextPreview({
          content: event.detail.question,
          source: event.detail.source || 'Selected Text',
        });

        // Open chat if not already open
        if (!isOpen) {
          setIsOpen(true);
        }

        // Focus the input for text questions
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

  // Memoize the help click handler
  const handleHelpClick = useCallback(
    (type) => {
      const newState = activeHelpType === type ? null : type;
      setActiveHelpType(newState);
      setShowNotification({
        id: Date.now().toString(),
        type: 'help',
        message: `${type} Mode`,
        isEnabled: newState !== null
      });
      
      // Auto-disable after successful response
      if (newState !== null) {
        const disableAfterResponse = (e) => {
          if (e.detail?.success) {
            setActiveHelpType(null);
            setShowNotification({
              id: Date.now().toString(),
              type: 'help',
              message: `${type} Mode`,
              isEnabled: false
            });
            window.removeEventListener('aiResponse', disableAfterResponse);
          }
        };
        window.addEventListener('aiResponse', disableAfterResponse);
      }
    },
    [activeHelpType]
  );

  // Update deep think toggle
  const toggleDeepThink = useCallback(() => {
    setIsDeepThinkEnabled(prev => !prev);
    const newState = !isDeepThinkEnabled;
    
    setShowNotification({
      id: Date.now().toString(),
      type: 'deep-think',
      message: 'Deep Think Mode',
      isEnabled: newState
    });

    // Auto-disable after successful response
    if (newState) {
      const disableAfterResponse = (e) => {
        if (e.detail?.success) {
          setIsDeepThinkEnabled(false);
          setShowNotification({
            id: Date.now().toString(),
            type: 'deep-think',
            message: 'Deep Think Mode',
            isEnabled: false
          });
          window.removeEventListener('aiResponse', disableAfterResponse);
        }
      };
      window.addEventListener('aiResponse', disableAfterResponse);
    }
  }, [isDeepThinkEnabled]);

  const renderMessage = (msg, index) => {
    const isLastMessage = index === messages.length - 1;
    const content =
      isLastMessage && msg.sender === 'assistant'
        ? displayedResponse
        : msg.content;
    const isEditing = msg.id === editingMessageId;

    // Helper function to format headings and subheadings
    const formatContent = (text) => {
      // First handle headings with bold
      let formattedText = text.replace(
        /(#{1,6})\s+\*\*([^*]+)\*\*/g,
        (match, hashes, content) => {
          const level = hashes.length;
          const className = `text-${level === 1 ? 'xl' : level === 2 ? 'lg' : 'base'} font-bold my-2`;
          return `<h${level} class="${className}">${content}</h${level}>`;
        }
      );

      // Then handle remaining bold text
      formattedText = formattedText.replace(
        /\*\*([^*]+)\*\*/g,
        '<span class="font-bold text-white">$1</span>'
      );

      return formattedText;
    };

    const formattedContent = formatContent(content);

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

        <div
          className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[75%] relative group`}
        >
          <div
            className={`rounded-lg p-3 break-words w-full ${
              msg.sender === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-xl'
            }`}
          >
            {isEditing && msg.sender === 'user' ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full bg-blue-600 text-white rounded p-2 min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    } else if (e.key === 'Escape') {
                      setEditingMessageId(null);
                      setEditingContent('');
                    }
                  }}
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => {
                      setEditingMessageId(null);
                      setEditingContent('');
                    }}
                    className="px-2 py-1 hover:bg-blue-600 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1"
                  >
                    <CheckIcon className="w-3 h-3" />
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : msg.type === 'image' ? (
              <div className="space-y-2">
                <div className="relative bg-gray-800/50 rounded p-2">
                  <img
                    src={msg.previewImageData || msg.content}
                    alt="Captured content"
                    className="max-w-full rounded"
                    style={{
                      width: msg.imageWidth || 'auto',
                      height: msg.imageHeight || 'auto',
                      maxHeight: '200px',
                      objectFit: 'contain',
                    }}
                  />
                  <div className="flex items-center gap-1 text-xs text-gray-300 mt-1">
                    <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span>{msg.source}</span>
                  </div>
                </div>
                {msg.question && (
                  <div className="text-[15px]">{msg.question}</div>
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
                <Message 
                  content={formattedContent}
                  className="text-[15px] break-words"
                />
              </div>
            ) : (
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                <Message 
                  content={formattedContent}
                  className="text-[15px] leading-relaxed whitespace-pre-wrap break-words"
                />
                {isLastMessage && msg.sender === 'assistant' && isTyping && (
                  <span className="inline-block w-2 h-5 bg-blue-400 animate-pulse ml-1">
                    |
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Edit button for user messages */}
          {msg.sender === 'user' && !isEditing && (
            <button
              onClick={() => handleEditMessage(msg.id, msg.content)}
              className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Edit message"
            >
              <PencilIcon className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
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
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-ping"
                  style={{ animationDuration: '1.5s', animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-ping"
                  style={{ animationDuration: '1.5s', animationDelay: '300ms' }}
                />
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-ping"
                  style={{ animationDuration: '1.5s', animationDelay: '600ms' }}
                />
              </div>
              <span className="text-xs text-blue-400">Thinking...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Add function to handle new chat
  const handleNewChat = () => {
    setMessages([]);
    setMessage('');
    setPinnedImage(null);
    setSelectedTextPreview(null);
    setIsDeepThinkEnabled(false);
    setActiveHelpType(null);
  };

  // Add effect to load today's chats automatically
  useEffect(() => {
    const loadTodayChats = async () => {
      if (!isOpen) return;

      try {
        setIsLoadingHistory(true);
        const userData = JSON.parse(localStorage.getItem('user')) || {};
        const sessionId = userData.current_session_id;

        if (!sessionId) {
          throw new Error('No valid session ID found');
        }

        const response = await aiService.getChatHistory(userData.id, sessionId);
        if (response.chat_history) {
          // Find today's chats
          const todayGroup = response.chat_history.find(
            (group) => group.title === 'Today'
          );
          if (todayGroup && todayGroup.chats.length > 0) {
            loadChatsFromPeriod(todayGroup.chats);
          }
          setChatHistory(response.chat_history);
        }
      } catch (error) {
        console.error("Failed to load today's chats:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadTodayChats();
  }, [isOpen]); // Reload when chat is opened

  // Update loadChatsFromPeriod to handle initial load
  const loadChatsFromPeriod = (periodChats) => {
    try {
      setIsLoadingHistory(true);
      // Combine all messages from the period's chats
      const allMessages = [];
      periodChats.forEach((chat) => {
        if (chat.messages && chat.messages.length > 0) {
          // Add each message with proper formatting
          chat.messages.forEach((msg) => {
            allMessages.push({
              id: `${chat.id}-${msg.sender}`,
              sender: msg.sender,
              content: msg.content,
              timestamp: msg.timestamp,
              type: 'text',
            });
          });
        }
      });

      // Sort messages by timestamp
      allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Update the chat display with the combined messages
      setMessages(allMessages);
      if (allMessages.length > 0) {
        const lastMessage = allMessages[allMessages.length - 1];
        setDisplayedResponse(lastMessage.content);
        setCurrentTypingIndex(lastMessage.content.length);
      }
      setShowHistory(false); // Close the sidebar after selection
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Function to load a specific chat
  const loadChatFromHistory = (historyItem) => {
    try {
      setIsLoading(true);
      // Convert the history item's messages to the format expected by the chat
      if (historyItem.messages && historyItem.messages.length > 0) {
        setMessages(historyItem.messages);
      }
      setShowHistory(false); // Close the sidebar after selection
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Modify the chat history sidebar
  const ChatHistorySidebar = () => {
    if (!showHistory) return null;

    return (
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 z-50">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-3 border-b border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium text-white">
                Chats & Composers
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search for past chats..."
                className="w-full bg-gray-800 text-gray-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : chatHistory.length > 0 ? (
              <div className="space-y-1 p-2">
                {chatHistory.map((group, groupIndex) => (
                  <button
                    key={groupIndex}
                    onClick={() => loadChatsFromPeriod(group.chats)}
                    className="w-full p-3 hover:bg-gray-800 rounded-lg text-left transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                        {group.title}
                      </span>
                      <span className="text-xs text-gray-500 group-hover:text-gray-400">
                        {group.chats.length} chats
                      </span>
                    </div>
                    {/* Preview of the latest chat */}
                    {group.chats[0] && (
                      <p className="text-xs text-gray-500 truncate mt-1 group-hover:text-gray-400">
                        {group.chats[0].preview}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 mt-8">
                <p>No chat history available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Modify the pinned image preview component
  const PinnedImagePreview = () => {
    if (!pinnedImage) return null;

    return (
      <div className="mb-2 flex items-start bg-gray-800/50 rounded-lg p-2">
        <div className="relative min-w-[100px] max-w-[150px]">
          <img
            src={pinnedImage.previewImageData || pinnedImage.content}
            alt="Pinned"
            className="w-full h-auto rounded object-contain"
            style={{
              maxHeight: '100px',
            }}
          />
        </div>
        <div className="ml-2 flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-gray-400">Captured Image</span>
            <span className="text-[10px] text-gray-500">•</span>
            <span className="text-[10px] text-gray-500 truncate">
              {pinnedImage.source}
            </span>
          </div>
          <div className="text-xs text-gray-300">
            Type your question about this image
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setIsPinnedImage(!isPinnedImage)}
            className="p-1 hover:bg-gray-700/50 rounded-full transition-colors"
            title={isPinnedImage ? 'Unpin image' : 'Pin image'}
          >
            <span
              className={`text-sm ${isPinnedImage ? 'opacity-100' : 'opacity-50 hover:opacity-75'} transition-opacity`}
            >
              📌
            </span>
          </button>
          <button
            onClick={() => setPinnedImage(null)}
            className="p-1 hover:bg-gray-700/50 rounded-full transition-colors"
            title="Remove image"
          >
            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>
    );
  };

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
        zIndex: isFullScreen ? 60 : 40,
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}
      onMouseUp={(e) => {
        if (
          !(e.target instanceof HTMLButtonElement) &&
          !(e.target instanceof HTMLInputElement) &&
          !(e.target instanceof HTMLTextAreaElement)
        ) {
          handleTextSelection(e);
        }
      }}
      onTouchEnd={(e) => {
        if (
          !(e.target instanceof HTMLButtonElement) &&
          !(e.target instanceof HTMLInputElement) &&
          !(e.target instanceof HTMLTextAreaElement)
        ) {
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
        <div className="flex items-center space-x-1.5">
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1 text-gray-400 hover:text-white"
            title="New Chat"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Chat History Button */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1
              ${showHistory ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
            title="Chat History"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

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

      {/* Replace the old chat history sidebar with the new component */}
      <ChatHistorySidebar />

      {/* Help Buttons - Always visible */}
      <HelpCarousel
        activeHelpType={activeHelpType}
        handleHelpClick={handleHelpClick}
      />

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 bg-gray-900 hide-scrollbar scroll-smooth"
      >
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-t-2 border-blue-400 animate-spin" style={{ animationDuration: '1s' }}></div>
              <div className="absolute inset-4 rounded-full border-t-2 border-blue-300 animate-spin" style={{ animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-sm text-gray-400">Loading chat history...</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map(renderMessage)}
            {isLoading && renderLoadingState()}
          </div>
        )}
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
                <span
                  className={`text-sm ${isPinnedText ? 'opacity-100' : 'opacity-50 hover:opacity-75'} transition-opacity`}
                >
                  📌
                </span>
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
        <PinnedImagePreview />

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="relative pb-[env(safe-area-inset-bottom,0px)]"
        >
          <textarea
            ref={inputRef}
            value={chatMessage}
            onChange={(e) => setMessage(e.target.value)}
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (chatMessage.trim() || pinnedImage || selectedTextPreview) {
                  handleSubmit(e);
                }
              }
            }}
            placeholder="Ask a question..."
            className="w-full bg-gray-800 text-white text-sm rounded-lg pl-3 pr-24 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none min-h-[40px] max-h-[120px] overflow-y-auto"
            style={{
              fontSize: '16px',
              lineHeight: '1.5',
            }}
            rows={1}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <button
              type="button"
              onClick={toggleDeepThink}
              className={`p-1.5 rounded-full transition-all duration-200 ${
                isDeepThinkEnabled
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 animate-pulse'
                  : 'hover:bg-gray-700'
              }`}
              title={isDeepThinkEnabled ? 'Deep Think: ON' : 'Deep Think: OFF'}
            >
              <span
                className={`text-lg inline-block transition-all duration-200 ${
                  isDeepThinkEnabled
                    ? 'text-blue-400 animate-bounce'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
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
              type={isLoading || isTyping ? 'button' : 'submit'}
              onClick={isLoading || isTyping ? handleCancelResponse : undefined}
              disabled={
                !chatMessage.trim() && !pinnedImage && !selectedTextPreview
              }
              className={`p-1.5 hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 ${
                isLoading || isTyping ? 'text-red-500 hover:text-red-400' : ''
              }`}
              title={isLoading || isTyping ? 'Stop generating' : 'Send Message'}
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

      {/* Add notification */}
      {showNotification && (
        <FadeNotification
          key={showNotification.id}
          message={showNotification.message}
          type={showNotification.type}
          isEnabled={showNotification.isEnabled}
          id={showNotification.id}
        />
      )}
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