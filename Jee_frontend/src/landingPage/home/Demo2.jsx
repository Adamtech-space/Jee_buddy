import { useState, useRef, useEffect } from 'react';

const Demo2 = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end",
      inline: "nearest"
    });
  };

  useEffect(() => {
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  const helpButtons = [
    { type: "explain", icon: "📝", text: "Step-by-Step" },
    { type: "basics", icon: "🧠", text: "Basics" },
    { type: "test", icon: "🎯", text: "Test Me" },
    { type: "similar", icon: "🔄", text: "Examples" },
    { type: "realworld", icon: "🌍", text: "Real-World" },
    { type: "keypoints", icon: "🔍", text: "Key Points" },
    { type: "challenge", icon: "🏆", text: "Challenge" },
    { type: "mistakes", icon: "⚠️", text: "Mistakes" },
    { type: "solve", icon: "✨", text: "Solve" },
    { type: "related", icon: "🔗", text: "Topics" },
    { type: "mnemonic", icon: "💡", text: "Shortcut" },
    { type: "ask-similar", icon: "🤔", text: "Similar" }
  ];

  const mathProblem = "Find the maximum and minimum values of the function f(x) = x³ - 3x² + 2 in the interval [0,3]";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setMessages(prev => [...prev, { type: 'user', content: inputValue }]);
    setInputValue('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: "I understand your question. Let me help you with that..."
      }]);
    }, 1000);
  };

  return (
    <section id="demo" className="relative py-10 overflow-hidden">
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
                      data-type={button.type}
                    >
                      {button.icon} {button.text}
                    </button>
                  ))}
                </div>
              </div>
              <div className="chat-container">
                <div className="chat-messages bg-[#1f1029]/40 border border-[#4a1942]/50 rounded-xl p-4 sm:p-6 h-[40vh] 
                          overflow-y-auto mb-4 sm:mb-6 scrollbar-thin scrollbar-thumb-[#6366f1] scrollbar-track-[#2d1635]">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`chat-message ${message.type} mb-4 p-3 sm:p-4 rounded-xl backdrop-blur-lg
                        ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-[#6366f1]/80 to-[#8b5cf6]/80 text-white border border-[#6366f1]/50 ml-auto max-w-[80%]'
                            : 'bg-[#2d1635]/60 border border-[#4a1942]/50 max-w-[80%] text-gray-200'
                        }`}
                    >
                      {message.content}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Demo2;
