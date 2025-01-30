import React from 'react';

const AuthLoader = () => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 transition-colors duration-200 z-50">
      <div className="flex flex-col items-center justify-center h-full px-4">
        {/* Logo */}
        <div className="mb-8 text-4xl text-blue-500">
          <span className="font-bold">JEE</span>
          <span className="text-gray-900 dark:text-white">Buddy</span>
        </div>

        {/* AI Neural Network Animation */}
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full top-0 left-0 animate-[pulse_1.5s_infinite]"></div>
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full top-0 right-0 animate-[pulse_1.5s_infinite_0.1s]"></div>
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full bottom-0 left-0 animate-[pulse_1.5s_infinite_0.2s]"></div>
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full bottom-0 right-0 animate-[pulse_1.5s_infinite_0.3s]"></div>
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-[pulse_1.5s_infinite_0.4s]"></div>

            {/* Connecting Lines */}
            <div className="absolute inset-0">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {[
                  { x1: "10", y1: "10", delay: "0s" },
                  { x1: "90", y1: "10", delay: "0.1s" },
                  { x1: "10", y1: "90", delay: "0.2s" },
                  { x1: "90", y1: "90", delay: "0.3s" }
                ].map((line, index) => (
                  <line
                    key={index}
                    x1={line.x1}
                    y1={line.y1}
                    x2="50"
                    y2="50"
                    stroke="#3B82F6"
                    strokeWidth="1"
                    style={{
                      animation: `drawLine 2s infinite`,
                      animationDelay: line.delay
                    }}
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-lg font-medium text-gray-900 dark:text-white/90">
          AI is preparing your personalized study space...
        </div>
      </div>

      <style>{`
        @keyframes drawLine {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AuthLoader;
