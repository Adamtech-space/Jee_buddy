import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const Navbar = ({ isMobileOpen, setIsMobileOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname.includes('/dashboard');

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
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </motion.svg>
              <span className="ml-2 text-xl font-bold text-white">JEE Buddy</span>
            </Link>
          </div>

          {/* Right side - Navigation links and profile */}
          <div className="hidden md:flex items-center space-x-4">
            {!isDashboard && (
              <>
                <Link to="/#features" className="text-gray-300 hover:text-white px-3 py-2">Features</Link>
                <Link to="/#resources" className="text-gray-300 hover:text-white px-3 py-2">Resources</Link>
                <Link to="/#demo" className="text-gray-300 hover:text-white px-3 py-2">Try Demo</Link>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Get Started
                </button>
              </>
            )}

            {isDashboard && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium">U</span>
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1">
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => navigate('/login')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button for landing page */}
          {!isDashboard && (
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Mobile menu for landing page */}
        {isMobileOpen && !isDashboard && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              <Link to="/#features" className="text-gray-300 hover:text-white px-3 py-2">Features</Link>
              <Link to="/#resources" className="text-gray-300 hover:text-white px-3 py-2">Resources</Link>
              <Link to="/#demo" className="text-gray-300 hover:text-white px-3 py-2">Try Demo</Link>
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-600 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

Navbar.propTypes = {
  isMobileOpen: PropTypes.bool.isRequired,
  setIsMobileOpen: PropTypes.func.isRequired
};

export default Navbar;