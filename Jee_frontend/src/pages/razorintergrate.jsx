import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiInstance from '../interceptors/axios';
import { updateProfileCache } from '../interceptors/services';

const RazorpayIntegration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'plan_PhmnKiiVXD3B1M',
      name: 'Basic Plan',
      price: 1,
      features: [
        'Access to all study materials',
        'Basic question bank',
        'Limited practice tests',
        'Email support',
      ],
    },
    {
      id: 'plan_PhmnlqjWH24hwy',
      name: 'Pro Plan',
      price: 2,
      features: [
        'Everything in Basic Plan',
        'Advanced question bank',
        'Unlimited practice tests',
        'Priority support',
        'Performance analytics',
      ],
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
            // Get current profile to maintain total_tokens
            const profileResponse = await apiInstance.get('/profile');
            const currentProfile = profileResponse.data.data;

            // Update profile with new plan details
            const nextBillingDate = new Date();
            nextBillingDate.setDate(nextBillingDate.getDate() + 30);

            const updatePayload = {
              // ...currentProfile, // Keep all existing profile data
              payment_status: 'completed',
              current_plan_id: planId,
              // next_billing_date: nextBillingDate.toISOString(),
              days_remaining: 30,
              // razorpay_payment_id: response.razorpay_payment_id,
              // total_tokens: parseInt(currentProfile.total_tokens) || 0,
              // updated_at: new Date().toISOString(),
            };

            console.log('Update payload:', updatePayload);

            try {
              const updateResponse = await apiInstance.put(
                '/profile',
                updatePayload
              );
              console.log('Update response:', updateResponse);

              // Update profile cache after successful payment
              await updateProfileCache();

              alert('Payment successful! Your subscription is now active.');
              navigate('/dashboard');
            } catch (updateError) {
              console.error('Profile update error:', {
                message: updateError.message,
                response: updateError.response?.data,
                status: updateError.response?.status,
              });
              alert(
                `Payment verification failed. Error: ${updateError.response?.data?.message || updateError.message}`
              );
            }
          } catch (error) {
            console.error('Payment error:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status,
            });
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com',
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
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Select the plan that best fits your preparation needs
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="px-6 py-8">
                <h3 className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-4 text-4xl font-extrabold text-gray-900">
                  ₹{plan.price}
                </p>
                <p className="mt-1 text-gray-500">One-time payment</p>

                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePayment(plan.id, plan.price)}
                  disabled={loading}
                  className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Get ${plan.name}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RazorpayIntegration;
