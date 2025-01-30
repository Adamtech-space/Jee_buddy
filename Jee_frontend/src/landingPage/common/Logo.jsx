const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      {/* Logo Icon */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-sm opacity-25" />
        
        <svg 
          className="relative w-8 h-8" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Brain icon representing AI */}
          <path 
            d="M12 2L2 7L12 12L22 7L12 2Z" 
            className="fill-blue-500"
          />
          <path 
            d="M2 17L12 22L22 17" 
            stroke="url(#gradient1)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M2 12L12 17L22 12" 
            stroke="url(#gradient2)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="gradient1" x1="2" y1="17" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="gradient2" x1="2" y1="12" x2="22" y2="17" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Logo Text */}
      <div className="flex flex-col">
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          JEE Buddy
        </span>
        <span className="text-[0.6rem] text-gray-400 font-medium -mt-1">
          AI Learning Assistant
        </span>
      </div>
    </div>
  );
};

export default Logo; 