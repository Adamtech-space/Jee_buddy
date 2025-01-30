import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiInstance from '../interceptors/axios';

const SubscriptionModal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const response = await apiInstance.get('/subscription/status');
      if (response.data.isSubscribed) {
        // If subscribed, close modal and continue
        navigate('/subject-selection');
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create order
      const orderResponse = await apiInstance.post('/subscription/order');
      const { id: orderId, amount } = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: amount,
        currency: "INR",
        name: "JEE Buddy",
        description: "Premium Subscription",
        order_id: orderId,
        handler: async (response) => {
          try {
            // Verify payment
            await apiInstance.post('/subscription/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Navigate to subject selection
            navigate('/subject-selection');
          } catch (error) {
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: localStorage.getItem('user')?.name,
          email: localStorage.getItem('user')?.email,
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setError('Failed to initiate payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-xl max-w-md w-full mx-4 border border-blue-500">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Upgrade to Premium</h2>
          <p className="text-gray-400 mb-6">
            Get unlimited access to all features and study materials
          </p>
          
          <div className="bg-blue-500 rounded-lg p-6 mb-8">
            <div className="text-4xl font-bold text-white mb-2">₹499</div>
            <div className="text-blue-100">per month</div>
          </div>

          <div className="space-y-4 mb-8 text-left">
            <div className="flex items-center text-gray-300">
              <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Personalized AI Study Assistant
            </div>
            <div className="flex items-center text-gray-300">
              <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Advanced Practice Questions
            </div>
            <div className="flex items-center text-gray-300">
              <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Performance Analytics
            </div>
            <div className="flex items-center text-gray-300">
              <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Study Material Downloads
            </div>
          </div>

          {error && (
            <div className="text-red-500 mb-4 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Subscribe Now'}
          </button>

          <p className="mt-4 text-sm text-gray-400">
            Includes 1-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal; 