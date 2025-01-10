import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const Navbar = ({ isMobileOpen, setIsMobileOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname.includes('/dashboard') || location.pathname.includes('/subject-selection');
  const profileRef = useRef(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // subscription status
  // useEffect(() => {
  //   if (user && user.subscription) {
  //     setSubscriptionStatus(user.subscription.status);
  //   }
  // }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 w-full bg-black border-b-2 border-blue-500 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and menu button */}
          <div className="flex items-center">
            {isDashboard && (
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="mr-4 md:hidden p-2 text-gray-400 hover:text-white focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
            <Link to="/" className="flex items-center">
              <motion.svg
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="h-8 w-8 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </motion.svg>
              <span className="ml-2 text-xl font-bold text-white">
                JEE Buddy
              </span>
            </Link>
             {/* Subscription status badge */}
          {user && subscriptionStatus && (
            <div className="mx-4">
              {subscriptionStatus === 'premium' && (
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg ">
                  PREMIUM
                </span>
              )}
              {subscriptionStatus === 'pro' && (
                <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  PRO
                </span>
              )}
              {subscriptionStatus === 'free' && (
                <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  TRIAL
                </span>
              )}
              {subscriptionStatus === 'basic' && (
                <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  BASIC
                </span>
              )}
              {subscriptionStatus === 'expired' && (
                <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  EXPIRED
                </span>
              )}
            </div>
          )}

          </div>

         
          {/* Right side - Navigation links and profile */}
          <div className="flex items-center">
            {/* Desktop navigation links */}
            <div className="hidden md:flex items-center space-x-4">
              {!user && !isDashboard && (
                <>
                  <Link
                    to="/#features"
                    className="text-gray-300 hover:text-white px-3 py-2"
                  >
                    Features
                  </Link>
                  <Link
                    to="/#resources"
                    className="text-gray-300 hover:text-white px-3 py-2"
                  >
                    Resources
                  </Link>
                  <Link
                    to="/#demo"
                    className="text-gray-300 hover:text-white px-3 py-2"
                  >
                    Try Demo
                  </Link>
                  <Link
                    to="/login"
                    className="text-gray-300 hover:text-white px-3 py-2"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Get Free Trial
                  </Link>
                </>
              )}
            </div>

            {/* Profile section - both mobile and desktop */}
            {user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 text-gray-300 hover:text-white focus:outline-none"
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="hidden md:inline text-sm font-medium">
                    {user.name}
                  </span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-50">
                    <div className="md:hidden px-4 py-2 border-b border-gray-700">
                      <span className="text-sm font-medium text-white">
                        {user.name}
                      </span>
                    </div>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button - only for non-authenticated users */}
            {!user && !isDashboard && (
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white focus:outline-none ml-2"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu - only for non-authenticated users */}
        {isMobileOpen && !user && !isDashboard && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              <Link
                to="/#features"
                className="text-gray-300 hover:text-white px-3 py-2"
                onClick={() => setIsMobileOpen(false)}
              >
                Features
              </Link>
              <Link
                to="/#resources"
                className="text-gray-300 hover:text-white px-3 py-2"
                onClick={() => setIsMobileOpen(false)}
              >
                Resources
              </Link>
              <Link
                to="/#demo"
                className="text-gray-300 hover:text-white px-3 py-2"
                onClick={() => setIsMobileOpen(false)}
              >
                Try Demo
              </Link>
              <Link
                to="/login"
                className="text-gray-300 hover:text-white px-3 py-2"
                onClick={() => setIsMobileOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-600 transition-colors mx-3"
                onClick={() => setIsMobileOpen(false)}
              >
                Get Free Trial
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

Navbar.propTypes = {
  isMobileOpen: PropTypes.bool.isRequired,
  setIsMobileOpen: PropTypes.func.isRequired,
};

export default Navbar;
