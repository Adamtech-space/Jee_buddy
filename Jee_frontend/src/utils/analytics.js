// Google Analytics utility functions
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; // 1 second

const waitForGtag = () => new Promise((resolve) => {
  let retries = 0;
  
  const check = () => {
    if (window.gtag) {
      resolve(true);
    } else if (retries < MAX_RETRIES) {
      retries++;
      setTimeout(check, RETRY_DELAY);
    } else {
      resolve(false);
    }
  };
  
  check();
});

export const initGA = async () => {
  const isAvailable = await waitForGtag();
  if (!isAvailable) {
    console.error('🔴 Google Analytics not loaded after multiple retries');
    return false;
  }
  console.log('✅ Google Analytics initialized');
  return true;
};

export const testGAEvent = async () => {
  const isAvailable = await waitForGtag();
  if (!isAvailable) {
    console.error('🔴 Google Analytics not loaded - Cannot send test event');
    return false;
  }
  
  window.gtag('event', 'test_event', {
    event_category: 'Testing',
    event_label: 'GA Test',
    debug_mode: true
  });
  console.log('✅ Test event sent to Google Analytics');
  return true;
};

export const logPageView = async () => {
  const isAvailable = await waitForGtag();
  if (!isAvailable) return;

  const pageData = {
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
    debug_mode: true
  };
  window.gtag('event', 'page_view', pageData);
  console.log('📝 Page view logged:', pageData);
};

export const logEvent = async (category, action, label) => {
  const isAvailable = await waitForGtag();
  if (!isAvailable) return;

  const eventData = {
    event_category: category,
    event_label: label,
    debug_mode: true
  };
  window.gtag('event', action, eventData);
  console.log('📊 Event logged:', { category, action, label });
};

export const logException = async (description = '', fatal = false) => {
  const isAvailable = await waitForGtag();
  if (!isAvailable) return;

  const exceptionData = {
    description,
    fatal,
    debug_mode: true
  };
  window.gtag('event', 'exception', exceptionData);
  console.log('⚠️ Exception logged:', exceptionData);
};