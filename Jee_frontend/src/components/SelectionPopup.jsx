import PropTypes from 'prop-types';
import { SaveOutlined, RobotOutlined } from '@ant-design/icons';
import { useSelection } from '../context/SelectionContext';

const SelectionPopup = ({ onSaveToFlashCard, onAskAI }) => {
  const { selectedText, selectionPosition, showPopup, clearSelection } = useSelection();

  if (!showPopup || !selectionPosition) return null;

  const handleAction = (action, text) => {
    action(text);
    clearSelection();
  };

  const getPopupStyle = () => {
    const margin = 20;
    const popupWidth = Math.min(300, window.innerWidth - 40); // Responsive width
    const popupHeight = 150;
    
    let x = selectionPosition.x;
    let y = selectionPosition.y;

    // Adjust horizontal position
    if (x + popupWidth/2 > window.innerWidth - margin) {
      x = window.innerWidth - popupWidth/2 - margin;
    }
    if (x - popupWidth/2 < margin) {
      x = popupWidth/2 + margin;
    }
    
    // Adjust vertical position
    if (y + popupHeight > window.innerHeight - margin) {
      y = y - popupHeight - 40; // Move above selection
    }

    return {
      top: `${y}px`,
      left: `${x}px`,
      transform: 'translateX(-50%)',
      width: `${popupWidth}px`,
      position: 'fixed',
      zIndex: 1000
    };
  };

  return (
    <div 
      className="fixed bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-800 selection-popup"
      style={getPopupStyle()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col space-y-2 p-2">
        <div className="text-sm text-gray-400 mb-1 max-w-xs overflow-hidden text-ellipsis">
          {selectedText.length > 100 ? `${selectedText.substring(0, 100)}...` : selectedText}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleAction(onSaveToFlashCard, selectedText)}
            className="flex-1 flex items-center justify-center px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            <SaveOutlined className="mr-2 text-xs" />
            Save
          </button>
          <button
            onClick={() => handleAction(onAskAI, selectedText)}
            className="flex-1 flex items-center justify-center px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
          >
            <RobotOutlined className="mr-2 text-xs" />
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );
};

SelectionPopup.propTypes = {
  onSaveToFlashCard: PropTypes.func.isRequired,
  onAskAI: PropTypes.func.isRequired
};

export default SelectionPopup; 