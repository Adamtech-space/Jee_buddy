import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export const SelectionContext = createContext();

export const SelectionProvider = ({ children }) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const handleTextSelection = (e) => {
    // Don't handle selection if it's in an input or contenteditable element
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target.isContentEditable
    ) {
      return;
    }

    // Use requestAnimationFrame to wait for the selection to be complete
    requestAnimationFrame(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // For mobile, position the popup above the selection
        const isMobile = window.innerWidth < 768;
        const y = isMobile ? 
          rect.top + window.scrollY - 10 : // Position above selection on mobile
          rect.bottom + window.scrollY;    // Position below selection on desktop
        
        setSelectedText(text);
        setSelectionPosition({
          x: rect.x + rect.width / 2,
          y: y
        });
        setShowPopup(true);

        // On mobile, prevent the default selection menu
        if (isMobile && e.type === 'touchend') {
          e.preventDefault();
        }
      } else {
        setShowPopup(false);
      }
    });
  };

  // Handle touch selection specifically
  const handleTouchSelection = () => {
    // Wait a bit for the selection to be complete
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setSelectedText(text);
        setSelectionPosition({
          x: rect.x + rect.width / 2,
          y: rect.top + window.scrollY - 10 // Position above selection
        });
        setShowPopup(true);
      }
    }, 100);
  };

  const clearSelection = () => {
    setSelectedText('');
    setSelectionPosition(null);
    setShowPopup(false);
    window.getSelection()?.removeAllRanges();
  };

  // Add click/touch outside handler to close popup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showPopup && !e.target.closest('.selection-popup')) {
        clearSelection();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showPopup]);

  return (
    <SelectionContext.Provider value={{
      selectedText,
      setSelectedText,
      selectionPosition,
      setSelectionPosition,
      showPopup,
      setShowPopup,
      handleTextSelection,
      handleTouchSelection,
      clearSelection
    }}>
      {children}
    </SelectionContext.Provider>
  );
};

SelectionProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}; 