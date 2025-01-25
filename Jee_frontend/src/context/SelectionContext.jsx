import React, { createContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { processSelectedText } from '../hooks/useSelection';

export const SelectionContext = createContext();

export const SelectionProvider = ({ children }) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const handleTextSelection = useCallback((e, text) => {
    const selection = window.getSelection();
    const processedText =
      text || processSelectedText(selection.toString().trim());

    if (processedText && processedText.length > 0) {
      setSelectedText(processedText);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + window.scrollY,
      });
      setShowPopup(true);
    } else {
      clearSelection();
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedText('');
    setSelectionPosition(null);
    setShowPopup(false);
    window.getSelection()?.removeAllRanges();
  }, []);

  return (
    <SelectionContext.Provider
      value={{
        selectedText,
        selectionPosition,
        showPopup,
        handleTextSelection,
        clearSelection,
        setSelectionPosition,
        setShowPopup,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
};

SelectionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SelectionProvider;
