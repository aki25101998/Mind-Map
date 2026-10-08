import { describe, it, expect } from 'vitest';
import { isMobileViewport } from './useIsMobile';

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
});
