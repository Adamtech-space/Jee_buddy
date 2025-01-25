import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const AreaSelector = ({ onAreaSelected, onCancel }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);

  const getPosition = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  };

  const handleStart = useCallback((e) => {
    // Only handle left mouse button or touch
    if (e.type === 'mousedown' && e.button !== 0) return;
    e.preventDefault();

    const pos = getPosition(e);
    setStartPos(pos);
    setCurrentPos(pos);
    setIsSelecting(true);
    setShowMagnifier(true);
  }, []);

  const handleMove = useCallback(
    (e) => {
      if (!isSelecting) return;
      e.preventDefault();

      const pos = getPosition(e);
      setCurrentPos(pos);
    },
    [isSelecting]
  );

  const handleEnd = useCallback(
    (e) => {
      if (!isSelecting) return;
      e.preventDefault();

      setIsSelecting(false);
      setShowMagnifier(false);

      // Calculate the selection rectangle
      const rect = {
        x: Math.min(startPos.x, currentPos.x),
        y: Math.min(startPos.y, currentPos.y),
        width: Math.abs(currentPos.x - startPos.x),
        height: Math.abs(currentPos.y - startPos.y),
      };

      // Only trigger if the area is large enough
      if (rect.width > 10 && rect.height > 10) {
        onAreaSelected(rect);
      }
    },
    [isSelecting, startPos, currentPos, onAreaSelected]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setIsSelecting(false);
        setShowMagnifier(false);
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const selectionStyle = {
    position: 'absolute',
    left: Math.min(startPos.x, currentPos.x),
    top: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y),
    border: '2px solid #3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    pointerEvents: 'none',
  };

  const magnifierStyle = showMagnifier
    ? {
        position: 'absolute',
        left: currentPos.x + 20,
        top: currentPos.y - 60,
        width: '120px',
        height: '120px',
        border: '2px solid #3B82F6',
        borderRadius: '50%',
        backgroundColor: 'white',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        color: '#666',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000,
      }
    : null;

  return (
    <div
      className="fixed inset-0 cursor-crosshair bg-black bg-opacity-30 z-50"
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
        <p>Click and drag to select an area</p>
        {isSelecting && (
          <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            Size: {Math.round(Math.abs(currentPos.x - startPos.x))} x{' '}
            {Math.round(Math.abs(currentPos.y - startPos.y))}
          </p>
        )}
      </div>
      {isSelecting && <div style={selectionStyle} />}
      {magnifierStyle && (
        <div style={magnifierStyle}>
          <span>
            {Math.round(Math.abs(currentPos.x - startPos.x))} x{' '}
            {Math.round(Math.abs(currentPos.y - startPos.y))}
          </span>
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
