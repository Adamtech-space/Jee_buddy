import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Subscription = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Check subscription status and chat count
    const checkStatus = async () => {
      try {
        const response = await axios.get('/v1/subscription/status');
        setIsSubscribed(response.data.isSubscribed);
        setChatCount(response.data.chatCount);
      } catch (error) {
        console.error('Failed to check subscription status:', error);
      }
    };

    checkStatus();
  }, []);

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      // Create order
      const orderResponse = await axios.post('/v1/subscription/create-order', {
        amount: 499 * 100, // Amount in paise
      });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderResponse.data.amount,
        currency: "INR",
        name: "JEE AI Assistant",
        description: "Premium Subscription",
        order_id: orderResponse.data.id,
        handler: async (response) => {
          try {
            // Verify payment
            await axios.post('/v1/subscription/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            setIsSubscribed(true);
            navigate('/dashboard');
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: "User",
          email: localStorage.getItem('userEmail'),
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Failed to initiate payment:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Premium Access</h2>
          <p className="text-gray-400">
            {isSubscribed 
              ? "You have premium access!"
              : chatCount >= 5 
                ? "Upgrade to continue chatting"
                : `${5 - chatCount} free chats remaining`
            }
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-white">Premium Plan</h3>
            <span className="text-3xl font-bold text-white">₹499</span>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center text-white">
              <span className="mr-2">✓</span>
              Unlimited AI Conversations
            </li>
            <li className="flex items-center text-white">
              <span className="mr-2">✓</span>
              Advanced Learning Features
            </li>
            <li className="flex items-center text-white">
              <span className="mr-2">✓</span>
              Personalized Study Plans
            </li>
            <li className="flex items-center text-white">
              <span className="mr-2">✓</span>
              Priority Support
            </li>
          </ul>
          {!isSubscribed && (
            <button
              onClick={handlePayment}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg bg-white text-blue-600 font-bold hover:bg-gray-100 
                        transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : 'Subscribe Now'}
            </button>
          )}
        </div>

        {isSubscribed && (
          <div className="text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription; 