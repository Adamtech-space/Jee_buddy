// Google Analytics utility functions
const GA_TRACKING_ID = 'G-95Y1Z3HJSF';
const MAX_RETRIES = 10;  // Increased retries
const RETRY_DELAY = 500; // Shorter intervals but more retries

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Check if GA script is loaded
const isGALoaded = () => {
  return window.gaLoaded === true && typeof window.gtag === 'function';
};

// Wait for GA to be available
const waitForGtag = () => new Promise((resolve) => {
  if (isGALoaded()) {
    console.log('✅ GA already initialized');
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
      console.log(`⏳ Waiting for GA (${retries}/${MAX_RETRIES})`);
      setTimeout(check, RETRY_DELAY);
    } else {
      console.warn(isDevelopment 
        ? '🔧 GA not loaded in development'
        : '⚠️ GA failed to initialize');
      resolve(false);
    }
  };

  check();
});

// Initialize GA
export const initGA = async () => {
  try {
    // In development, we can mock GA
    if (isDevelopment) {
      if (!window.gtag) {
        window.gtag = (...args) => {
          console.log('🔧 GA Event (Dev):', ...args);
        };
      }
      return true;
    }

    const isAvailable = await waitForGtag();
    if (!isAvailable) {
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
    console.warn('⚠️ Page view logging failed:', error.message);
  }
};

// Log custom event
export const logEvent = async (category, action, label = null) => {
  try {
    const isAvailable = await waitForGtag();
    if (!isAvailable && !isDevelopment) return;

    const eventData = {
      event_category: category,
      event_label: label,
      send_to: GA_TRACKING_ID,
      debug_mode: isDevelopment
    };

    window.gtag('event', action, eventData);
    if (isDevelopment) {
      console.log('📊 Event:', { action, ...eventData });
    }
  } catch (error) {
    console.warn('⚠️ Event logging failed:', error.message);
  }
};

// Log exception
export const logException = async (description = '', fatal = false) => {
  try {
    const isAvailable = await waitForGtag();
    if (!isAvailable && !isDevelopment) return;

    const eventData = {
      description,
      fatal,
      send_to: GA_TRACKING_ID,
      debug_mode: isDevelopment
    };

    window.gtag('event', 'exception', eventData);
    if (isDevelopment) {
      console.log('⚠️ Exception:', eventData);
    }
  } catch (error) {
    console.warn('⚠️ Exception logging failed:', error.message);
  }
};