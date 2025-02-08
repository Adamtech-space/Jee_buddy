import PropTypes from 'prop-types';
import { useSelection } from '../hooks/useSelection';
import { useRef, useEffect } from 'react';

const SelectionPopup = ({ onSaveToFlashCard, onAskAI, position, isMobile }) => {
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
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.isCollapsed) {
        if (showPopup) setShowPopup(false);
        return;
      }

      const handleFinalSelection = () => {
        requestAnimationFrame(() => {
          try {
            const updatedSelection = window.getSelection();
            if (!updatedSelection || updatedSelection.rangeCount === 0) return;
            
            const range = updatedSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            if (rect.width > 0 && rect.height > 0) {
              setSelectionPosition({
                x: rect.left + rect.width / 2,
                y: rect.bottom + window.scrollY + 5
              });
              setShowPopup(true);
            }
          } catch (err) {
            console.error('Selection error:', err);
            setShowPopup(false);
          }
        });
      };

      if (!isMobile) {
        const handleMouseUp = () => {
          handleFinalSelection();
          document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mouseup', handleMouseUp);
      } else {
        const handleTouchEnd = () => {
          setTimeout(handleFinalSelection, 300);
        };
        document.addEventListener('touchend', handleTouchEnd, { once: true });
      }
    };

    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowPopup(false);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showPopup, isMobile, setShowPopup, setSelectionPosition]);

  useEffect(() => {
    if (!popupRef.current || !selectionPosition) return;

    const popup = popupRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    popup.style.transform = 'translateZ(0)';
    popup.style.willChange = 'transform';

    if (isMobile) {
      popup.style.position = 'fixed';
      popup.style.left = 'auto';
      popup.style.right = '18px';
      popup.style.bottom = '75px';
      popup.style.top = 'auto';
    } else {
      const rect = popup.getBoundingClientRect();
      let top = selectionPosition.y - rect.height - 10;
      let left = selectionPosition.x - rect.width / 2;

      top = Math.max(10, Math.min(top, viewportHeight - rect.height - 10));
      left = Math.max(10, Math.min(left, viewportWidth - rect.width - 10));

      popup.style.top = `${top}px`;
      popup.style.left = `${left}px`;
      popup.style.transform = 'none';
    }
  }, [selectionPosition, isMobile]);

  if (!showPopup || !selectionPosition) return null;

  const handleAction = (action) => {
    if (!selectedText) {
      return;
    }

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
        ${isMobile 
          ? 'flex flex-col gap-2 w-auto touch-none' 
          : 'flex flex-row gap-1.5 p-1.5 rounded-full shadow-lg bg-gray-900/90 backdrop-blur-sm border border-gray-700/50'
        }
      `}
      style={{
        pointerEvents: 'auto',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        opacity: showPopup ? 1 : 0,
        transform: 'translateZ(0)',
        transition: 'opacity 0.15s ease-out, transform 0.15s ease-out'
      }}
    >
      <button
        onClick={handleAIClick}
        onTouchEnd={handleAIClick}
        className={`
          ${
            isMobile
              ? 'w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg flex items-center justify-center text-white'
              : 'flex items-center justify-center gap-1.5 px-4 py-1.5 bg-gray-800/50 hover:bg-gray-700 rounded-full text-sm text-white hover:shadow-md transition-all duration-200'
          }
        `}
      >
        {isMobile ? 'AI' : '🤖 Ask AI'}
      </button>
      <button
        onClick={handleSaveClick}
        onTouchEnd={handleSaveClick}
        className={`
          ${
            isMobile
              ? 'w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg flex items-center justify-center text-white'
              : 'flex items-center justify-center gap-1.5 px-4 py-1.5 bg-gray-800/50 hover:bg-gray-700 rounded-full text-sm text-white hover:shadow-md transition-all duration-200'
          }
        `}
      >
        {isMobile ? '💾' : '💾 Save'}
      </button>
    </div>
  );
};

SelectionPopup.propTypes = {
  onSaveToFlashCard: PropTypes.func.isRequired,
  onAskAI: PropTypes.func.isRequired,
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  isMobile: PropTypes.bool.isRequired
};

export default SelectionPopup;