import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { aiService } from '../interceptors/ai.service';
import PropTypes from 'prop-types';

const SubscriptionContext = createContext();

export const useSubscription = () => useContext(SubscriptionContext);

// List of routes that are accessible without subscription
const PUBLIC_ROUTES = ['/login', '/register', '/settings'];

export const SubscriptionProvider = ({ children }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forceSubscribe, setForceSubscribe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
        if (!response.is_subscribed) {
          setupSubscriptionTimer();
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  };

  const setupSubscriptionTimer = () => {
    // After 3 days (259200000 ms), force subscription for non-subscribed users
    setTimeout(() => {
      setForceSubscribe(true);
      navigate('/settings');
    }, 259200000); // 3 days = 3 * 24 * 60 * 60 * 1000 milliseconds
  };

  // Check if current route is public
  const isPublicRoute = () => {
    return PUBLIC_ROUTES.some(route => location.pathname.startsWith(route));
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  // Effect to handle route protection
  useEffect(() => {
    if (!loading && !isSubscribed && forceSubscribe && !isPublicRoute()) {
      navigate('/settings');
    }
  }, [loading, isSubscribed, forceSubscribe, location.pathname]);

  const handleSubscribe = () => {
    navigate('/settings');
  };

  const value = {
    showPopup,
    setShowPopup,
    isSubscribed,
    loading,
    handleSubscribe,
    checkSubscriptionStatus,
    forceSubscribe
  };

  if (loading) {
    return null;
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      {!isSubscribed && forceSubscribe && !isPublicRoute() && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-xl max-w-md w-full mx-4 relative">
            <h2 className="text-2xl font-bold text-white mb-4">
              Subscription Required
            </h2>
            <p className="text-gray-300 mb-6">
              To continue using JEE Buddy's features, please subscribe to one of our plans. This will give you access to all our premium features and AI assistance.
            </p>
            <div className="flex justify-end">
              <button
                onClick={handleSubscribe}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Subscription Plans
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