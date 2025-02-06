import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiInstance from '../interceptors/axios';
import { updateProfileCache, getProfile } from '../interceptors/services';

const RazorpayIntegration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        if (response.status === 'success') {
          setProfileData(response.data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const plans = [
    {
      id: 'plan_PhmnKiiVXD3B1M',
      name: 'Basic Plan',
      price: '999',
      description: 'Perfect for getting started',
      features: [
        'Access to AI Learning Assistant',
        'Limited AI Usage',
        'Basic Study Materials',
        'Email Support',
      ],
    },
    {
      id: 'plan_PhmnlqjWH24hwy',
      name: 'Pro Plan',
      price: '4,999',
      description: 'Advanced features for serious preparation',
      features: [
        'Unlimited AI Usage',
        'Performance Analytics',
        'Advanced Analytics',
        'Download Access',
        'AI Generated Question Bank',
        'Priority Support',
        'Complete Study Materials',
        'Visualization Tools',
      ],
      recommended: true,
    },
  ];

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (planId, amount) => {
    // Don't allow payment if this plan is already active
    if (
      profileData?.payment_status === 'completed' &&
      profileData?.current_plan_id === planId
    ) {
      alert('This plan is already active!');
      return;
    }

    try {
      setLoading(true);
      const res = await initializeRazorpay();

      if (!res) {
        alert('Razorpay SDK failed to load');
        return;
      }

      // Create Razorpay order
      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        name: 'JEE Buddy',
        description: `Subscription for ${planId === 'plan_PhmnKiiVXD3B1M' ? 'Basic' : 'Pro'} Plan`,
        handler: async (response) => {
          try {
            // Update profile with new plan details and payment details
            const updatePayload = {
              payment_status: 'completed',
              current_plan_id: planId,
              days_remaining: 30,
              razorpay_payment_id: response.razorpay_payment_id, // Use the response
            };

            try {
              await apiInstance.put('/profile', updatePayload);
              await updateProfileCache();
              alert('Payment successful! Your subscription is now active.');
              navigate('/dashboard');
            } catch (updateError) {
              console.error('Profile update error:', updateError);
              alert(
                `Payment verification failed. Error: ${updateError.response?.data?.message || updateError.message}`
              );
            }
          } catch (error) {
            console.error('Payment error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: profileData?.name || 'User Name',
          email: profileData?.email || 'user@example.com',
        },
        theme: {
          color: '#3399cc',
        },
      });

      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white">
            Select the perfect plan
          </h2>
          {profileData?.payment_status === 'completed' && (
            <button
              onClick={() => navigate('/subject-selection')}
              className="mt-4 px-6 py-2 bg-[#22c55e] text-white rounded-md hover:bg-[#1ea952] transition-all"
            >
              Return to Dashboard
            </button>
          )}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {plans.map((plan) => {
            const isActivePlan =
              profileData?.payment_status === 'completed' &&
              profileData?.current_plan_id === plan.id;

            return (
              <div
                key={plan.id}
                className={`bg-[#1e2536] rounded-2xl overflow-hidden relative p-8 ${
                  isActivePlan ? 'ring-2 ring-[#22c55e]' : ''
                }`}
              >
                {isActivePlan && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#22c55e] bg-opacity-20 text-[#22c55e]">
                      ACTIVE
                    </span>
                  </div>
                )}
                {plan.recommended && !isActivePlan && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-600 bg-opacity-20 text-blue-400">
                      RECOMMENDED
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold text-white">
                      ₹{plan.price}
                    </span>
                    <span className="ml-2 text-gray-400">/month</span>
                  </div>
                  <p className="mt-2 text-gray-400">{plan.description}</p>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg
                          className="flex-shrink-0 h-5 w-5 text-[#22c55e]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="ml-3 text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() =>
                      handlePayment(
                        plan.id,
                        parseInt(plan.price.replace(',', ''))
                      )
                    }
                    disabled={loading || isActivePlan}
                    className={`mt-8 w-full py-4 px-4 rounded-xl font-medium transition-all ${
                      isActivePlan
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-[#4c7bff] hover:bg-[#3d62cc] text-white'
                    } disabled:opacity-50`}
                  >
                    {isActivePlan
                      ? 'Current Plan'
                      : loading
                        ? 'Processing...'
                        : plan.recommended
                          ? 'Get Pro Plan'
                          : `Get ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RazorpayIntegration;
