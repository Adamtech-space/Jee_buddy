import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const SelectionContext = createContext();

export const SelectionProvider = ({ children }) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const handleTextSelection = (e) => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(text);
      setSelectionPosition({
        x: rect.x + rect.width / 2,
        y: rect.y + window.scrollY
      });
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  };

  const clearSelection = () => {
    setSelectedText('');
    setSelectionPosition(null);
    setShowPopup(false);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <SelectionContext.Provider value={{
      selectedText,
      setSelectedText,
      selectionPosition,
      setSelectionPosition,
      showPopup,
      setShowPopup,
      handleTextSelection,
      clearSelection
    }}>
      {children}
    </SelectionContext.Provider>
  );
};

SelectionProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}; 