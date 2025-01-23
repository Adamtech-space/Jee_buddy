import React from 'react';

const AuthLoader = () => {
  return (
    <div className="fixed inset-0 bg-gray-900 z-50">
      <div className="flex flex-col items-center justify-center h-full px-4">
        {/* Logo */}
        <div className="mb-8 text-4xl text-blue-500">
          <span className="font-bold">JEE</span>
          <span className="text-white">Buddy</span>
        </div>

        {/* AI Neural Network Animation */}
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full top-0 left-0 animate-pulse"></div>
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full top-0 right-0 animate-pulse delay-100"></div>
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full bottom-0 left-0 animate-pulse delay-200"></div>
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full bottom-0 right-0 animate-pulse delay-300"></div>
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse delay-400"></div>

            {/* Connecting Lines */}
            <div className="absolute inset-0">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <line
                  x1="10"
                  y1="10"
                  x2="50"
                  y2="50"
                  stroke="#3B82F6"
                  strokeWidth="1"
                  className="animate-drawLine"
                />
                <line
                  x1="90"
                  y1="10"
                  x2="50"
                  y2="50"
                  stroke="#3B82F6"
                  strokeWidth="1"
                  className="animate-drawLine delay-100"
                />
                <line
                  x1="10"
                  y1="90"
                  x2="50"
                  y2="50"
                  stroke="#3B82F6"
                  strokeWidth="1"
                  className="animate-drawLine delay-200"
                />
                <line
                  x1="90"
                  y1="90"
                  x2="50"
                  y2="50"
                  stroke="#3B82F6"
                  strokeWidth="1"
                  className="animate-drawLine delay-300"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-lg font-medium text-white/90">
          AI is preparing your personalized study space...
        </div>
      </div>

      {/* Custom Animation */}
      <style jsx>{`
        @keyframes drawLine {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        .animate-drawLine {
          animation: drawLine 2s infinite;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
        .delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
};

export default AuthLoader;
