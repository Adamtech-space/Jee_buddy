// Google Analytics utility functions
const GA_TRACKING_ID = 'G-95Y1Z3HJSF';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const isDevelopment = window.location.hostname === 'localhost';

const waitForGtag = () => new Promise((resolve) => {
  let retries = 0;
  
  const check = () => {
    if (typeof window.gtag === 'function') {
      console.log('✅ Google Analytics found');
      resolve(true);
      return;
    }
    
    if (retries < MAX_RETRIES) {
      retries++;
      setTimeout(check, RETRY_DELAY);
    } else {
      if (isDevelopment) {
        console.log('ℹ️ GA not loaded in development');
      } else {
        console.warn('⚠️ GA not loaded in production');
      }
      resolve(false);
    }
  };
  
  check();
});

export const initGA = async () => {
  try {
    const isAvailable = await waitForGtag();
    if (!isAvailable) {
      return false;
    }

    window.gtag('config', GA_TRACKING_ID, {
      send_page_view: true,
      cookie_domain: 'jeebuddy.in',
      cookie_flags: 'SameSite=None;Secure',
      transport_type: 'beacon',
      page_path: window.location.pathname
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
    if (!isAvailable) return;

    window.gtag('event', 'page_view', {
      page_location: window.location.origin + path,
      page_path: path,
      page_title: document.title,
      send_to: GA_TRACKING_ID
    });
  } catch (error) {
    console.warn('⚠️ Error logging page view:', error.message);
  }
};

export const logEvent = async (category, action, label = null) => {
  try {
    const isAvailable = await waitForGtag();
    if (!isAvailable) return;

    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      send_to: GA_TRACKING_ID,
      non_interaction: false
    });
  } catch (error) {
    console.warn('⚠️ Error logging event:', error.message);
  }
};

export const logException = async (description = '', fatal = false) => {
  try {
    const isAvailable = await waitForGtag();
    if (!isAvailable) return;

    window.gtag('event', 'exception', {
      description,
      fatal,
      send_to: GA_TRACKING_ID
    });
  } catch (error) {
    console.warn('⚠️ Error logging exception:', error.message);
  }
};