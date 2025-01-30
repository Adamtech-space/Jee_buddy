import { useState, useEffect } from 'react';

export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? "down" : "up";
      
      // Only update direction if scroll difference is greater than 5px
      if (Math.abs(scrollY - lastScrollY) > 5) {
        setScrollDirection(direction);
        setLastScrollY(scrollY > 0 ? scrollY : 0);
      }
    };

    // Add event listener with passive option for better performance
    window.addEventListener("scroll", updateScrollDirection, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", updateScrollDirection);
    };
  }, [lastScrollY]);

  return scrollDirection;
}; 