import PropTypes from 'prop-types';
import { SaveOutlined, RobotOutlined } from '@ant-design/icons';

const SelectionPopup = ({ selectedText, onSaveToFlashCard, onAskAI }) => (
  <div className="flex flex-col space-y-2 p-2">
    <div className="text-sm text-gray-500 mb-2 max-w-xs overflow-hidden text-ellipsis">
      {selectedText.length > 100 ? `${selectedText.substring(0, 100)}...` : selectedText}
    </div>
    <button
      onClick={onSaveToFlashCard}
      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      <SaveOutlined className="mr-2" />
      Save to Flash Cards
    </button>
    <button
      onClick={onAskAI}
      className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
    >
      <RobotOutlined className="mr-2" />
      Ask AI 
    </button>
  </div>
);

SelectionPopup.propTypes = {
  selectedText: PropTypes.string.isRequired,
  onSaveToFlashCard: PropTypes.func.isRequired,
  onAskAI: PropTypes.func.isRequired
};

export default SelectionPopup; 