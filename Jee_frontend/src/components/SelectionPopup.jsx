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
  const selectionTimeoutRef = useRef(null);
  const selectionStartRef = useRef(null);

  useEffect(() => {
    const handleSelectionStart = (e) => {
      // Store the initial selection point
      selectionStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        target: e.target,
      };
    };

    const handleSelectionChange = () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
      setShowPopup(false);
    };

    const handleSelectionEnd = (e) => {
      // Prevent handling if the event target is a button or input
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
        return;
      }

      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }

      selectionTimeoutRef.current = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 0) {
          // Get the selection range and its bounding client rect
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Check if the selection is within reasonable bounds
          const endPoint = {
            x: e.clientX,
            y: e.clientY,
          };

          const startPoint = selectionStartRef.current;

          // If we have both start and end points, validate the selection
          if (startPoint) {
            // Calculate the direct distance of selection
            const distance = Math.sqrt(
              Math.pow(endPoint.x - startPoint.x, 2) +
                Math.pow(endPoint.y - startPoint.y, 2)
            );

            // Calculate the text length per pixel ratio
            const textLengthPerPixel = selectedText.length / distance;

            // If the ratio is too high, it means too much text was selected for the distance moved
            // Adjust these values based on your needs
            const MAX_TEXT_LENGTH_PER_PIXEL = 2;

            if (textLengthPerPixel > MAX_TEXT_LENGTH_PER_PIXEL) {
              // Try to adjust the selection to be more reasonable
              try {
                const newRange = document.createRange();
                const startNode =
                  startPoint.target.firstChild || startPoint.target;
                const endNode = e.target.firstChild || e.target;

                newRange.setStart(startNode, 0);
                newRange.setEnd(endNode, endNode.length || 0);

                selection.removeAllRanges();
                selection.addRange(newRange);

                // Update rect with new selection
                const newRect = newRange.getBoundingClientRect();
                setSelectionPosition({
                  x: newRect.left + newRect.width / 2,
                  y: newRect.bottom + window.scrollY,
                });
              } catch (err) {
                // If adjustment fails, just use original selection
                setSelectionPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.bottom + window.scrollY,
                });
              }
            } else {
              // Selection seems reasonable, use it as is
              setSelectionPosition({
                x: rect.left + rect.width / 2,
                y: rect.bottom + window.scrollY,
              });
            }
          } else {
            // No start point recorded, use selection as is
            setSelectionPosition({
              x: rect.left + rect.width / 2,
              y: rect.bottom + window.scrollY,
            });
          }
          setShowPopup(true);
        } else {
          setShowPopup(false);
        }
      }, 150);
    };

    // Handle click outside selection
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowPopup(false);
        clearSelection();
      }
    };

    // Listen for selection events
    document.addEventListener('mousedown', handleSelectionStart);
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('touchstart', handleSelectionStart);
    document.addEventListener('touchend', handleSelectionEnd);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleSelectionStart);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionEnd);
      document.removeEventListener('touchstart', handleSelectionStart);
      document.removeEventListener('touchend', handleSelectionEnd);
      document.removeEventListener('click', handleClickOutside);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
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