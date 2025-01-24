// Google Analytics utility functions
const GA_TRACKING_ID = 'G-95Y1Z3HJSF';
const MAX_RETRIES = 3;  // Reduced retries since GA is loaded earlier
const RETRY_DELAY = 1000; // Reduced delay to 1 second
const INITIAL_DELAY = 0; // No initial delay since GA is loaded in head

// Check if we're in development or production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const waitForGtag = () => new Promise((resolve) => {
  let retries = 0;
  
  const check = () => {
    if (typeof window.gtag === 'function') {
      console.log('✅ Google Analytics initialized');
      resolve(true);
      return;
    }
    
    if (retries < MAX_RETRIES) {
      retries++;
      console.log(`⏳ Checking GA availability (${retries}/${MAX_RETRIES})`);
      setTimeout(check, RETRY_DELAY);
    } else {
      const message = isDevelopment 
        ? '🔧 GA not loaded in development mode'
        : '⚠️ GA not initialized - please check your setup';
      console.warn(message);
      resolve(false);
    }
  };
  
  setTimeout(check, INITIAL_DELAY);
});

export const initGA = async () => {
  try {
    const isAvailable = await waitForGtag();
    if (!isAvailable && !isDevelopment) {
      return false;
    }

    // Development mode mock
    if (isDevelopment && !window.gtag) {
      window.gtag = (...args) => {
        console.log('🔧 GA Event (Dev):', ...args);
      };
      return true;
    }

    // GA is already initialized in index.html
    return true;
  } catch (error) {
    console.warn('⚠️ GA initialization error:', error.message);
    return false;
  }
};

export const testGAEvent = async () => {
  const isAvailable = await waitForGtag();
  if (!isAvailable) return false;
  
  try {
    window.gtag('event', 'test_event', {
      event_category: 'Testing',
      event_label: 'GA Test',
      debug_mode: true
    });
    console.log('✅ Test event sent to Google Analytics');
    return true;
  } catch (error) {
    console.error('🔴 Error sending test event:', error);
    return false;
  }
};

export const logPageView = async (path = window.location.pathname) => {
  try {
    const isAvailable = await waitForGtag();
    if (!isAvailable && !isDevelopment) return;

    const eventData = {
      page_location: window.location.origin + path,
      page_path: path,
      page_title: document.title,
      send_to: GA_TRACKING_ID
    };

    window.gtag('event', 'page_view', eventData);
    if (isDevelopment) {
      console.log('📝 Page View:', eventData);
    }
  } catch (error) {
    console.warn('⚠️ Error logging page view:', error.message);
  }
};

export const logEvent = async (category, action, label = null) => {
  try {
    const isAvailable = await waitForGtag();
    if (!isAvailable && !isDevelopment) return;

    const eventData = {
      event_category: category,
      event_label: label,
      send_to: GA_TRACKING_ID,
      non_interaction: false
    };

    window.gtag('event', action, eventData);
    if (isDevelopment) {
      console.log('📊 Event:', { action, ...eventData });
    }
  } catch (error) {
    console.warn('⚠️ Error logging event:', error.message);
  }
};

export const logException = async (description = '', fatal = false) => {
  try {
    const isAvailable = await waitForGtag();
    if (!isAvailable && !isDevelopment) return;

    const eventData = {
      description,
      fatal,
      send_to: GA_TRACKING_ID
    };

    window.gtag('event', 'exception', eventData);
    if (isDevelopment) {
      console.log('⚠️ Exception:', eventData);
    }
  } catch (error) {
    console.warn('⚠️ Error logging exception:', error.message);
  }
};