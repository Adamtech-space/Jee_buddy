import React, { useState, useEffect } from 'react';
import { getProfile } from '../interceptors/services';
import { useNavigate } from 'react-router-dom';

const NewSubscription = () => {
  const [currentPlan, setCurrentPlan] = useState(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      try {
        const response = await getProfile();
        if (response.status === 'success' && response.data) {
          setCurrentPlan(response.data.current_plan_id);
        }
      } catch (error) {
        console.error('Error fetching subscription details:', error);
      }
    };

    fetchSubscriptionDetails();
  }, []);

  // Function to check if any plan is active
  const hasActivePlan = () => {
    return isPlanActive('BASIC') || isPlanActive('PRO');
  };

  // Function to check if a plan is currently active
  const isPlanActive = (planType) => {
    const planMapping = {
      BASIC: 'plan_PhmnKiiVXD3B1M',
      PRO: 'plan_PhmnlqjWH24hwy',
    };
    return currentPlan === planMapping[planType];
  };

  const handleBasicPlan = () => {
    window.location.href = 'https://pages.razorpay.com/pl_PrhaeIg2Jxrvro/view';
  };

  const handleProPlan = () => {
    window.location.href = 'https://pages.razorpay.com/pl_PrhdIDzeP8Vz57/view';
  };

  const handleReturnToDashboard = () => {
    navigate('/subject-selection');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h6 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
          Select the perfect plan
        </h6>

        {/* Return to Dashboard Button */}
        {hasActivePlan() && (
          <div className="flex justify-center mb-8">
            <button
              onClick={handleReturnToDashboard}
              className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-green-500/25"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        <div className="flex justify-center gap-8 flex-wrap">
          {/* Basic Plan Card */}
          <div className="w-full md:w-[380px] p-8 bg-gray-800 backdrop-blur-lg rounded-2xl border border-gray-700 hover:border-blue-500 transition-all duration-300">
            <div className="flex flex-col h-full">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-white">Basic Plan</h2>
                  {isPlanActive('BASIC') && (
                    <span className="px-3 py-1 text-xs font-semibold text-green-400 bg-green-500/20 rounded-full">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">₹999</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-gray-400 mt-2">
                  Perfect for getting started
                </p>
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
                disabled={isPlanActive('BASIC')}
                className={`mt-8 w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg
                  ${isPlanActive('BASIC') ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/25'}`}
              >
                {isPlanActive('BASIC') ? 'Current Plan' : 'Get Basic Plan'}
              </button>
            </div>
          </div>

          {/* Pro Plan Card */}
          <div className="w-full md:w-[380px] p-8 bg-gradient-to-b from-blue-600/10 to-gray-800 backdrop-blur-lg rounded-2xl border border-blue-500/50 hover:border-blue-400 transition-all duration-300">
            <div className="flex flex-col h-full">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-white">Pro Plan</h2>
                  {isPlanActive('PRO') ? (
                    <span className="px-3 py-1 text-xs font-semibold text-green-400 bg-green-500/20 rounded-full">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-semibold text-blue-200 bg-blue-500/20 rounded-full">
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">₹4,999</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-gray-400 mt-2">
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
                disabled={isPlanActive('PRO')}
                className={`mt-8 w-full bg-gradient-to-r from-blue-400 to-blue-500 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg
                  ${isPlanActive('PRO') ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/25'}`}
              >
                {isPlanActive('PRO') ? 'Current Plan' : 'Get Pro Plan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSubscription;
