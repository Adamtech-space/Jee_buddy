import PropTypes from 'prop-types';
import { useSelection } from '../hooks/useSelection';

const SelectionPopup = ({ onSaveToFlashCard, onAskAI }) => {
  const { selectedText, selectionPosition, showPopup, clearSelection } = useSelection();

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

  const getPopupStyle = () => {
    const margin = 8;
    const popupHeight = 40;
    
    let x = selectionPosition.x;
    let y = selectionPosition.y - popupHeight - margin;

    // Ensure popup stays within screen bounds
    if (x < margin) x = margin;
    if (x > window.innerWidth - margin) x = window.innerWidth - margin;
    if (y < margin) y = margin;
    if (y > window.innerHeight - margin - popupHeight) {
      y = selectionPosition.y + margin; // Show below if not enough space above
    }

    return {
      top: `${y}px`,
      left: `${x}px`,
      transform: 'translateX(-50%)',
      position: 'fixed',
      zIndex: 1000
    };
  };

  return (
    <div 
      className="selection-popup fixed flex items-center gap-1 bg-gray-800/95 backdrop-blur-md rounded-lg shadow-lg px-1.5 py-1.5"
      style={getPopupStyle()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => handleAction(onAskAI)}
        className="text-sm text-white hover:bg-gray-700/50 px-3 py-1 rounded-md transition-colors"
      >
        Ask AI
      </button>
      <div className="w-px h-4 bg-gray-600"></div>
      <button
        onClick={() => handleAction(onSaveToFlashCard)}
        className="text-sm text-white hover:bg-gray-700/50 px-3 py-1 rounded-md transition-colors"
      >
        Save
      </button>
    </div>
  );
};

SelectionPopup.propTypes = {
  onSaveToFlashCard: PropTypes.func.isRequired,
  onAskAI: PropTypes.func.isRequired
};

export default SelectionPopup; 