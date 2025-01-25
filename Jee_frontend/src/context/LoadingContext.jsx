import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AuthLoader from '../components/AuthLoader';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  // Initialize states with synchronous checks
  const [isLoading, setIsLoading] = useState(false); // Start with no loading
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const tokens = localStorage.getItem('tokens');
    const user = localStorage.getItem('user');
    return Boolean(tokens && user);
  });

  const updateAuth = (status) => {
    setIsAuthenticated(status);
    // Add a small delay before removing loader to ensure smooth transition
    setTimeout(() => setIsLoading(false), 300);
  };

  // Handle navigation loading
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      // Add a small delay before enabling scroll to ensure smooth transition
      setTimeout(() => {
        document.body.style.overflow = 'unset';
      }, 300);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLoading]);

  return (
    <LoadingContext.Provider value={{ 
      isLoading, 
      setIsLoading, 
      isAuthenticated, 
      setIsAuthenticated: updateAuth 
    }}>
      {children}
      {isLoading && <AuthLoader />}
    </LoadingContext.Provider>
  );
};

LoadingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useLoading = () => useContext(LoadingContext);
