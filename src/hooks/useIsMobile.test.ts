import { describe, it, expect } from 'vitest';
import { isMobileViewport, isLandscapeMobile } from './useIsMobile';

describe('isMobile utility and logic', () => {
  it('correctly classifies mobile viewports below 768px breakpoint', () => {
    expect(isMobileViewport(320)).toBe(true);
    expect(isMobileViewport(375)).toBe(true);
    expect(isMobileViewport(414)).toBe(true);
    expect(isMobileViewport(767)).toBe(true);
  });

  it('correctly classifies desktop and tablet viewports at or above 768px', () => {
    expect(isMobileViewport(768)).toBe(false);
    expect(isMobileViewport(1024)).toBe(false);
    expect(isMobileViewport(1440)).toBe(false);
  });

  it('supports custom breakpoint thresholds', () => {
    expect(isMobileViewport(600, 640)).toBe(true);
    expect(isMobileViewport(650, 640)).toBe(false);
  });

  it('correctly identifies mobile devices rotated horizontally (landscape mode)', () => {
    // Typical mobile landscape: width 844px, height 390px (e.g. iPhone)
    expect(isMobileViewport(844, 768, 390)).toBe(true);
    // Android phone in landscape: width 915px, height 412px
    expect(isMobileViewport(915, 768, 412)).toBe(true);
    // Desktop monitor: width 1920px, height 1080px
    expect(isMobileViewport(1920, 768, 1080)).toBe(false);
    // Laptop screen: width 1366px, height 768px
    expect(isMobileViewport(1366, 768, 768)).toBe(false);
  });

  it('correctly identifies landscape orientation helper', () => {
    expect(isLandscapeMobile(844, 390)).toBe(true);
    expect(isLandscapeMobile(390, 844)).toBe(false);
    expect(isLandscapeMobile(1920, 1080)).toBe(false);
  });
});

