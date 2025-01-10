import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Subscription = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);

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

  useEffect(() => {
    loadScript("https://checkout.razorpay.com/v1/checkout.js");
    const userId = localStorage.getItem('uuid');
    console.log('Current user ID:', userId);
    if (!userId) {
      console.warn('No user ID found in localStorage');
      // You might want to redirect to login here
      // navigate('/login');
    }
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const userId = localStorage.getItem('uuid');
      const response = await fetch(`http://127.0.0.1:8000/api/subscription/status/?user_id=${userId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setIsSubscribed(data.is_subscribed);
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  };

  const handlePayment = async (price, product_name, plan_id) => {
    try {
      setLoading(true);
      console.log('Starting payment process...');
      
      const userId = localStorage.getItem('uuid');
      if (!userId) {
        alert('Please login first');
        return;
      }

      const requestData = {
        price,
        product_name,
        plan_id,
        user_id: userId
      };

      console.log('Sending request with data:', requestData);

      const response = await fetch('http://127.0.0.1:8000/api/subscription/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!data.razorpay_key || !data.order) {
        throw new Error('Invalid response from server');
      }
      
      const options = {
        key: data.razorpay_key,
        amount: data.order.amount,
        currency: "INR",
        name: data.product_name,
        subscription_id: data.order.id,
        callback_url: data.callback_url,
        prefill: {
          email: localStorage.getItem('userEmail') || '',
          contact: ''
        },
        notes: {
          user_id: userId
        },
        handler: function(response) {
          console.log('Payment success:', response);
          verifyPayment(response);
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed');
            setLoading(false);
          }
        },
        theme: {
          color: "#3B82F6"
        }
      };

      console.log('Razorpay options:', options);
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/subscription/callback/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_subscription_id: paymentResponse.razorpay_subscription_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          user_id: localStorage.getItem('uuid')
        })
      });

      const data = await response.json();
      console.log('Verification response:', data);

      if (data.status === 'success') {
        setIsSubscribed(true);
        alert('Payment successful! You are now subscribed.');
        navigate('/dashboard');
      } else {
        alert('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Payment verification failed. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Premium Access</h2>
          {isSubscribed && (
            <p className="text-green-400 mb-4">
              You are currently subscribed!
              <br />
              Subscription ID: {subscriptionData?.subscription_id}
            </p>
          )}
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
          </ul>
          {!isSubscribed && (
            <button
              onClick={() => handlePayment(499, "JEE AI Premium", "plan_MtHhFwXXEAQhXa")}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg bg-white text-blue-600 font-bold hover:bg-gray-100 
                        transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : 'Subscribe Now'}
            </button>
          )}
          {isSubscribed && (
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-4 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 
                        transition-colors"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscription; 