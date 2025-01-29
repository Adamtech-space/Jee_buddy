import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

// Define plan IDs
const PLANS = {
  'BASIC': 'plan_PhmnKiiVXD3B1M',
  'PREMIUM': 'plan_Phmo9yOZAKb0P8',
  'PRO': 'plan_PhmnlqjWH24hwy'
};

const SubscriptionCard = ({ plan, isActive, onSubscribe, subscriptionDetails }) => {
  const isCurrentPlan = isActive && subscriptionDetails?.plan_id === plan.id;
  
  const getExpiryStatusColor = (status) => {
    switch (status) {
      case 'expiring_soon':
        return 'text-yellow-500';
      case 'expired':
        return 'text-red-500';
      default:
        return 'text-green-500';
    }
  };

  const getExpiryStatusText = (status) => {
    switch (status) {
      case 'expiring_soon':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired';
      default:
        return 'Active';
    }
  };
  
  return (
    <div 
      className={`bg-gray-900 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
        isCurrentPlan ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/20' : 'hover:border-2 hover:border-gray-700'
      }`}
      onClick={() => onSubscribe && onSubscribe(plan)}
    >
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
        <p className="text-3xl font-bold text-white mt-2">
          ₹{plan.price}<span className="text-sm text-gray-400">/month</span>
        </p>
        {isCurrentPlan && subscriptionDetails && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-300">Subscription Status</p>
              <span className={`text-sm font-medium ${getExpiryStatusColor(subscriptionDetails.expiry_status)}`}>
                {getExpiryStatusText(subscriptionDetails.expiry_status)}
              </span>
            </div>
            <p className="text-lg font-semibold text-white mt-1">
              {subscriptionDetails.days_remaining} days remaining
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
              <div 
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  subscriptionDetails.expiry_status === 'expired' 
                    ? 'bg-red-500' 
                    : subscriptionDetails.expiry_status === 'expiring_soon'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${(subscriptionDetails.days_used / subscriptionDetails.total_days) * 100}%` }}
              ></div>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-400">
                {subscriptionDetails.subscription_progress}
              </p>
              <p className="text-xs text-gray-400">
                Started: {new Date(subscriptionDetails.start_date).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-400">
                Expires: {new Date(subscriptionDetails.end_date).toLocaleDateString()}
              </p>
            </div>
            {subscriptionDetails.reminder_message && (
              <div className="mt-3 p-2 bg-gray-700 rounded text-xs text-yellow-400">
                {subscriptionDetails.reminder_message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

SubscriptionCard.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    features: PropTypes.arrayOf(PropTypes.string).isRequired,
    type: PropTypes.string.isRequired
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onSubscribe: PropTypes.func.isRequired,
  subscriptionDetails: PropTypes.shape({
    plan_id: PropTypes.string,
    days_remaining: PropTypes.number,
    days_used: PropTypes.number,
    total_days: PropTypes.number,
    subscription_progress: PropTypes.string,
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    expiry_status: PropTypes.oneOf(['active', 'expiring_soon', 'expired']),
    reminder_message: PropTypes.string
  })
};

SubscriptionCard.defaultProps = {
  subscriptionDetails: null
};

const LoadingSpinner = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#8075FF] border-t-transparent"></div>
      <p className="text-white text-lg">Loading subscription details...</p>
    </div>
  </div>
);

const Subscription = () => {
  const navigate = useNavigate();
  const [loadingStates, setLoadingStates] = useState({
    BASIC: false,
    PRO: false,
    PREMIUM: false,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const getUserData = () => {
    try {
      const userDataStr = localStorage.getItem('user');
      if (!userDataStr) return null;
      return JSON.parse(userDataStr);
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeSubscription = async () => {
      try {
        setIsInitializing(true);
        await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        const userData = getUserData();
        console.log('Current user data:', userData);
        if (!userData) {
          console.warn('No user data found in localStorage');
          navigate('/login');
          return;
        }
        
        checkSubscriptionStatus(userData);
      } finally {
        // Add a minimum delay to prevent flash
        setTimeout(() => {
          setIsInitializing(false);
        }, 500);
      }
    };

    initializeSubscription();
  }, []);

  const checkSubscriptionStatus = (userData) => {
    try {
      console.log('Checking subscription status from user data:', userData);
      
      if (!userData) {
        console.warn('No user data available');
        return;
      }

      // Check if user has payment_status completed
      if (userData.payment_status === 'completed') {
        setIsSubscribed(true);
        
        // Determine plan type based on current_plan_id
        let planType = 'BASIC'; // Default to BASIC
        if (userData.current_plan_id) {
          planType = Object.keys(PLANS).find(key => PLANS[key] === userData.current_plan_id) || 'BASIC';
        }

        // Calculate days used
        const createdAt = new Date(userData.created_at);
        const nextBillingDate = new Date(userData.next_billing_date);
        const currentDate = new Date();
        const totalDays = Math.ceil((nextBillingDate - createdAt) / (1000 * 60 * 60 * 24));
        const daysUsed = Math.ceil((currentDate - createdAt) / (1000 * 60 * 60 * 24));

        // Set current plan with subscription details
        setCurrentPlan({
          type: planType,
          name: `${planType.charAt(0) + planType.slice(1).toLowerCase()} Plan`,
          price: planType === 'BASIC' ? 499 : planType === 'PRO' ? 1499 : 4999,
          subscriptionDetails: {
            plan_id: userData.current_plan_id,
            days_remaining: userData.days_remaining || 0,
            days_used: daysUsed,
            total_days: totalDays,
            subscription_progress: `${userData.days_remaining} days remaining`,
            start_date: userData.created_at,
            end_date: userData.next_billing_date,
            expiry_status: userData.days_remaining <= 5 ? 'expiring_soon' : 
                          userData.days_remaining <= 0 ? 'expired' : 'active',
            reminder_message: userData.days_remaining <= 5 ? 
                            `Your subscription will expire in ${userData.days_remaining} days. Renew now to continue uninterrupted access.` : 
                            null
          }
        });
      } else {
        setIsSubscribed(false);
        setCurrentPlan(null);
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  };

  const handleGetStarted = async (plan) => {
    try {
      setLoadingStates((prev) => ({
        ...prev,
        [plan.type]: true,
      }));
      
      const userData = getUserData();
      if (!userData) {
        alert('Please login first');
        navigate('/login');
        return;
      }

      await handlePayment(plan.price, plan.name, plan.id);
    } catch (error) {
      console.error('Failed to process plan selection:', error);
      alert('Failed to process your request. Please try again.');
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [plan.type]: false,
      }));
    }
  };

  const handlePayment = async (price, product_name, plan_id) => {
    try {
      setLoadingStates((prev) => ({
        ...prev,
        [Object.keys(prev).find((key) => prev[key] === true)]: true,
      }));
      
      const userData = getUserData();
      if (!userData) {
        alert('Please login first');
        return;
      }

      // Mock data for demonstration
      const data = {
        razorpay_key: 'YOUR_RAZORPAY_KEY',
        order: {
          id: 'mock_order_id'
        }
      };
      
      const options = {
        key: data.razorpay_key,
        subscription_id: data.order.id,
        name: "JEE Buddy",
        description: `${product_name} Subscription`,
        image: "https://your-logo-url.png",
        currency: "INR",
        prefill: {
          email: userData.email || '',
          name: userData.name || '',
          contact: ''
        },
        notes: {
          user_id: userData.id,
          plan_name: product_name,
          plan_id: plan_id
        },
        handler: function(response) {
          console.log('Razorpay payment success:', response);
          verifyPayment(response);
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed');
            setLoadingStates((prev) => ({
              ...prev,
              [Object.keys(prev).find((key) => prev[key] === true)]: false,
            }));
          }
        },
        theme: {
          color: "#000000"
        }
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay script not loaded');
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Failed to initiate payment: ${error.message}`);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [Object.keys(prev).find((key) => prev[key] === true)]: false,
      }));
    }
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      console.log('Payment response:', paymentResponse);
      
      // Mock successful payment verification
      const mockData = {
        status: 'success',
        plan_id: PLANS['BASIC']
      };

      if (mockData.status === 'success') {
        setIsSubscribed(true);
        // Update current plan after successful payment
        const planType = Object.keys(PLANS).find(key => PLANS[key] === mockData.plan_id);
        setCurrentPlan({
          type: planType,
          name: `${planType.charAt(0) + planType.slice(1).toLowerCase()} Plan`,
          price: planType === 'BASIC' ? 499 : planType === 'PRO' ? 1499 : 4999
        });
        alert('Payment successful! Your plan has been updated.');
        navigate('/dashboard');
      } else {
        console.error('Verification failed:', mockData);
        alert('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Payment verification failed. Please contact support.');
    }
  };

  // Helper function to get plan features
  const getPlanFeatures = (planType) => {
    switch (planType) {
      case 'BASIC':
        return [
          'Access to AI Learning Assistant',
          'Basic Study Materials',
          'Limited AI Usage',
          'Email Support'
        ];
      case 'PRO':
        return [
          'Extra AI Usage',
          'Advanced Materials',
          'Question Bank',
          'Priority Support',
          'Strength and Weakness Analysis'
        ];
      case 'PREMIUM':
        return [
          'Unlimited AI Usage',
          'AI Generated Question Bank',
          'Performance Analytics',
          'Priority Support',
          'Advanced Analytics'
        ];
      default:
        return [];
    }
  };

  if (isInitializing) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-white mb-8 hover:text-purple-400 transition-colors"
        >
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </button>

        {isSubscribed && currentPlan ? (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
                Your JEE Buddy Subscription
              </h1>
              <p className="text-gray-400 text-lg">
                {currentPlan.type === 'PREMIUM'
                  ? 'You are enjoying our highest tier plan with all premium features!'
                  : 'Upgrade your plan anytime to unlock more features and benefits'}
              </p>
            </div>

            {/* Current Plan Card */}
            <div className="mb-16">
              <h2 className="text-2xl text-white font-semibold mb-6">
                Current Plan
              </h2>
              <div className="rounded-3xl bg-gradient-to-b from-[#2c2439] to-[#1a1625] p-8 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500 opacity-10 rounded-full transform translate-x-20 -translate-y-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full transform -translate-x-16 translate-y-16"></div>

                {/* Active Plan Badge */}
                <div className="absolute top-4 right-4">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Active Plan
                  </span>
                </div>

                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {currentPlan.name}
                  </h2>
                  <div className="flex items-baseline mb-8">
                    <span className="text-2xl text-[#8075FF]">₹</span>
                    <span className="text-5xl font-bold text-[#8075FF]">
                      {currentPlan.price}
                    </span>
                    <span className="text-gray-400 ml-2">/month</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left mb-8">
                    {getPlanFeatures(currentPlan.type).map((feature, index) => (
                      <div key={index} className="flex items-center text-white">
                        <svg
                          className="w-5 h-5 mr-3 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-3 rounded-lg bg-[#1e1b29] text-white font-semibold hover:bg-[#2a2635] transition-colors"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>

            {/* Show upgrade option only if not on Premium plan */}
            {currentPlan.type !== 'PREMIUM' && (
              <div>
                <h2 className="text-2xl text-white font-semibold mb-6">
                  Available Upgrades
                </h2>
                <div className="rounded-3xl bg-[#1a1625] p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Premium Plan
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Unlock unlimited AI usage and advanced features
                      </p>
                      <div className="flex items-baseline mb-4">
                        <span className="text-xl text-[#8075FF]">₹</span>
                        <span className="text-4xl font-bold text-[#8075FF]">
                          4,999
                        </span>
                        <span className="text-gray-400 ml-2">/month</span>
                      </div>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center text-white">
                          <svg
                            className="w-5 h-5 mr-3 text-[#8075FF]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Unlimited AI Usage
                        </li>
                        <li className="flex items-center text-white">
                          <svg
                            className="w-5 h-5 mr-3 text-[#8075FF]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          AI Generated Question Bank
                        </li>
                        <li className="flex items-center text-white">
                          <svg
                            className="w-5 h-5 mr-3 text-[#8075FF]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Performance Analytics
                        </li>
                      </ul>
                    </div>
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() =>
                          handleGetStarted({
                            type: 'PREMIUM',
                            price: 4999,
                            name: 'Premium Plan',
                            id: PLANS['PREMIUM'],
                          })
                        }
                        disabled={loadingStates.PREMIUM}
                        className="px-8 py-3 rounded-lg bg-[#8075FF] text-white font-semibold hover:bg-[#6a5ff0] transition-colors"
                      >
                        {loadingStates.PREMIUM
                          ? 'Processing...'
                          : 'Upgrade to Premium'}
                      </button>
                      <p className="text-gray-500 text-sm mt-2">
                        Cancel or change plans anytime
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Non-subscribed User View - Keep existing plans grid
          <>
            <h1 className="text-4xl md:text-5xl text-center font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-16">
              Choose the plan that works best for you
            </h1>

            {/* Existing plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Basic Plan */}
              <div className="rounded-3xl bg-[#1a1625] p-8 flex flex-col">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Basic</h2>
                  <div className="flex items-baseline">
                    <span className="text-2xl text-[#8075FF]">₹</span>
                    <span className="text-4xl font-bold text-[#8075FF]">
                      0000000
                    </span>
                    <span className="text-gray-400 ml-2">/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Access to AI Learning Assistant
                  </li>
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Basic Study Materials
                  </li>
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Limited AI Usage
                  </li>
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Email Support
                  </li>
                </ul>
                {!isSubscribed && (
                  <button
                    onClick={() =>
                      handleGetStarted({
                        type: 'BASIC',
                        price: 499,
                        name: 'Basic Plan',
                        id: PLANS['BASIC'],
                      })
                    }
                    disabled={loadingStates.BASIC}
                    className="w-full py-3 rounded-lg bg-[#1e1b29] text-white font-semibold hover:bg-[#2a2635] transition-colors"
                  >
                    {loadingStates.BASIC ? 'Processing...' : 'Get Started'}
                  </button>
                )}
              </div>

              {/* Pro Plan */}
              <div className="rounded-3xl bg-gradient-to-b from-[#2c2439] to-[#1a1625] p-8 flex flex-col relative mt-8 md:mt-0">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span className="bg-[#8075FF] text-white px-4 py-1 rounded-full text-sm font-medium inline-block">
                    Most Popular
                  </span>
                </div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Pro</h2>
                  <div className="flex items-baseline">
                    <span className="text-2xl text-[#8075FF]">₹</span>
                    <span className="text-4xl font-bold text-[#8075FF]">
                      1,499
                    </span>
                    <span className="text-gray-400 ml-2">/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Everything in Basic
                  </li>
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Extra AI Usage
                  </li>
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Advanced Study Materials
                  </li>
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Question Bank
                  </li>
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Strength and Weakness Analysis
                  </li>
                </ul>
                {!isSubscribed && (
                  <button
                    onClick={() =>
                      handleGetStarted({
                        type: 'PRO',
                        price: 1499,
                        name: 'Pro Plan',
                        id: PLANS['PRO'],
                      })
                    }
                    disabled={loadingStates.PRO}
                    className="w-full py-3 rounded-lg bg-[#8075FF] text-white font-semibold hover:bg-[#6a5ff0] transition-colors"
                  >
                    {loadingStates.PRO ? 'Processing...' : 'Get Started'}
                  </button>
                )}
              </div>

              {/* Premium Plan */}
              <div className="rounded-3xl bg-[#1a1625] p-8 flex flex-col">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Premium
                  </h2>
                  <div className="flex items-baseline">
                    <span className="text-2xl text-[#8075FF]">₹</span>
                    <span className="text-4xl font-bold text-[#8075FF]">
                      4,999
                    </span>
                    <span className="text-gray-400 ml-2">/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Everything in Pro
                  </li>
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Unlimited AI Usage
                  </li>
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    AI Generated Question Bank
                  </li>
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Performance Analytics
                  </li>
                  <li className="flex items-center text-white">
                    <svg
                      className="w-5 h-5 mr-3 text-[#8075FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Priority Support
                  </li>
                </ul>
                {!isSubscribed && (
                  <button
                    onClick={() =>
                      handleGetStarted({
                        type: 'PREMIUM',
                        price: 4999,
                        name: 'Premium Plan',
                        id: PLANS['PREMIUM'],
                      })
                    }
                    disabled={loadingStates.PREMIUM}
                    className="w-full py-3 rounded-lg bg-[#1e1b29] text-white font-semibold hover:bg-[#2a2635] transition-colors"
                  >
                    {loadingStates.PREMIUM ? 'Processing...' : 'Get Started'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Subscription; 