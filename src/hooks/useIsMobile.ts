import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Pure helper function to check whether a given viewport width and height represents mobile.
 * Detects:
 * 1. Mobile portrait: width < breakpoint (default 768px)
 * 2. Mobile landscape: constrained height (height <= 520px) on mobile/tablet widths (width <= 1024px)
 * 3. Native app platforms (Capacitor on Android / iOS) on non-desktop screens
 */
export const isMobileViewport = (width: number, breakpoint = 768, height?: number): boolean => {
  // Mobile portrait or small screens
  if (width < breakpoint) {
    return true;
  }

  // Mobile landscape: width is wider (e.g. 750px - 932px) but height is short (e.g. 320px - 500px)
  const currentHeight = height ?? (typeof window !== 'undefined' ? window.innerHeight : undefined);
  if (currentHeight !== undefined && currentHeight <= 520 && width <= 1024) {
    return true;
  }

  // Capacitor native platform check
  if (typeof window !== 'undefined') {
    try {
      if (Capacitor.isNativePlatform() && (currentHeight === undefined || currentHeight <= 600)) {
        return true;
      }
    } catch {
      // Ignore in non-browser/test environments
    }
  }

  return false;
};

/**
 * Helper to check whether the current screen is in mobile landscape mode (width > height and height <= 520px).
 */
export const isLandscapeMobile = (width: number, height: number): boolean => {
  return width > height && height <= 520 && width <= 1024;
};

/**
 * Hook to detect if the current viewport is mobile (in either portrait or landscape mode).
 * Defaults to 768px.
 */
export const useIsMobile = (breakpoint = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return isMobileViewport(window.innerWidth, breakpoint, window.innerHeight);
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(isMobileViewport(window.innerWidth, breakpoint, window.innerHeight));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
};

/**
 * Hook to detect if the current viewport is in mobile landscape mode.
 */
export const useIsLandscape = (): boolean => {
  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return isLandscapeMobile(window.innerWidth, window.innerHeight);
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsLandscape(isLandscapeMobile(window.innerWidth, window.innerHeight));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return isLandscape;
};

