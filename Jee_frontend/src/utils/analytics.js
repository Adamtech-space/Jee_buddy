// Google Analytics utility functions
const GA_TRACKING_ID = 'G-95Y1Z3HJSF';
const MAX_RETRIES = 3;  // Reduced retries for development
const RETRY_DELAY = 500; // Shorter delay

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Track if we've shown init message
let hasShownInitMessage = false;

// Development mode mock implementation
const mockGtag = (...args) => {
  if (isDevelopment) {
    // Only log events, not configuration calls
    if (args[0] === 'event') {
      console.log('📊 Dev Event:', args[1], args[2]);
    }
  }
  return true;
};

// Check if GA script is loaded
const isGALoaded = () => {
  if (isDevelopment) {
    return true;
  }
  return window.gaLoaded === true && typeof window.gtag === 'function';
};

// Wait for GA to be available
const waitForGtag = () => new Promise((resolve) => {
  // In development, resolve immediately with mock
  if (isDevelopment) {
    window.gtag = window.gtag || mockGtag;
    if (!hasShownInitMessage) {
      console.log('🔧 Using GA mock for development');
      hasShownInitMessage = true;
    }
    resolve(true);
    return;
  }

  // Production check
  if (isGALoaded()) {
    console.log('✅ GA initialized');
    resolve(true);
    return;
  }

  let retries = 0;
  const check = () => {
    if (isGALoaded()) {
      console.log('✅ GA initialized successfully');
      resolve(true);
      return;
    }

    if (retries < MAX_RETRIES) {
      retries++;
      console.log(`⏳ Checking GA availability (${retries}/${MAX_RETRIES})`);
      setTimeout(check, RETRY_DELAY);
    } else {
      console.warn('⚠️ GA failed to initialize in production');
      resolve(false);
    }
  };

  check();
});

// Initialize GA
export const initGA = async () => {
  try {
    const isAvailable = await waitForGtag();
    
    if (!isAvailable && !isDevelopment) {
      return false;
    }

    // Send initial pageview
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
      send_to: GA_TRACKING_ID
    });

    return true;
  } catch (error) {
    console.error('❌ GA initialization error:', error);
    return false;
  }
};

// Test GA connection
export const testGAEvent = async () => {
  try {
    const isAvailable = await waitForGtag();
    if (!isAvailable && !isDevelopment) return false;

    window.gtag('event', 'test_event', {
      event_category: 'Testing',
      event_label: 'GA Test',
      send_to: GA_TRACKING_ID,
      debug_mode: true
    });

    console.log('✅ Test event sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Test event failed:', error);
    return false;
  }
};

// Log page view
export const logPageView = async (path = window.location.pathname) => {
  try {
    await waitForGtag();

    const eventData = {
      page_location: window.location.origin + path,
      page_path: path,
      page_title: document.title,
      send_to: GA_TRACKING_ID
    };

    window.gtag('event', 'page_view', eventData);
  } catch (error) {
    console.warn('⚠️ Page view logging failed:', error.message);
  }
};

// Log custom event
export const logEvent = async (category, action, label = null) => {
  try {
    await waitForGtag();

    const eventData = {
      event_category: category,
      event_label: label,
      send_to: GA_TRACKING_ID
    };

    window.gtag('event', action, eventData);
  } catch (error) {
    console.warn('⚠️ Event logging failed:', error.message);
  }
};

// Log exception
export const logException = async (description = '', fatal = false) => {
  try {
    await waitForGtag();

    const eventData = {
      description,
      fatal,
      send_to: GA_TRACKING_ID
    };

    window.gtag('event', 'exception', eventData);
  } catch (error) {
    console.warn('⚠️ Exception logging failed:', error.message);
  }
};