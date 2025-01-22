import { useState, useRef, useEffect, useCallback, memo } from 'react';

const Demo2 = () => {
  // Move input state to a separate component to isolate re-renders
  const ChatInput = memo(({ onSubmit: handleSubmit }) => {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);

    const handleInputChange = useCallback((e) => {
      setInputValue(e.target.value);
    }, []);

    const onSubmit = useCallback((e) => {
      e.preventDefault();
      if (!inputValue.trim()) return;
      handleSubmit(inputValue.trim());
      setInputValue('');
    }, [inputValue, handleSubmit]);

    return (
      <form onSubmit={onSubmit} className="flex gap-2 sm:gap-3">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          className="flex-1 bg-[#1f1029]/40 border border-[#4a1942]/50 rounded-xl px-4 sm:px-6 py-2 sm:py-3
                   text-gray-200 placeholder-gray-400 text-sm sm:text-base
                   focus:outline-none focus:border-[#6366f1]/50 focus:ring-2 focus:ring-[#6366f1]/20 
                   transition-colors"
          placeholder="Type what you need"
          required
        />
        <button
          type="submit"
          className="whitespace-nowrap bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white 
                   px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base
                   rounded-xl hover:from-[#5558e6] hover:to-[#7c4feb]
                   transition-all duration-300 ease-in-out transform hover:scale-105
                   shadow-md hover:shadow-lg min-w-[80px] sm:min-w-[100px]"
        >
          Send
        </button>
      </form>
    );
  });

  // Main component state
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: "Hi! 👋 I'm your JEE buddy, here to help you with mathematics and other JEE subjects. Feel free to ask me anything about the problem above or use the helper buttons for specific guidance!"
    }
  ]);
  
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isShowingSteps, setIsShowingSteps] = useState(false);

  // Handle message submission
  const handleSubmit = useCallback((message) => {
    setMessages(prev => [...prev, { type: 'user', content: message }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const response = generateResponse(message);
      if (response !== null) {
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: response
        }]);
      }
    }, Math.random() * 1000 + 1000);
  }, []);

  // Memoize the chat message component
  const ChatMessage = memo(({ message, index }) => (
    <div
      className={`chat-message ${message.type} mb-4 p-3 sm:p-4 rounded-xl backdrop-blur-lg message-appear
        ${
          message.type === 'user'
            ? 'bg-gradient-to-r from-[#6366f1]/80 to-[#8b5cf6]/80 text-white border border-[#6366f1]/50 ml-auto max-w-[80%]'
            : 'bg-[#2d1635]/60 border border-[#4a1942]/50 max-w-[80%] text-gray-200'
        }`}
    >
      {message.content}
    </div>
  ));

  // Memoize the typing indicator
  const TypingIndicator = memo(() => (
    <div className="chat-message assistant mb-4 p-3 sm:p-4 rounded-xl backdrop-blur-lg bg-[#2d1635]/60 border border-[#4a1942]/50 max-w-[80%] text-gray-200">
      <div className="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  ));

  // Optimize scroll handling
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.parentElement;
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    // Add a small delay to ensure DOM updates are complete
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, scrollToBottom]);

  const helpButtons = [
    { type: 'explain', icon: '📝', text: 'Step-by-Step' },
    { type: 'basics', icon: '🧠', text: 'Basics' },
    { type: 'test', icon: '🎯', text: 'Test Me' },
    { type: 'similar', icon: '🔄', text: 'Examples' },
    { type: 'realworld', icon: '🌍', text: 'Real-World' },
    { type: 'keypoints', icon: '🔍', text: 'Key Points' },
    { type: 'challenge', icon: '🏆', text: 'Challenge' },
    { type: 'mistakes', icon: '⚠️', text: 'Mistakes' },
    { type: 'solve', icon: '✨', text: 'Solve' },
    { type: 'related', icon: '🔗', text: 'Topics' },
    { type: 'mnemonic', icon: '💡', text: 'Shortcut' },
    { type: 'ask-similar', icon: '🤔', text: 'Similar' },
  ];

  const mathProblem =
    'Find the maximum and minimum values of the function f(x) = x³ - 3x² + 2 in the interval [0,3]';

  // Update buttonResponses to include step-by-step arrays
  const buttonResponses = {
    explain: [
      'Let me break down this problem step by step:',
      "Step 1: First, we need to find the critical points of f(x) = x³ - 3x² + 2\nWe'll do this by finding f'(x) and setting it equal to 0.",
      "Step 2: Taking the derivative:\nf'(x) = 3x² - 6x = 3x(x-2)",
      "Step 3: Setting f'(x) = 0:\n3x(x-2) = 0\nSolving this: x = 0 or x = 2",
      'Step 4: Now we have our critical points (x = 0, 2) and we need to check these points plus the endpoints (x = 3)',
      "Step 5: Let's evaluate f(x) at each point:\nf(0) = 2\nf(2) = -2\nf(3) = 2",
      'Final Step: Comparing all values:\nMaximum value = 2 (occurs at x = 0 and x = 3)\nMinimum value = -2 (occurs at x = 2)',
    ],
    basics: [
      "Let's review the basic concepts one by one:",
      '1. Derivatives:\nA derivative measures the rate of change of a function. It helps us find where the function is increasing or decreasing.',
      "2. Critical Points:\nThese are points where f'(x) = 0 or where f'(x) is undefined. They're potential locations for maximum/minimum values.",
      '3. Interval Analysis:\nOn a closed interval [a,b], we must check:\n- Critical points within the interval\n- Endpoint values',
      '4. Maximum and Minimum:\nThe largest value in the interval is the absolute maximum.\nThe smallest value is the absolute minimum.',
    ],
    test: [
      "Let's test your understanding step by step:",
      'Q1: What is the first step in finding absolute maximum/minimum values on a closed interval?',
      'Q2: How do you find critical points?',
      'Q3: Why do we need to check endpoints in a closed interval?',
      "Q4: In our problem, why do we get two x-values when solving f'(x) = 0?",
      'Take your time to think about each question. Would you like me to explain any of these in detail?',
    ],
    similar:
      "Here's a similar optimization problem:\nFind the maximum and minimum values of g(x) = x² - 2x + 1 on [0,2]\n\nHowever, as this is a demo version, I can only help with the main problem above. For access to more practice problems and similar examples, please login and subscribe! 🔄\n\nWould you like me to solve the main problem instead? Just say 'yes'! 📚",
    realworld:
      'This type of optimization problem appears in real-world scenarios like:\n\n• Manufacturing to maximize profit\n• Engineering design for efficiency\n• Resource allocation',
    keypoints:
      'Key points to remember:\n\n• Check critical points within interval\n• Always evaluate endpoints\n• Compare all values found\n• Consider domain restrictions',
    challenge:
      'Try this challenge:\nModify the original function to f(x) = x³ - 4x² + 2 and find its max/min on [0,4]. How does this change affect the solution?',
    mistakes:
      'Common mistakes to avoid:\n\n• Forgetting to check endpoints\n• Missing critical points\n• Incorrect derivative calculations\n• Not verifying max vs min',
    solve:
      "Complete solution:\nf(x) = x³ - 3x² + 2\nf'(x) = 3x² - 6x = 3x(x-2)\nCritical points: x = 0, 2\n\nEvaluating:\nf(0) = 2\nf(2) = -2\nf(3) = 2\n\nTherefore,\nMaximum = 2 (at x = 0 and x = 3)\nMinimum = -2 (at x = 2)",
    related:
      'Related topics to explore:\n\n• Derivative applications\n• Optimization problems\n• Critical point analysis\n• Curve sketching',
    mnemonic:
      "Remember this shortcut:\n'CEED' method:\nC - Critical points\nE - Endpoints\nE - Evaluate\nD - Determine max/min",
    'ask-similar':
      "Here's a similar problem to practice:\nFind the maximum and minimum values of g(x) = -x³ + 6x² - 9x + 1 on [0,4]",
  };

  // Update handleHelpClick to show responses step by step
  const handleHelpClick = (buttonType) => {
    const responses = Array.isArray(buttonResponses[buttonType])
      ? [
          ...buttonResponses[buttonType],
          '\nNote: This is a demo version. For access to more practice problems, detailed explanations, and personalized help, please login and subscribe! 🌟',
        ]
      : [buttonResponses[buttonType]];

    const userRequest = `Help me ${buttonType === 'solve' ? 'solve' : 'understand'} this problem ${buttonType === 'solve' ? '' : `using the ${buttonType} approach`}.`;

    setMessages((prev) => [
      ...prev,
      {
        type: 'user',
        content: userRequest,
      },
    ]);

    // Show responses one by one with delays
    responses.forEach((response, index) => {
      setTimeout(
        () => {
          setMessages((prev) => [
            ...prev,
            {
              type: 'assistant',
              content: response,
            },
          ]);
        },
        (index + 1) * 1500
      ); // 1.5 second delay between each step
    });
  };

  // Update handleSolveStep to ensure steps are shown
  const handleSolveStep = (steps, currentStep = 0) => {
    if (currentStep < steps.length) {
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            type: 'assistant',
            content: steps[currentStep],
          },
        ]);

        // Schedule next step
        setTimeout(() => {
          handleSolveStep(steps, currentStep + 1);
        }, 1000);
      }, 1500);
    }
  };

  // Update generateResponse to handle step-by-step responses when needed
  const generateResponse = (userInput) => {
    const input = userInput.toLowerCase().trim();
    const words = input.split(/\s+/);

    const containsPattern = (patterns) => {
      return patterns.some((pattern) =>
        words.some((word) => word === pattern || word.includes(pattern))
      );
    };

    // Track both problems
    const problems = {
      original: {
        question: 'Find max/min of f(x) = x³ - 3x² + 2 on [0,3]',
        steps: [
          "Let's solve this! 📝",
          "First, let's find f'(x):\n• f'(x) = 3x² - 6x = 3x(x-2)",
          'Critical points:\n• x = 0 or x = 2',
          "Let's check the values:\n• f(0) = 2\n• f(2) = -2\n• f(3) = 2",
          'There we have it!\n• Max = 2 (at x = 0, 3)\n• Min = -2 (at x = 2)',
        ],
      },
      similar: {
        question: 'Find max/min of g(x) = x² - 2x + 1 on [0,2]',
        steps: [
          "Let's solve this one! 📝",
          "First, g'(x):\n• g'(x) = 2x - 2",
          'Critical point:\n• 2x - 2 = 0\n• x = 1',
          'Checking values:\n• g(0) = 1\n• g(1) = 0\n• g(2) = 1',
          "Here's what we found:\n• Max = 1 (at x = 0, 2)\n• Min = 0 (at x = 1)",
        ],
      },
      askSimilar: {
        question: 'Find max/min of h(x) = -x³ + 6x² - 9x + 1 on [0,4]',
        steps: [
          "Let's tackle this! 📝",
          "First, h'(x):\n• h'(x) = -3x² + 12x - 9\n• h'(x) = -3(x² - 4x + 3)\n• h'(x) = -3(x - 1)(x - 3)",
          'Critical points:\n• x = 1 or x = 3',
          'Checking values:\n• h(0) = 1\n• h(1) = -1\n• h(3) = 1\n• h(4) = -3',
          "Here's what we got:\n• Max = 1 (at x = 0, 3)\n• Min = -3 (at x = 1, 4)",
        ],
      },
    };

    // Check if we're in a clarification state
    const lastMessage = messages[messages.length - 1]?.content;
    const isAskingForClarification =
      lastMessage ===
      'Which problem would you like help with?\n1. Original\n2. Similar\n3. Practice\n\nJust pick a number! 😊';

    if (isAskingForClarification) {
      // Handle numeric selection directly
      switch (input) {
        case '1':
          handleSolveStep(problems.original.steps);
          return null;
        case '2':
          handleSolveStep(problems.similar.steps);
          return null;
        case '3':
          handleSolveStep(problems.askSimilar.steps);
          return null;
        default:
          if (input.includes('first') || input.includes('original')) {
            handleSolveStep(problems.original.steps);
            return null;
          }
          if (input.includes('second') || input.includes('similar')) {
            handleSolveStep(problems.similar.steps);
            return null;
          }
          if (
            input.includes('third') ||
            input.includes('practice') ||
            input.includes('last')
          ) {
            handleSolveStep(problems.askSimilar.steps);
            return null;
          }
          return 'Please select a number (1, 2, or 3) to continue! 😊';
      }
    }

    // Check for solve/help requests
    const solvePatterns = [
      'solve',
      'solution',
      'help',
      'show',
      'explain',
      'steps',
    ];
    if (
      containsPattern(solvePatterns) ||
      input === '1' ||
      input === '2' ||
      input === '3'
    ) {
      return (
        'Which problem would you like help with?\n' +
        '1. Original\n2. Similar\n3. Practice\n\n' +
        'Just pick a number! 😊'
      );
    }

    // Simple confirmations
    const confirmationPatterns = ['yes', 'yeah', 'yep', 'okay', 'sure'];
    if (containsPattern(confirmationPatterns) && words.length < 3) {
      return (
        'Which problem would you like help with?\n' +
        '1. Original\n2. Similar\n3. Practice\n\n' +
        'Just pick a number! 😊'
      );
    }

    // Default response
    return (
      'Which problem would you like help with?\n' +
      '1. Original\n2. Similar\n3. Practice\n\n' +
      'Just pick a number! 😊'
    );
  };

  return (
    <section className="relative py-10 overflow-hidden">
      <div className="container mx-auto px-4 relative">
        <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">
          Test your AI teacher now
        </h2>
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-lg bg-[#2d1635]/40 rounded-2xl border border-[#4a1942]/50 shadow-xl">
            <div className="p-4 sm:p-8">
              <div className="mb-8">
                <div className="backdrop-blur-lg bg-[#1f1029]/40 rounded-xl border border-[#4a1942]/50 mb-6">
                  <div className="p-4 sm:p-6">
                    <h6 className="text-lg font-semibold mb-3 text-[#6366f1]">
                      Sample JEE Math Problem:
                    </h6>
                    <p className="text-gray-200" id="math-problem">
                      {mathProblem}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mb-6">
                  {helpButtons.map((button) => (
                    <button
                      key={button.type}
                      className="help-btn px-3 sm:px-4 py-2 rounded-lg bg-[#1f1029]/40 border border-[#4a1942]/50 
                               text-gray-200 hover:bg-[#2d1635]/60 hover:border-[#6366f1]/50 hover:text-[#8b5cf6]
                               transition-all duration-300 ease-in-out transform hover:scale-105
                               shadow-sm hover:shadow-md text-sm sm:text-base"
                      onClick={() => handleHelpClick(button.type)}
                      data-type={button.type}
                    >
                      {button.icon} {button.text}
                    </button>
                  ))}
                </div>
              </div>
              <div className="chat-container">
                <div
                  className="chat-messages bg-[#1f1029]/40 border border-[#4a1942]/50 rounded-xl p-4 sm:p-6 h-[40vh] 
                          overflow-y-auto mb-4 sm:mb-6 scrollbar-thin scrollbar-thumb-[#6366f1] scrollbar-track-[#2d1635]"
                >
                  {messages.map((message, index) => (
                    <ChatMessage key={index} message={message} index={index} />
                  ))}
                  {isTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
                <ChatInput onSubmit={handleSubmit} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Add CSS for typing animation
const typingAnimationStyles = `
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 8px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: #6366f1;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
  opacity: 0.4;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.message-appear {
  animation: messageAppear 0.3s ease-out;
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = typingAnimationStyles;
document.head.appendChild(styleSheet);

export default memo(Demo2);
