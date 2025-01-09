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
    <section id="demo2" className="relative py-20 bg-black overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/90" />

      <div className="container mx-auto px-4 relative">
        <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Test your AI teacher now
        </h2>
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-md bg-gray-900/90 rounded-2xl border border-gray-800 shadow-xl">
            <div className="p-8">
              <div className="mb-8">
                <div className="backdrop-blur-sm bg-gray-800/50 rounded-xl border border-gray-700 mb-6">
                  <div className="p-6">
                    <h6 className="text-lg font-semibold mb-3 text-blue-400">
                      Sample JEE Math Problem:
                    </h6>
                    <p className="text-gray-300" id="math-problem">
                      {mathProblem}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mb-6">
                  {helpButtons.map((button) => (
                    <button
                      key={button.type}
                      className="help-btn px-4 py-2 rounded-lg bg-gray-800/80 border border-gray-700 
                               text-gray-300 hover:bg-gray-700 hover:border-blue-500 hover:text-blue-400
                               transition-all duration-300 ease-in-out transform hover:scale-105
                               shadow-sm hover:shadow-md"
                      data-type={button.type}
                    >
                      {button.icon} {button.text}
                    </button>
                  ))}
                </div>
              </div>
              <div className="chat-container">
                <div
                  className="chat-messages bg-gray-800/50 border border-gray-700 rounded-xl p-6 h-[40vh] 
                            overflow-y-auto mb-6 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-800"
                >
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`chat-message ${message.type} mb-4 p-4 rounded-xl backdrop-blur-sm
                        ${
                          message.type === 'user'
                            ? 'bg-blue-600/90 text-white border border-blue-500 ml-auto max-w-[80%]'
                            : 'bg-gray-800/90 border border-gray-700 max-w-[80%] text-gray-300'
                        }`}
                    >
                      {message.content}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 bg-gray-800/80 border border-gray-700 rounded-xl px-6 py-3
                             text-gray-300 placeholder-gray-500
                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                             transition-colors"
                    placeholder="Type what you need"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 
                             rounded-xl hover:from-blue-700 hover:to-purple-700
                             transition-all duration-300 ease-in-out transform hover:scale-105
                             shadow-md hover:shadow-lg"
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
