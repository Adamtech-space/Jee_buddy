import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../interceptors/ai.service';
import PropTypes from 'prop-types';

const SubscriptionContext = createContext();

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getUserId = () => {
    try {
      const userDataStr = localStorage.getItem('user');
      if (!userDataStr) return null;
      const userData = JSON.parse(userDataStr);
      return userData.id || null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        setIsSubscribed(false);
        setLoading(false);
        return;
      }

      const response = await aiService.checkSubscriptionStatus(userId);
      console.log('Subscription status:', response);
      
      if (response.status === 'success') {
        setIsSubscribed(response.is_subscribed);
        // Only set up popup timer if user is not subscribed and hasn't seen popup
        if (!response.is_subscribed && !sessionStorage.getItem('hasSeenPopup')) {
          setupPopupTimer();
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  };

  const setupPopupTimer = () => {
    // Show popup after 30 seconds for non-subscribed users
    setTimeout(() => {
      if (!sessionStorage.getItem('hasSeenPopup')) {
        setShowPopup(true);
        sessionStorage.setItem('hasSeenPopup', 'true');
      }
    }, 30000); // 30 seconds
  };

  useEffect(() => {
    checkSubscriptionStatus();

    // Cleanup function to handle component unmount
    return () => {
      setShowPopup(false);
    };
  }, []);

  const handleSubscribe = () => {
    setShowPopup(false);
    sessionStorage.setItem('hasSeenPopup', 'true');
    navigate('/subscription');
  };

  const handleClose = () => {
    setShowPopup(false);
    sessionStorage.setItem('hasSeenPopup', 'true');
  };

  const value = {
    showPopup,
    setShowPopup,
    isSubscribed,
    loading,
    handleSubscribe,
    checkSubscriptionStatus
  };

  if (loading) {
    return null;
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      {showPopup && !isSubscribed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-xl max-w-md w-full mx-4 relative">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-4">
              Upgrade Your JEE Preparation
            </h2>
            <p className="text-gray-300 mb-6">
              Get unlimited access to AI assistance, practice questions, and advanced analytics by subscribing to our premium plans.
            </p>
            <div className="flex justify-end">
              <button
                onClick={handleSubscribe}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}
    </SubscriptionContext.Provider>
  );
};

SubscriptionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SubscriptionProvider;