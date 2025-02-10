import PropTypes from 'prop-types';
import { useSelection } from '../hooks/useSelection';
import { useRef, useLayoutEffect, useState, useEffect } from 'react';

const SelectionPopup = ({ onSaveToFlashCard, onAskAI, isMobile }) => {
  const {
    selectedText,
    selectionPosition,
    showPopup,

    setSelectionPosition,
    setShowPopup,
  } = useSelection();
  const popupRef = useRef(null);
  // State to store computed popup style:
  // - On desktop, it's based on the selection's coordinates.
  // - On mobile, it's fixed above the chat icon.
  const [popupStyle, setPopupStyle] = useState({});

  // Automatically hide the popup if no text is selected.
  useEffect(() => {
    const handleSelectionChange = () => {
      const text = window.getSelection()?.toString();
      if (!text || text.trim() === '') {
        setShowPopup(false);
        setSelectionPosition(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [setShowPopup, setSelectionPosition]);

  // For desktop: update the position based on the selected text.


  // Position the popup:
  useLayoutEffect(() => {
    if (isMobile) {
      // Mobile: fix the popup above the chat icon—vertically stacked.
      setPopupStyle({
        bottom: '90px', // Adjust this value as needed.
        right: '10px',
        left: 'auto',
        transform: 'none',
      });
    } else {
      // Desktop: position based on selectionPosition.
      if (!popupRef.current || !selectionPosition) return;
      requestAnimationFrame(() => {
        const popup = popupRef.current;
        if (!popup) return;
        const popupRect = popup.getBoundingClientRect();
        if (popupRect.width === 0 || popupRect.height === 0) return;
        // Calculate the top so that the popup appears 5px above the selection.
        const top = Math.max(10, selectionPosition.y - popupRect.height - 5);
        const left = selectionPosition.x - popupRect.width / 2;
        setPopupStyle({ top: `${top}px`, left: `${left}px` });
      });
    }
  }, [selectionPosition, isMobile]);

  // Button click handlers.
  const handleAIClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = window.getSelection()?.toString();
    if (text) {
      setShowPopup(false);
      onAskAI(text);
    }
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = window.getSelection()?.toString();
    if (text) {
      setShowPopup(false);
      onSaveToFlashCard(text);
    }
  };

  // Render the popup only when text is selected.
  if ((isMobile && !selectedText) || (!isMobile && !selectionPosition)) return null;
  if (!showPopup) return null;

  return (
    <div
      ref={popupRef}
      className={`selection-popup fixed z-[99999] transition-opacity duration-150 ${
        isMobile
          ? // Mobile: Fixed above the chat icon, vertically stacked.
            'flex flex-col gap-3 p-2 backdrop-blur rounded-xl shadow-xl border'
          : // Desktop: Positioned above the selected text with horizontal buttons.
            'flex flex-row gap-2 p-1.5 rounded-md shadow-lg bg-gray-900/90 backdrop-blur-sm border border-gray-700/50'
      }`}
      style={{
        ...popupStyle,
        opacity: showPopup ? 1 : 0,
        pointerEvents: showPopup ? 'auto' : 'none',
        transition: 'opacity 0.15s ease-out',
      }}
    >
      {isMobile ? (
        <>
          <button
            onClick={handleAIClick}
            onTouchEnd={handleAIClick}
            className="flex items-center justify-center p-2 rounded-lg bg-purple-600/90 hover:bg-purple-700 text-white"
          >
            🤖
          </button>
          <button
            onClick={handleSaveClick}
            onTouchEnd={handleSaveClick}
            className="flex items-center justify-center p-2 rounded-lg bg-green-600/90 hover:bg-green-700 text-white"
          >
            💾
          </button>
        </>
      ) : (
        <>
          <button
            onClick={handleSaveClick}
            onTouchEnd={handleSaveClick}
            className="flex items-center justify-center px-3 py-1.5 text-sm hover:bg-green-600/30 rounded-md text-white"
          >
            💾 Save
          </button>
          <button
            onClick={handleAIClick}
            onTouchEnd={handleAIClick}
            className="flex items-center justify-center px-3 py-1.5 text-sm hover:bg-purple-600/30 rounded-md text-white"
          >
            🤖 Ask AI
          </button>
        </>
      )}
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
  isMobile: PropTypes.bool.isRequired,
};

export default SelectionPopup;