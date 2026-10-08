import { useState, useEffect } from 'react';

/**
 * Pure helper function to check whether a given width represents mobile.
 */
export const isMobileViewport = (width: number, breakpoint = 768): boolean => {
  return width < breakpoint;
};

/**
 * Hook to detect if the current viewport width is below a given mobile breakpoint.
 * Defaults to 768px.
 */
export const useIsMobile = (breakpoint = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return isMobileViewport(window.innerWidth, breakpoint);
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(isMobileViewport(window.innerWidth, breakpoint));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};
