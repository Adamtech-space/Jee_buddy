// Google Analytics utility functions
const GA_TRACKING_ID = 'G-95Y1Z3HJSF';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Check if we're in development or production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const domain = isDevelopment ? 'localhost' : 'jeebuddy.in';

const waitForGtag = () => new Promise((resolve) => {
  let retries = 0;
  
  const check = () => {
    // In development, we'll simulate GA being available
    if (isDevelopment) {
      console.log('🔧 GA simulation in development mode');
      window.gtag = window.gtag || function(...args) {
        console.log('GA Event (Dev):', ...args);
      };
      resolve(true);
      return;
    }

    if (typeof window.gtag === 'function') {
      console.log('✅ Google Analytics initialized');
      resolve(true);
      return;
    }
    
    if (retries < MAX_RETRIES) {
      retries++;
      setTimeout(check, RETRY_DELAY);
    } else {
      console.warn('⚠️ GA not loaded in production - please check your setup');
      resolve(false);
    }
  };
  
  // Start checking immediately
  check();
});

export const initGA = async () => {
  try {
    const isAvailable = await waitForGtag();
    if (!isAvailable && !isDevelopment) {
      return false;
    }

    window.gtag('config', GA_TRACKING_ID, {
      send_page_view: true,
      cookie_domain: domain,
      cookie_flags: 'SameSite=None;Secure',
      transport_type: 'beacon',
      page_path: window.location.pathname,
      debug_mode: isDevelopment
    });

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
      console.log('📝 Page View (Dev):', eventData);
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
      console.log('📊 Event (Dev):', { action, ...eventData });
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
      console.log('⚠️ Exception (Dev):', eventData);
    }
  } catch (error) {
    console.warn('⚠️ Error logging exception:', error.message);
  }
};