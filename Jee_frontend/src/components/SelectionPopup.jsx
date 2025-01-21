import PropTypes from 'prop-types';
import { SaveOutlined, RobotOutlined } from '@ant-design/icons';
import { useSelection } from '../context/SelectionContext';

const SelectionPopup = ({ onSaveToFlashCard, onAskAI }) => {
  const { selectedText, selectionPosition, showPopup, clearSelection } = useSelection();

  if (!showPopup || !selectionPosition) return null;

  const handleAction = (action) => {
    action(selectedText);
    clearSelection();
  };

  // Calculate position to keep popup within viewport
  const getPopupStyle = () => {
    const margin = 20; // Margin from edges
    const popupWidth = 300; // Approximate popup width
    const popupHeight = 150; // Approximate popup height
    
    let x = selectionPosition.x;
    let y = selectionPosition.y + margin;

    // Adjust horizontal position if too close to right edge
    if (x + popupWidth/2 > window.innerWidth - margin) {
      x = window.innerWidth - popupWidth/2 - margin;
    }
    // Adjust horizontal position if too close to left edge
    if (x - popupWidth/2 < margin) {
      x = popupWidth/2 + margin;
    }
    
    // Adjust vertical position if too close to bottom edge
    if (y + popupHeight > window.innerHeight - margin) {
      y = selectionPosition.y - popupHeight - margin;
    }

    return {
      top: `${y}px`,
      left: `${x}px`,
      transform: 'translateX(-50%)',
      maxWidth: `${popupWidth}px`
    };
  };

  return (
    <div 
      className="fixed z-[100] bg-gray-900 rounded-lg shadow-xl border border-gray-800"
      style={getPopupStyle()}
    >
      <div className="flex flex-col space-y-2 p-2">
        <div className="text-sm text-gray-500 mb-2 max-w-xs overflow-hidden text-ellipsis">
          {selectedText.length > 100 ? `${selectedText.substring(0, 100)}...` : selectedText}
        </div>
        <button
          onClick={() => handleAction(onSaveToFlashCard)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <SaveOutlined className="mr-2" />
          Save to Flash Cards
        </button>
        <button
          onClick={() => handleAction(onAskAI)}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          <RobotOutlined className="mr-2" />
          Ask AI 
        </button>
      </div>
    </div>
  );
};

SelectionPopup.propTypes = {
  onSaveToFlashCard: PropTypes.func.isRequired,
  onAskAI: PropTypes.func.isRequired
};

export default SelectionPopup; 