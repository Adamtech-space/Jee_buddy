import { useContext } from 'react';
import { SelectionContext } from '../context/SelectionContext';

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};

export const processSelectedText = (text) => {
  if (!text) return text;

  // Process fractions (e.g., "a/b" -> "\frac{a}{b}")
  text = text.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');

  // Process superscripts (e.g., "x^2" -> "x^{2}")
  text = text.replace(/\^(\d+)/g, '^{$1}');

  // Process subscripts (e.g., "x_1" -> "x_{1}")
  text = text.replace(/_(\d+)/g, '_{$1}');

  // Process square roots
  text = text.replace(/sqrt\((.*?)\)/g, '\\sqrt{$1}');

  return text;
}; 