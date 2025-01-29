import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { userLogin, googleSignIn } from '../interceptors/services';
import { aiService } from '../interceptors/ai.service';
import { Analytics } from '@vercel/analytics/react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if already authenticated
  useEffect(() => {
    const tokens = localStorage.getItem('tokens');
    const user = localStorage.getItem('user');
    if (tokens && user) {
      navigate('/subject-selection', { replace: true });
    }
  }, [navigate]);

  const fetchAndStoreSubscriptionDetails = async (userId) => {
    try {
      const subscriptionData = await aiService.checkSubscriptionStatus(userId);
      console.log('Received subscription data:', subscriptionData); // Debug log
      
      if (subscriptionData && subscriptionData.status === 'success') {
        const subscriptionDetails = {
          is_subscribed: subscriptionData.is_subscribed,
          subscription_id: subscriptionData.subscription_id,
          plan_id: subscriptionData.plan_id,
          created_at: subscriptionData.created_at,
          valid_till: subscriptionData.valid_till,
          days_remaining: subscriptionData.days_remaining,
          next_billing_date: subscriptionData.next_billing_date,
          status: subscriptionData.status
        };
        
        console.log('Storing subscription details:', subscriptionDetails); // Debug log
        localStorage.setItem('subscription', JSON.stringify(subscriptionDetails));
        
        // Verify storage
        const storedData = localStorage.getItem('subscription');
        console.log('Verified stored data:', storedData); // Debug log
      } else {
        console.warn('Invalid subscription data received:', subscriptionData);
      }
    } catch (error) {
      console.error('Failed to fetch subscription details:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Submitting login form...');
      const response = await userLogin({ email, password });
      console.log('Login successful:', response);
      
      if (response?.tokens?.access?.token && response?.user) {
        // Store tokens and user data first
        localStorage.setItem('tokens', JSON.stringify(response.tokens));
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Then fetch and store subscription details
        await fetchAndStoreSubscriptionDetails(response.user.id);
        
        // Verify all data is stored
        const verifyData = {
          tokens: localStorage.getItem('tokens'),
          user: localStorage.getItem('user'),
          subscription: localStorage.getItem('subscription')
        };
        console.log('Verified stored data:', verifyData);
        
        // Force a small delay to ensure state updates are processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use window.location for a full page refresh
        window.location.href = '/subject-selection';
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle network errors specifically
      if (err.message.includes('Unable to connect')) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await googleSignIn();
      if (response.url) {
        // Note: For Google sign-in, subscription details will need to be handled 
        // in the callback route after successful authentication
        window.location.href = response.url;
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Analytics />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 p-8 bg-gray-900 rounded-xl shadow-xl"
      >
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">Welcome to JEE Buddy</h2>
          <p className="mt-2 text-sm text-gray-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div>
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-700 rounded-lg text-white hover:bg-gray-800 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">Or sign in with email</span>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-sm text-blue-500 hover:text-blue-400">
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-blue-500 hover:text-blue-400">
                Create account
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;