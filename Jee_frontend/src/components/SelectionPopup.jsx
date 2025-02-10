import PropTypes from 'prop-types';
import { useSelection } from '../hooks/useSelection';
import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { SaveOutlined } from '@ant-design/icons';
import { message } from 'antd';


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

  // Modified effect to handle mobile selection
  useEffect(() => {
    const handleSelection = () => {
      // Use requestAnimationFrame to ensure selection is ready
      requestAnimationFrame(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount < 1 || selection.isCollapsed) {
          setShowPopup(false);
          return;
        }

        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Add safety check for valid dimensions
          if (rect.width === 0 && rect.height === 0) {
            setShowPopup(false);
            return;
          }

          const position = {
            x: rect.left + rect.width / 2 + window.scrollX,
            y: rect.top + window.scrollY
          };
          
          setSelectionPosition(position);
          setShowPopup(true);
        } catch (error) {
          console.log('Selection error:', error);
          setShowPopup(false);
        }
      });
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      // Add small delay for Android selection stability
      setTimeout(handleSelection, 50);
    };

    // Add context menu prevention for Android
    const preventContextMenu = (e) => {
      e.preventDefault();
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('contextmenu', preventContextMenu);
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

  if (!showPopup && !isMobile) return null;

  return isMobile ? (
    <div className="fixed bottom-32 right-4 z-[60]">
      <div className="flex flex-col gap-y-3 items-center">
        <button
          onClick={(e) => {
            e.preventDefault();
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (!selectedText) {
              message.warning('Please select some text first');
              return;
            }
            onAskAI(selectedText);
            setShowPopup(false);
          }}
          className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg shadow-lg transition-colors"
          title="Ask AI"
        >
          🤖
        </button>
        
        <button
          onClick={(e) => {
            e.preventDefault();
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (!selectedText) {
              message.warning('Please select some text first');
              return;
            }
            onSaveToFlashCard(selectedText);
            setShowPopup(false);
          }}
          className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg shadow-lg transition-colors"
          title="Save to Flashcards"
        >
          <SaveOutlined className="text-base text-green-400" />
        </button>
      </div>
    </div>
  ) : (
    <div
      ref={popupRef}
      className={`custom-selection-popup ${!showPopup ? 'opacity-0' : ''}`}
      style={{
        ...popupStyle,
        transform: `translate(-50%, ${isMobile ? '-125%' : '-120%'})`,
      }}
    >
      {/* Add selection arrow indicator */}
      <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-4 h-4">
        <div className="w-3 h-3 bg-gray-800 rotate-45 transform origin-center" />
      </div>

      <div className="flex items-center gap-3 px-2 py-1.5 bg-gray-800 rounded-lg shadow-lg">
        <button
          onClick={(e) => {
            e.preventDefault();
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (!selectedText) {
              message.warning('Please select some text first');
              return;
            }
            onAskAI(selectedText);
            setShowPopup(false);
          }}
          className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
          title="🤖Ask AI"
        >🤖Ask AI
        </button>
        

        <div className="h-5 w-px bg-gray-500" />

        <button
          onClick={(e) => {
            e.preventDefault();
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (!selectedText) {
              message.warning('Please select some text first');
              return;
            }
            onSaveToFlashCard(selectedText);
            setShowPopup(false);
          }}
          className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
          title="Save to Flashcards"
        >
          <SaveOutlined className="text-sm text-green-400" /> <span>save</span> 
        </button>
      </div>
    </div>
  );
};

SelectionPopup.propTypes = {
  onSaveToFlashCard: PropTypes.func.isRequired,
  onAskAI: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
};

export default SelectionPopup;