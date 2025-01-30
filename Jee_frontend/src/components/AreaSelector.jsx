import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const AreaSelector = ({ onAreaSelected, onCancel }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [showHint, setShowHint] = useState(true);

  const handleMouseDown = useCallback((e) => {
    // Only handle left mouse button
    if (e.button !== 0) return;

    const x = e.clientX;
    const y = e.clientY;
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsSelecting(true);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isSelecting) return;
      setCurrentPos({ x: e.clientX, y: e.clientY });
    },
    [isSelecting]
  );

  const handleMouseUp = useCallback(() => {
    if (!isSelecting) return;

    const rect = {
      x: Math.min(startPos.x, currentPos.x),
      y: Math.min(startPos.y, currentPos.y),
      width: Math.abs(currentPos.x - startPos.x),
      height: Math.abs(currentPos.y - startPos.y),
    };

    // Only trigger if area is large enough
    if (rect.width > 10 && rect.height > 10) {
      onAreaSelected(rect);
    }

    setIsSelecting(false);
  }, [isSelecting, startPos, currentPos, onAreaSelected]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setIsSelecting(false);
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleKeyDown, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isSelecting) {
      setShowHint(false);
    }
  }, [isSelecting]);

  const selectionStyle = isSelecting
    ? {
        left: Math.min(startPos.x, currentPos.x),
        top: Math.min(startPos.y, currentPos.y),
        width: Math.abs(currentPos.x - startPos.x),
        height: Math.abs(currentPos.y - startPos.y),
      }
    : null;

  return (
    <div
      className="fixed inset-0 cursor-crosshair"
      style={{
        backgroundColor: 'transparent',
        pointerEvents: 'all',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Hint */}
      {showHint && !isSelecting && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="px-4 py-2 bg-green-500 rounded-lg">
            <p className="text-white text-xs sm:text-sm font-medium whitespace-nowrap">
              Click and drag to select an area
            </p>
          </div>
        </div>
      )}

      {/* Selection Area */}
      {isSelecting && selectionStyle && (
        <div
          className="absolute"
          style={{
            ...selectionStyle,
            border: '2.5px solid #22c55e',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.2)',
            backgroundColor: 'transparent',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          {/* Selection handles */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-green-500 rounded-full" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-green-500 rounded-full" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-green-500 rounded-full" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-green-500 rounded-full" />

          {/* Size indicator */}
          <div
            className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded"
            style={{ whiteSpace: 'nowrap' }}
          >
            {Math.round(selectionStyle.width)} ×{' '}
            {Math.round(selectionStyle.height)}
          </div>
        </div>
      )}
    </div>
  );
};

AreaSelector.propTypes = {
  onAreaSelected: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default AreaSelector;
