// Google Analytics utility functions
export const initGA = () => {
  // GA is already initialized in index.html
  if (!window.gtag) {
    console.warn('Google Analytics not loaded');
  }
};

export const logPageView = () => {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title
    });
  }
};

export const logEvent = (category, action, label) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label
    });
  }
};

export const logException = (description = '', fatal = false) => {
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description,
      fatal
    });
  }
};