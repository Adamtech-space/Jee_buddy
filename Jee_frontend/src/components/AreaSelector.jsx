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
      className="fixed inset-0 cursor-crosshair bg-black/20"
      onMouseDown={handleMouseDown}
    >
      {/* Simple top instruction */}
      {showHint && !isSelecting && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="px-4 py-2 bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-lg">
            <p className="text-white/90 text-xs sm:text-sm font-medium whitespace-nowrap">
              Click and drag to select
            </p>
          </div>
        </div>
      )}

      {isSelecting && selectionStyle && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/10"
          style={selectionStyle}
        />
      )}
    </div>
  );
};

AreaSelector.propTypes = {
  onAreaSelected: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default AreaSelector;
