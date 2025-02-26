import React, { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';

// Lazy load SplashCursor for better initial load performance
const SplashCursor = lazy(() => import('./SplashCursor'));

export default function FluidBackground({ children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 -z-10">
        <Suspense fallback={<div className="absolute inset-0 bg-black"></div>}>
          <SplashCursor 
            SIM_RESOLUTION={32}         // Much lower resolution
            DYE_RESOLUTION={128}        // Lower resolution
            DENSITY_DISSIPATION={3}     // Faster dissipation
            VELOCITY_DISSIPATION={1.8}  // Faster dissipation
            SPLAT_RADIUS={0.2}
            SPLAT_FORCE={2000}          // Lower force
            COLOR_UPDATE_SPEED={8}
            SHADING={false}             // Disable expensive shading
          />
        </Suspense>
      </div>
      {children}
    </div>
  );
}

FluidBackground.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
}; 