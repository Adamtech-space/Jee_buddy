import React, { useState, useEffect } from 'react';
import { getProfile } from '../interceptors/services';
import { useNavigate } from 'react-router-dom';

const NewSubscription = () => {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [isInstructionsAccepted, setIsInstructionsAccepted] = useState(false);
  const [isContactDownloaded, setIsContactDownloaded] = useState(false);
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
    setSelectedPlan('Basic');
    setShowNotification(true);
  };

  const handleProPlan = () => {
    setSelectedPlan('Pro');
    setShowNotification(true);
  };

  const handleProceedToPayment = () => {
    const paymentUrls = {
      Basic: 'https://pages.razorpay.com/pl_PrhaeIg2Jxrvro/view',
      Pro: 'https://pages.razorpay.com/pl_PrhdIDzeP8Vz57/view',
    };
    window.location.href = paymentUrls[selectedPlan];
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
    setIsInstructionsAccepted(false);
    setIsContactDownloaded(false);
    setSelectedPlan('');
  };

  const handleDownloadContact = () => {
    const contactInfo = `JEE Buddy - ${selectedPlan} Plan
Contact for verification after payment:
Email: support@adamtechnologies.in
Phone: +91 8344242526`;

    const blob = new Blob([contactInfo], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'JEE_Buddy_Contact_Info.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setIsContactDownloaded(true);
  };

  const NotificationPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">
          {selectedPlan} Plan Selected
        </h3>

        {/* Important Instructions in Red with Checkbox */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700 font-bold">IMPORTANT INSTRUCTIONS:</p>
          <p className="text-red-600 font-medium mt-1 mb-3">
            After payment, you MUST contact us for verification to activate your
            subscription. Without verification, your subscription will not be
            activated.
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isInstructionsAccepted}
              onChange={(e) => setIsInstructionsAccepted(e.target.checked)}
              className="w-5 h-5 mt-0.5 text-blue-600 rounded cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            />
            <span className="text-red-600 font-medium text-sm group-hover:text-red-700">
              I understand verification is required after payment
            </span>
          </label>
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <a
              href="mailto:support@adamtechnologies.in"
              className="text-blue-500 hover:underline"
            >
              support@adamtechnologies.in
            </a>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <a href="tel:8344242526" className="text-blue-500 hover:underline">
              +91 8344242526
            </a>
          </div>
        </div>

        {/* Download Checkbox with improved styling */}
        <label className="flex items-start gap-2 cursor-pointer group mb-4">
          <input
            type="checkbox"
            checked={isContactDownloaded}
            onChange={(e) => {
              if (e.target.checked) {
                handleDownloadContact();
              }
            }}
            className="w-5 h-5 mt-0.5 text-blue-600 rounded cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
          <span className="text-gray-700 text-sm group-hover:text-gray-900">
            Save contact information
          </span>
        </label>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleProceedToPayment}
            disabled={!isInstructionsAccepted || !isContactDownloaded}
            className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors duration-300
              ${
                isInstructionsAccepted && isContactDownloaded
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            Proceed to Payment
          </button>
          <button
            onClick={handleCloseNotification}
            className="w-full bg-gray-100 text-gray-600 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-300 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const handleReturnToDashboard = () => {
    navigate('/subject-selection');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      {showNotification && <NotificationPopup />}
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
