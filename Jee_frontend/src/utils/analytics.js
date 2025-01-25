// Google Analytics utility functions
const GA_TRACKING_ID = 'G-95Y1Z3HJSF';
const MAX_RETRIES = 10;  // Increased retries
const RETRY_DELAY = 500; // Decreased delay for faster checking

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Track initialization status
let isInitialized = false;

// Development mode mock implementation
const mockGtag = (...args) => {
  if (isDevelopment) {
    console.log('📊 Dev Event:', ...args);
  }
  return true;
};

// Check if GA script is loaded
const isGALoaded = () => {
  if (isDevelopment) {
    return true;
  }
  
  return typeof window.gtag === 'function';
};

// Wait for GA to be available
const waitForGtag = () => new Promise((resolve) => {
  // In development, resolve immediately with mock
  if (isDevelopment) {
    window.gtag = window.gtag || mockGtag;
    console.log('🔧 Using GA mock for development');
    resolve(true);
    return;
  }

  // Check if already loaded
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
      console.warn('⚠️ GA initialization timeout - continuing without analytics');
      resolve(isDevelopment); // Resolve true in development, false in production
    }
  };

  // Start checking
  check();
});

// Initialize GA
export const initGA = async () => {
  // Prevent multiple initializations
  if (isInitialized) {
    return true;
  }

  try {
    const isAvailable = await waitForGtag();
    isInitialized = isAvailable;
    return isAvailable;
  } catch (error) {
    console.warn('⚠️ GA initialization error:', error);
    return isDevelopment;
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
  if (!isGALoaded() && !isDevelopment) {
    console.warn('⚠️ Skipping page view - GA not available');
    return;
  }

  try {
    const eventData = {
      page_location: window.location.origin + path,
      page_path: path,
      page_title: document.title,
      send_to: GA_TRACKING_ID
    };

    window.gtag('event', 'page_view', eventData);
  } catch (error) {
    console.warn('⚠️ Page view logging failed:', error);
  }
};

// Log custom event
export const logEvent = async (category, action, label = null) => {
  if (!isGALoaded() && !isDevelopment) {
    console.warn('⚠️ Skipping event - GA not available');
    return;
  }

  try {
    const eventData = {
      event_category: category,
      event_label: label,
      send_to: GA_TRACKING_ID
    };

    window.gtag('event', action, eventData);
  } catch (error) {
    console.warn('⚠️ Event logging failed:', error);
  }
};

// Log exception
export const logException = async (description = '', fatal = false) => {
  try {
    const isAvailable = await waitForGtag();
    if (!isAvailable && !isDevelopment) {
      console.warn('⚠️ Skipping exception - GA not available');
      return;
    }

    const eventData = {
      description,
      fatal,
      send_to: GA_TRACKING_ID
    };

    window.gtag('event', 'exception', eventData);
  } catch (error) {
    console.error('❌ Exception logging failed:', error);
  }
};