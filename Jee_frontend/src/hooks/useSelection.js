import { useContext } from 'react';
import { SelectionContext } from '../context/SelectionContext';

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}; 