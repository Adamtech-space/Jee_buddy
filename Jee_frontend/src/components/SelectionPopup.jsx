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
    const viewportWidth = window.innerWidth;

    // Mobile positioning (stacked vertically in bottom right)
    if (window.innerWidth <= 768) {
      popup.style.bottom = '100px'; // Position above chatbot button
      popup.style.right = '18px';
      popup.style.left = 'auto';
      popup.style.top = 'auto';
    } else {
      // Desktop positioning (original behavior)
      const rect = popup.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      let top = selectionPosition.y - rect.height - 10;
      let left = selectionPosition.x - (rect.width / 2);

      if (top < 0) top = selectionPosition.y + 10;
      if (left < 0) left = 0;
      if (left + rect.width > viewportWidth) {
        left = viewportWidth - rect.width - 10;
      }

      popup.style.top = `${top}px`;
      popup.style.left = `${left}px`;
    }
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
    
    if (sourceElement) {
      const nearestHeading = sourceElement.closest('h1, h2, h3, h4, h5, h6');
      if (nearestHeading) {
        source = `${nearestHeading.tagName}: ${nearestHeading.textContent}`;
      }
      else if (sourceElement.dataset.source) {
        source = sourceElement.dataset.source;
      }
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

    action(selectedText, source);
    clearSelection();
  };

  return (
    <div
      ref={popupRef}
      className={`
        selection-popup fixed z-[99999] transition-all duration-200 ease-in-out
        ${window.innerWidth <= 768 
          ? 'flex flex-col gap-2 right-10 w-auto '
          : 'flex flex-row gap-2 p-2 rounded-lg shadow-lg bg-gray-900 border border-gray-700'
        }
      `}
      style={{
        pointerEvents: 'auto'
      }}
    >
      <button
        onClick={() => handleAction(onAskAI)}
        className={`
          ${window.innerWidth <= 768
            ? 'w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg flex items-center justify-center text-white'
            : 'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-white'
          }
          transition-colors
        `}
      >
        {window.innerWidth <= 768 ? 'AI' : 'Ask AI'}
      </button>
      {window.innerWidth > 768 && <div className="w-px h-4 bg-gray-600 self-center"></div>}
      <button
        onClick={() => handleAction(onSaveToFlashCard)}
        className={`
          ${window.innerWidth <= 768
            ? 'w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg flex items-center justify-center text-white'
            : 'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-white'
          }
          transition-colors
        `}
      >
        {window.innerWidth <= 768 ? '💾' : 'Save to Flash Cards'}
      </button>
    </div>
  );
};

SelectionPopup.propTypes = {
  onSaveToFlashCard: PropTypes.func.isRequired,
  onAskAI: PropTypes.func.isRequired
};

export default SelectionPopup;