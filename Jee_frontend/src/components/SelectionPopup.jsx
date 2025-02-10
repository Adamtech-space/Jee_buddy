import PropTypes from 'prop-types';
import { useSelection } from '../hooks/useSelection';
import { useRef, useEffect } from 'react';
import { message } from 'antd';

const SelectionPopup = ({ onSaveToFlashCard, onAskAI, isMobile }) => {
  const {
    selectedText,
    selectionPosition,
    showPopup,
    clearSelection,
    setSelectionPosition,
    setShowPopup,
  } = useSelection();
  const popupRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setShowPopup(false);
        return;
      }

      const handleFinalSelection = () => {
        if (!isMounted.current) return;
        
        requestAnimationFrame(() => {
          try {
            const updatedSelection = window.getSelection();
            if (!updatedSelection || updatedSelection.rangeCount === 0 || updatedSelection.isCollapsed) {
              setShowPopup(false);
              return;
            }

            const range = updatedSelection.getRangeAt(0);
            if (!range.collapsed && range.toString().trim().length > 0) {
              const rect = range.getBoundingClientRect();
              
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;
              const popupWidth = 120;
              const popupHeight = 50;

              setSelectionPosition({
                x: Math.max(10, Math.min(rect.left + rect.width / 2, viewportWidth - popupWidth - 10)),
                y: Math.max(10, Math.min(
                  rect.bottom + window.scrollY + (isMobile ? 10 : 5),
                  viewportHeight + window.scrollY - popupHeight - 10
                ))
              });
              setShowPopup(true);
            } else {
              setShowPopup(false);
            }
          } catch  {
            setShowPopup(false);
          }
        });
      };

      if (isMobile) {
        const handleTouchEnd = (e) => {
          e.preventDefault();
          setTimeout(handleFinalSelection, 50);
        };
        
        document.addEventListener('touchend', handleTouchEnd, { 
          once: true,
          passive: false
        });
      } else {
        handleFinalSelection();
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
      isMounted.current = false;
    };
  }, [showPopup, isMobile, setShowPopup, setSelectionPosition]);

  useEffect(() => {
    if (!popupRef.current || !selectionPosition) return;

    const popup = popupRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupRect = popup.getBoundingClientRect();

    if (isMobile) {
      const bottomOffset = 100;
      popup.style.position = 'fixed';
      popup.style.left = '50%';
      popup.style.bottom = `${bottomOffset}px`;
      popup.style.transform = 'translateX(-50%)';
    } else {
      let top = selectionPosition.y - popupRect.height - 10;
      let left = selectionPosition.x - popupRect.width / 2;
      top = Math.max(10, Math.min(top, viewportHeight - popupRect.height - 10));
      left = Math.max(10, Math.min(left, viewportWidth - popupRect.width - 10));
      
      popup.style.top = `${top}px`;
      popup.style.left = `${left}px`;
    }
  }, [selectionPosition, isMobile]);

  if (!showPopup || !selectionPosition) return null;

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

  const handleCopy = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(selectedText);
      message.success('Copied to clipboard!');
      clearSelection();
    } catch{
      message.error('Failed to copy');
    }
  };

  const handlePaste = async (e) => {
    e.preventDefault();
    try {
      const text = await navigator.clipboard.readText();
      console.log('Pasted content:', text);
    } catch  {
      message.error('Failed to paste');
    }
  };

  return (
    <div
      ref={popupRef}
      className={`
        selection-popup fixed z-[99999] transition-all duration-200 ease-in-out
        ${isMobile ? 
          'flex flex-row gap-2 p-2 rounded-2xl bg-gray-900/95 backdrop-blur-lg border border-gray-700 shadow-xl' : 
          'flex flex-row gap-1.5 p-1.5 rounded-full bg-gray-900/90 backdrop-blur-sm border border-gray-700/50'
        }`}
      style={{
        pointerEvents: 'auto',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        opacity: showPopup ? 1 : 0,
        bottom: isMobile ? '100px' : 'auto',
        maxWidth: isMobile ? '90vw' : 'none'
      }}
    >
      <button
        onClick={handleCopy}
        className={`flex items-center justify-center p-2 ${
          isMobile ? 
            'text-sm bg-gray-800/50 hover:bg-gray-700 rounded-xl' : 
            'rounded-full hover:bg-gray-800'
        }`}
      >
        {isMobile ? '📋 Copy' : '📋'}
      </button>
      <button
        onClick={handleAIClick}
        className={`flex items-center justify-center p-2 ${
          isMobile ? 
            'text-sm bg-blue-600/90 hover:bg-blue-700 rounded-xl' : 
            'rounded-full hover:bg-blue-600/50'
        }`}
      >
        {isMobile ? '🤖 AI' : '🤖'}
      </button>
      <button
        onClick={handleSaveClick}
        className={`flex items-center justify-center p-2 ${
          isMobile ? 
            'text-sm bg-green-600/90 hover:bg-green-700 rounded-xl' : 
            'rounded-full hover:bg-green-600/50'
        }`}
      >
        {isMobile ? '💾 Save' : '💾'}
      </button>
      {isMobile && (
        <button
          onClick={handlePaste}
          className="flex items-center justify-center p-2 text-sm bg-gray-800/50 hover:bg-gray-700 rounded-xl"
        >
          📥 Paste
        </button>
      )}
    </div>
  );
};

SelectionPopup.propTypes = {
  onSaveToFlashCard: PropTypes.func.isRequired,
  onAskAI: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired
};

export default SelectionPopup;