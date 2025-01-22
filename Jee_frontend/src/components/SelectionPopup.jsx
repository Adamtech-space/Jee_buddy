import PropTypes from 'prop-types';
import { useSelection } from '../hooks/useSelection';
import { useRef, useEffect } from 'react';

const SelectionPopup = ({ onSaveToFlashCard, onAskAI }) => {
  const { selectedText, selectionPosition, showPopup, clearSelection } = useSelection();
  const popupRef = useRef(null);

  useEffect(() => {
    // Prevent default selection behavior on mobile
    const preventDefaultSelection = (e) => {
      if (window.innerWidth <= 768) {  // mobile breakpoint
        e.preventDefault();
      }
    };

    document.addEventListener('selectionchange', preventDefaultSelection);
    return () => {
      document.removeEventListener('selectionchange', preventDefaultSelection);
    };
  }, []);

  useEffect(() => {
    if (!popupRef.current || !selectionPosition) return;

    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Calculate position for mobile
    let top = selectionPosition.y - rect.height - 10;
    let left = selectionPosition.x - (rect.width / 2);

    // Handle mobile viewport constraints
    if (window.innerWidth <= 768) {
      // Center horizontally on mobile
      left = (viewportWidth - rect.width) / 2;
      
      // Position from bottom on mobile
      top = viewportHeight - rect.height - 20;
    } else {
      // Desktop position adjustments
      if (top < 0) top = selectionPosition.y + 10;
      if (left < 0) left = 0;
      if (left + rect.width > viewportWidth) {
        left = viewportWidth - rect.width - 10;
      }
    }

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
  }, [selectionPosition]);

  if (!showPopup || !selectionPosition) return null;

  const handleAction = (action) => {
    if (!selectedText) {
      console.log('SelectionPopup - No text selected');
      return;
    }

    // Get the source element's information
    const selection = window.getSelection();
    const sourceElement = selection?.focusNode?.parentElement;
    let source = 'Selected Text';
    
    console.log('SelectionPopup - Selected text:', selectedText);
    console.log('SelectionPopup - Source element:', sourceElement);
    
    // Try to get a meaningful source description
    if (sourceElement) {
      // Check for headings
      const nearestHeading = sourceElement.closest('h1, h2, h3, h4, h5, h6');
      if (nearestHeading) {
        source = `${nearestHeading.tagName}: ${nearestHeading.textContent}`;
      }
      // Check for specific elements with data attributes
      else if (sourceElement.dataset.source) {
        source = sourceElement.dataset.source;
      }
      // Check for parent elements that might indicate context
      else {
        const article = sourceElement.closest('article');
        const section = sourceElement.closest('section');
        if (article?.dataset.title) {
          source = article.dataset.title;
        } else if (section?.dataset.title) {
          source = section.dataset.title;
        }
      }
    }

    console.log('SelectionPopup - Calling action with:', { text: selectedText, source });
    action(selectedText, source);
    clearSelection();
  };

  return (
    <div
      ref={popupRef}
      className={`
        fixed flex gap-2 p-2 rounded-lg shadow-lg bg-gray-900 border border-gray-700
        transition-all duration-200 ease-in-out
        ${window.innerWidth <= 768 ? 'w-[95%] mx-auto bottom-4 left-0 right-0' : ''}
      `}
      style={{
        zIndex: 99999, // Ensure it's above everything
      }}
    >
      <button
        onClick={() => handleAction(onAskAI)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-white transition-colors"
      >
        Ask AI
      </button>
      <div className="w-px h-4 bg-gray-600"></div>
      <button
        onClick={() => handleAction(onSaveToFlashCard)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-white transition-colors"
      >
        Save to Flash Cards
      </button>
    </div>
  );
};

SelectionPopup.propTypes = {
  onSaveToFlashCard: PropTypes.func.isRequired,
  onAskAI: PropTypes.func.isRequired
};

export default SelectionPopup; 