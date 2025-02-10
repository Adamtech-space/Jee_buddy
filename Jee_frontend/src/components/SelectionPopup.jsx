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
  const [popupStyle, setPopupStyle] = useState({});

  // Hide popup if no text is selected.
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

  // Position the popup.
  useLayoutEffect(() => {
    if (!popupRef.current || !selectionPosition) return;
    requestAnimationFrame(() => {
      const popup = popupRef.current;
      if (!popup) return;
      const popupRect = popup.getBoundingClientRect();
      const top = Math.max(10, selectionPosition.y - popupRect.height - 5);
      const left = selectionPosition.x - popupRect.width / 2;
      setPopupStyle({ top: `${top}px`, left: `${left}px`, position: 'fixed' });
    });
  }, [selectionPosition]);

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

  if (!showPopup) return null;

  return (
    <div
      ref={popupRef}
      onContextMenu={(e) => e.preventDefault()} // disable native context menu
      className="custom-selection-popup"
      style={{
        ...popupStyle,
        opacity: showPopup ? 1 : 0,
        pointerEvents: showPopup ? 'auto' : 'none',
      }}
    >
      <button
        onClick={handleAIClick}
        onTouchEnd={handleAIClick}
        className="flex items-center justify-center p-2 rounded-lg bg-purple-600/90 hover:bg-purple-700 text-white"
      >
        🤖 Ask AI
      </button>
      <button
        onClick={handleSaveClick}
        onTouchEnd={handleSaveClick}
        className="flex items-center justify-center p-2 rounded-lg bg-green-600/90 hover:bg-green-700 text-white"
      >
        💾 Save
      </button>
    </div>
  );
};

SelectionPopup.propTypes = {
  onSaveToFlashCard: PropTypes.func.isRequired,
  onAskAI: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
};

export default SelectionPopup;