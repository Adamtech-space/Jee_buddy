import PropTypes from 'prop-types';
import { useSelection } from '../hooks/useSelection';
import { useRef, useEffect } from 'react';

const SelectionPopup = ({ onSaveToFlashCard, onAskAI }) => {
  const {
    selectedText,
    selectionPosition,
    showPopup,
    clearSelection,
    setSelectionPosition,
    setShowPopup,
  } = useSelection();
  const popupRef = useRef(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        // Immediately update position and show popup
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.bottom + window.scrollY,
        });
        setShowPopup(true);
      } else {
        setShowPopup(false);
      }
    };

    // Listen for all possible selection events
    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('touchend', handleSelection);
    document.addEventListener('mouseup', handleSelection);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('touchend', handleSelection);
      document.removeEventListener('mouseup', handleSelection);
    };
  }, []);

  useEffect(() => {
    if (!popupRef.current || !selectionPosition) return;

    const popup = popupRef.current;
    const viewportWidth = window.innerWidth;

    // Mobile positioning (stacked vertically in bottom right)
    if (window.innerWidth <= 768) {
      popup.style.bottom = '100px';
      popup.style.right = '18px';
      popup.style.left = 'auto';
      popup.style.top = 'auto';
    } else {
      // Desktop positioning - always show above selection
      const rect = popup.getBoundingClientRect();

      // Position above selection with increased offset
      const top = selectionPosition.y - rect.height - 24;

      // Center horizontally relative to selection
      let left = selectionPosition.x - rect.width / 2;

      // Keep popup within viewport bounds
      if (left < 10) left = 10;
      if (left + rect.width > viewportWidth - 10) {
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
      } else if (sourceElement.dataset.source) {
        source = sourceElement.dataset.source;
      } else {
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

  const handleAIClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      setShowPopup(false);
      onAskAI(selectedText);
    }
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      setShowPopup(false);
      onSaveToFlashCard(selectedText);
    }
  };

  return (
    <div
      ref={popupRef}
      className={`
        selection-popup fixed z-[99999] transition-all duration-200 ease-in-out
        ${
          window.innerWidth <= 768
            ? 'flex flex-col gap-2 right-10 w-auto touch-none'
            : 'flex flex-row gap-1.5 p-1.5 rounded-full shadow-lg bg-gray-900/90 backdrop-blur-sm border border-gray-700/50'
        }
      `}
      style={{
        pointerEvents: 'auto',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <button
        onClick={handleAIClick}
        onTouchEnd={handleAIClick}
        className={`
          ${
            window.innerWidth <= 768
              ? 'w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg flex items-center justify-center text-white'
              : 'flex items-center justify-center gap-1.5 px-4 py-1.5 bg-gray-800/50 hover:bg-gray-700 rounded-full text-sm text-white hover:shadow-md transition-all duration-200'
          }
        `}
      >
        {window.innerWidth <= 768 ? 'AI' : '🤖 Ask AI'}
      </button>
      <button
        onClick={handleSaveClick}
        onTouchEnd={handleSaveClick}
        className={`
          ${
            window.innerWidth <= 768
              ? 'w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg flex items-center justify-center text-white'
              : 'flex items-center justify-center gap-1.5 px-4 py-1.5 bg-gray-800/50 hover:bg-gray-700 rounded-full text-sm text-white hover:shadow-md transition-all duration-200'
          }
        `}
      >
        {window.innerWidth <= 768 ? '💾' : '💾 Save'}
      </button>
    </div>
  );
};

SelectionPopup.propTypes = {
  onSaveToFlashCard: PropTypes.func.isRequired,
  onAskAI: PropTypes.func.isRequired
};

export default SelectionPopup;