import React from 'react';

const NewSubscription = () => {
  const basicFeatures = [
    'Access to AI Learning Assistant',
    'Basic Study Materials',
    'Limited AI Usage',
    'Email Support',
  ];

  const proFeatures = [
    'Unlimited AI Usage',
    'AI Generated Question Bank',
    'Performance Analytics',
    'Priority Support',
    'Advanced Analytics',
    'Complete Study Materials',
    'Download Access',
    'Visualization Tools',
  ];

  const handleBasicPlan = () => {
    window.location.href = 'https://pages.razorpay.com/pl_PrhaeIg2Jxrvro/view';
  };

  const handleProPlan = () => {
    window.location.href = 'https://pages.razorpay.com/pl_PrhdIDzeP8Vz57/view';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h6 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
        Select the perfect plan
        </h6>
        <div className="flex justify-center gap-8 flex-wrap">
          {/* Basic Plan Card */}
          <div className="w-full md:w-[380px] p-8 bg-gray-800 backdrop-blur-lg rounded-2xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:transform hover:-translate-y-2">
            <div className="flex flex-col h-full">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Basic Plan
                </h2>
                <p className="text-gray-400">Perfect for getting started</p>
              </div>

              <div className="space-y-4 flex-grow">
                {basicFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleBasicPlan}
                className="mt-8 w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
              >
                Get Basic Plan
              </button>
            </div>
          </div>

          {/* Pro Plan Card */}
          <div className="w-full md:w-[380px] p-8 bg-gradient-to-b from-blue-600/10 to-gray-800 backdrop-blur-lg rounded-2xl border border-blue-500/50 hover:border-blue-400 transition-all duration-300 hover:transform hover:-translate-y-2">
            <div className="flex flex-col h-full">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-white">Pro Plan</h2>
                  <span className="px-3 py-1 text-xs font-semibold text-blue-200 bg-blue-500/20 rounded-full">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-gray-400">
                  Advanced features for serious preparation
                </p>
              </div>

              <div className="space-y-4 flex-grow">
                {proFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleProPlan}
                className="mt-8 w-full bg-gradient-to-r from-blue-400 to-blue-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
              >
                Get Pro Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSubscription;
