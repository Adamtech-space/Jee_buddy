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
  // - For desktop, it's based on the selected text's bounding rect.
  // - For mobile, it's fixed to the right side with a specified offset.
  const [popupStyle, setPopupStyle] = useState({});

  // Hide the popup if no text is selected.
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

  // // For desktop: update position based on the selected text.
  // const handleFinalSelection = () => {
  //   if (isMobile) return; // Mobile uses fixed positioning.
  //   requestAnimationFrame(() => {
  //     try {
  //       const selection = window.getSelection();
  //       if (!selection || selection.rangeCount === 0) return;
  //       const range = selection.getRangeAt(0);
  //       const rect = range.getBoundingClientRect();
  //       if (rect.width > 0 && rect.height > 0) {
  //         setSelectionPosition({
  //           x: rect.left + rect.width / 2,
  //           y: rect.top - 10, // 10px above the selection.
  //         });
  //         setShowPopup(true);
  //       }
  //     } catch (err) {
  //       console.error('Selection error:', err);
  //       setShowPopup(false);
  //     }
  //   });
  // };

  // Position the popup.
  useLayoutEffect(() => {
    if (isMobile) {
      // Mobile: fixed positioning on the right side.
      setPopupStyle({
        bottom: '90px',
        right: '22px',
        left: 'auto',
        transform: 'none',
        position: 'fixed',
      });
    } else {
      // Desktop: position relative to the selected text.
      if (!popupRef.current || !selectionPosition) return;
      requestAnimationFrame(() => {
        const popup = popupRef.current;
        if (!popup) return;
        const popupRect = popup.getBoundingClientRect();
        const top = Math.max(10, selectionPosition.y - popupRect.height - 5);
        const left = selectionPosition.x - popupRect.width / 2;
        setPopupStyle({ top: `${top}px`, left: `${left}px`, position: 'fixed' });
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
      // Disable the native context menu for text (copy/paste etc.)
      onContextMenu={(e) => e.preventDefault()}
      className={`selection-popup fixed z-[99999] transition-opacity duration-150 ${
        isMobile
          ? 'flex flex-col gap-3 p-2 rounded-lg backdrop-blur-sm border'
          : 'flex flex-row gap-2 p-1.5 rounded-md shadow-lg bg-gray-900/90 backdrop-blur-sm border border-gray-700/50'
      }`}
      style={{
        ...popupStyle,
        opacity: showPopup ? 1 : 0,
        pointerEvents: showPopup ? 'auto' : 'none',
        transition: 'opacity 0.15s ease-out',
        WebkitTouchCallout: 'none', // Disables native touch callout.
        msTouchAction: 'none',
        touchAction: 'none',
      }}
    >
      {isMobile ? (
        // Mobile: Display both the Ask AI and Save buttons, stacked vertically.
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