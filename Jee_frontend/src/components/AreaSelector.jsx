import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce'; // Import debounce from lodash

const AreaSelector = memo(({ onAreaSelected, onCancel, isMobile }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [showHint, setShowHint] = useState(true);

  const getEventCoordinates = useCallback((e) => {
    if (e.touches) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
    return {
      x: e.clientX,
      y: e.clientY,
    };
  }, []);

  const handleStart = useCallback(
    (e) => {
      // Prevent default to stop scrolling on touch devices
      e.preventDefault();

      // Only handle left mouse button for mouse events
      if (e.type === 'mousedown' && e.button !== 0) return;

      const coords = getEventCoordinates(e);
      setStartPos(coords);
      setCurrentPos(coords);
      setIsSelecting(true);
    },
    [getEventCoordinates]
  );

  const handleMove = useMemo(() => {
    if (isMobile) {
      // For mobile, call immediately without debounce for better responsiveness
      return (e) => {
        if (!isSelecting) return;
        e.preventDefault();
        requestAnimationFrame(() => {
          setCurrentPos(getEventCoordinates(e));
        });
      };
    } else {
      // For non-mobile, use debounce to throttle events
      return debounce(
        (e) => {
          if (!isSelecting) return;
          e.preventDefault();
          requestAnimationFrame(() => {
            setCurrentPos(getEventCoordinates(e));
          });
        },
        16,
        { leading: true, trailing: false }
      );
    }
  }, [isSelecting, getEventCoordinates, isMobile]);

  const handleEnd = useCallback(() => {
    if (!isSelecting) return;

    const rect = {
      x: Math.min(startPos.x, currentPos.x),
      y: Math.min(startPos.y, currentPos.y),
      width: Math.abs(currentPos.x - startPos.x),
      height: Math.abs(currentPos.y - startPos.y),
    };

    // Adjust minimum area requirement for mobile
    const minWidth = isMobile ? 10 : 20;
    const minHeight = isMobile ? 10 : 20;

    // Only trigger if area is large enough
    if (rect.width > minWidth && rect.height > minHeight) {
      onAreaSelected(rect);
    }

    setIsSelecting(false);
  }, [isSelecting, startPos, currentPos, onAreaSelected, isMobile]);

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
    // Mouse events
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    // Touch events
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('touchcancel', handleEnd);

    // Keyboard events
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Mouse events
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);

      // Touch events
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);

      // Keyboard events
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, handleMove, handleEnd]);

  useEffect(() => {
    if (isSelecting) {
      setShowHint(false);
    }
  }, [isSelecting]);

  // Add cleanup effect to cancel debounce if applicable
  useEffect(() => {
    return () => {
      if (handleMove.cancel) {
        handleMove.cancel();
      }
    };
  }, [handleMove]);

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
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      {/* Hint */}
      {showHint && !isSelecting && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="px-4 py-2 bg-green-500 rounded-lg shadow-lg">
            <p className="text-white text-xs sm:text-sm font-medium whitespace-nowrap">
              {isMobile
                ? 'Touch and drag to select'
                : 'Click and drag to select'}
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
            border: '2px solid #22c55e',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          {/* Selection handles - Bigger for mobile */}
          <div
            className={`absolute -top-2 -left-2 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'} bg-white border-2 border-green-500 rounded-full`}
          />
          <div
            className={`absolute -top-2 -right-2 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'} bg-white border-2 border-green-500 rounded-full`}
          />
          <div
            className={`absolute -bottom-2 -left-2 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'} bg-white border-2 border-green-500 rounded-full`}
          />
          <div
            className={`absolute -bottom-2 -right-2 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'} bg-white border-2 border-green-500 rounded-full`}
          />

          {/* Size indicator */}
          <div
            className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-lg"
            style={{ whiteSpace: 'nowrap' }}
          >
            {Math.round(selectionStyle.width)} ×{' '}
            {Math.round(selectionStyle.height)}
          </div>
        </div>
      )}
    </div>
  );
});

AreaSelector.propTypes = {
  onAreaSelected: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isMobile: PropTypes.bool,
};

AreaSelector.defaultProps = {
  isMobile: false,
};

AreaSelector.displayName = 'AreaSelector';

export default AreaSelector;
