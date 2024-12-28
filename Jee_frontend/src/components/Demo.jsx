import { useState } from 'react';

const Demo = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

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

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: inputValue }]);
    setInputValue('');
    
    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: "I understand your question. Let me help you with that..."
      }]);
    }, 1000);
  };

  return (
    <section id="demo" className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Test your AI teacher now</h2>
        <div className="max-w-4xl mx-auto">
          <div className="card bg-black">
            <div className="p-6">
              <div className="mb-6">
                <div className="card mb-4">
                  <div className="p-4">
                    <h6 className="text-lg font-semibold mb-2">Sample JEE Math Problem:</h6>
                    <p className="text-gray-300" id="math-problem">{mathProblem}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {helpButtons.map(button => (
                    <button
                      key={button.type}
                      className="help-btn"
                      data-type={button.type}
                    >
                      {button.icon} {button.text}
                    </button>
                  ))}
                </div>
              </div>
              <div className="chat-container">
                <div className="chat-messages bg-black border border-blue-500 rounded-lg p-4 h-[60vh] overflow-y-auto mb-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`chat-message ${message.type} mb-4 p-3 rounded-lg ${
                        message.type === 'user' ? 'bg-blue-500' : 'bg-gray-700'
                      }`}
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
                    placeholder="Type what you need"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
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

export default Demo;
