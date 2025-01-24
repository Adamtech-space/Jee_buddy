// Google Analytics utility functions
const MAX_RETRIES = 10;
const RETRY_DELAY = 500; // 500ms

const waitForGtag = () => new Promise((resolve) => {
  let retries = 0;
  
  const check = () => {
    if (typeof window.gtag === 'function') {
      console.log('✅ Google Analytics found');
      resolve(true);
    } else if (retries < MAX_RETRIES) {
      retries++;
      console.log(`⏳ Waiting for GA... (${retries}/${MAX_RETRIES})`);
      setTimeout(check, RETRY_DELAY);
    } else {
      console.error('🔴 Google Analytics not loaded after multiple retries');
      resolve(false);
    }
  };
  
  check();
});

export const initGA = async () => {
  const isAvailable = await waitForGtag();
  if (!isAvailable) return false;
  
  try {
    window.gtag('js', new Date());
    window.gtag('config', 'G-95Y1Z3HJSF', {
      page_path: window.location.pathname,
      debug_mode: true
    });
    console.log('✅ Google Analytics initialized');
    return true;
  } catch (error) {
    console.error('🔴 Error initializing GA:', error);
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

export const logPageView = async () => {
  const isAvailable = await waitForGtag();
  if (!isAvailable) return;

  try {
    const pageData = {
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
      debug_mode: true
    };
    window.gtag('event', 'page_view', pageData);
    console.log('📝 Page view logged:', pageData);
  } catch (error) {
    console.error('🔴 Error logging page view:', error);
  }
};

export const logEvent = async (category, action, label) => {
  const isAvailable = await waitForGtag();
  if (!isAvailable) return;

  try {
    const eventData = {
      event_category: category,
      event_label: label,
      debug_mode: true
    };
    window.gtag('event', action, eventData);
    console.log('📊 Event logged:', { category, action, label });
  } catch (error) {
    console.error('🔴 Error logging event:', error);
  }
};

export const logException = async (description = '', fatal = false) => {
  const isAvailable = await waitForGtag();
  if (!isAvailable) return;

  try {
    const exceptionData = {
      description,
      fatal,
      debug_mode: true
    };
    window.gtag('event', 'exception', exceptionData);
    console.log('⚠️ Exception logged:', exceptionData);
  } catch (error) {
    console.error('🔴 Error logging exception:', error);
  }
};