import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { NodeCollapseButton } from './NodeDecorations';

describe('NodeCollapseButton component logic', () => {
  it('returns null if hasChildren is false', () => {
    const el = NodeCollapseButton({
      id: 'n1',
      hasChildren: false,
      isEditing: false,
      collapsed: false,
      onToggle: () => {}
    });
    expect(el).toBeNull();
  });

  it('returns null if isEditing is true', () => {
    const el = NodeCollapseButton({
      id: 'n1',
      hasChildren: true,
      isEditing: true,
      collapsed: false,
      onToggle: () => {}
    });
    expect(el).toBeNull();
  });

  it('positions button on the left when layoutSide is left', () => {
    const onToggle = vi.fn();
    const el = NodeCollapseButton({
      id: 'n1',
      hasChildren: true,
      isEditing: false,
      collapsed: false,
      layoutSide: 'left',
      onToggle
    });

    expect(React.isValidElement(el)).toBe(true);
    if (React.isValidElement<{ className?: string; 'aria-label'?: string }>(el)) {
      expect(el.props.className).toContain('is-left');
      expect(el.props.className).not.toContain('is-right');
      expect(el.props['aria-label']).toBe('Collapse branch');
    }
  });

  it('positions button on the right when layoutSide is right or undefined', () => {
    const el = NodeCollapseButton({
      id: 'n2',
      hasChildren: true,
      isEditing: false,
      collapsed: true,
      layoutSide: 'right',
      onToggle: () => {}
    });

    expect(React.isValidElement(el)).toBe(true);
    if (React.isValidElement<{ className?: string; 'aria-label'?: string }>(el)) {
      expect(el.props.className).toContain('is-right');
      expect(el.props['aria-label']).toBe('Expand branch');
    }
  });

  it('triggers onToggle when clicked and stops propagation', () => {
    const onToggle = vi.fn();
    const el = NodeCollapseButton({
      id: 'n-target',
      hasChildren: true,
      isEditing: false,
      collapsed: false,
      layoutSide: 'left',
      onToggle
    });

    expect(React.isValidElement(el)).toBe(true);
    if (React.isValidElement<{ onClick?: (e: React.MouseEvent) => void }>(el)) {
      const stopPropagation = vi.fn();
      el.props.onClick?.({ stopPropagation } as unknown as React.MouseEvent);

      expect(stopPropagation).toHaveBeenCalled();
      expect(onToggle).toHaveBeenCalledWith('n-target');
    }
  });
});
