import { 
  Type, Square, Circle, SquareAsterisk, Palette, Copy, Trash2, Plus, ArrowRight, ALargeSmall, Minus
} from 'lucide-react';
import { useMindMapStore } from '../store/useMindMapStore';
import { useShallow } from 'zustand/react/shallow';

import React, { useState, useRef } from 'react';

let persistedPosition: { x: number; y: number } | null = null;

interface FloatingToolbarProps {
  nodeId: string;
}

export const FloatingToolbar = ({ nodeId }: FloatingToolbarProps) => {
  const { 
    updateNodeData,
    updateNodeType,
    duplicateSelected, 
    deleteSelected, 
    createChildNode, 
    createSiblingNode,
    updateOutgoingEdges
  } = useMindMapStore(useShallow(state => ({
    updateNodeData: state.updateNodeData,
    updateNodeType: state.updateNodeType,
    duplicateSelected: state.duplicateSelected,
    deleteSelected: state.deleteSelected,
    createChildNode: state.createChildNode,
    createSiblingNode: state.createSiblingNode,
    updateOutgoingEdges: state.updateOutgoingEdges
  })));

  const node = useMindMapStore(state => state.nodes.find(n => n.id === nodeId));

  const [position, setPosition] = useState<{ x: number, y: number }>(() => {
    if (persistedPosition) return persistedPosition;
    return { x: window.innerWidth / 2, y: 100 };
  });

  const toolbarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  if (!node) return null;

  const handleColorChange = (color: string) => {
    updateNodeData(nodeId, { backgroundColor: color });
  };

  const handleShapeChange = (shape: 'rectangle' | 'rounded' | 'ellipse' | 'text') => {
    const typeMap = { rectangle: 'basic', rounded: 'rounded', ellipse: 'ellipse', text: 'text' } as const;
    updateNodeType(nodeId, typeMap[shape] || 'basic');
    updateNodeData(nodeId, { shape });
  };

  const handleFontSizeChange = (size: number) => {
    updateNodeData(nodeId, { fontSize: size });
  };

  const toggleDashedEdge = () => {
    const isCurrentlyDashed = node?.data?.dashedEdges ?? false;
    updateNodeData(nodeId, { dashedEdges: !isCurrentlyDashed });
    updateOutgoingEdges(nodeId, { dashed: !isCurrentlyDashed });
  };

  const buttonStyle: React.CSSProperties = {
    padding: '7px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition-fast)',
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    if (toolbarRef.current) {
      toolbarRef.current.setPointerCapture(e.pointerId);
    }
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const newPos = {
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    };
    setPosition(newPos);
    persistedPosition = newPos;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    if (toolbarRef.current) {
      toolbarRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const vibrantSwatches = [
    '#f97316', '#06b6d4', '#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'
  ];

  return (
    <div 
      ref={toolbarRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate(calc(${position.x}px - 50%), ${position.y}px)`,
        background: 'var(--panel-bg)',
        border: '1.5px solid var(--panel-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: 'var(--shadow-toolbar)',
        zIndex: 1000,
        pointerEvents: 'auto',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {/* Colors */}
      <div style={{ display: 'flex', gap: '6px', borderRight: '1.5px solid var(--border-subtle)', paddingRight: '8px', alignItems: 'center' }}>
        <Palette size={15} style={{ color: 'var(--accent)' }} />
        {vibrantSwatches.map(color => (
          <button
            key={color}
            onClick={() => handleColorChange(color)}
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: color,
              border: '2px solid var(--panel-bg)',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'transform var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title="Set color"
          />
        ))}
      </div>

      {/* Shapes */}
      <div style={{ display: 'flex', gap: '3px', borderRight: '1.5px solid var(--border-subtle)', paddingRight: '6px' }}>
        <button 
          style={buttonStyle} 
          onClick={() => handleShapeChange('rectangle')} 
          title="Rectangle"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Square size={15} />
        </button>
        <button 
          style={buttonStyle} 
          onClick={() => handleShapeChange('rounded')} 
          title="Rounded"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <SquareAsterisk size={15} />
        </button>
        <button 
          style={buttonStyle} 
          onClick={() => handleShapeChange('ellipse')} 
          title="Ellipse"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Circle size={15} />
        </button>
        <button 
          style={buttonStyle} 
          onClick={() => handleShapeChange('text')} 
          title="Text"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Type size={15} />
        </button>
      </div>

      {/* Text & Edge Styles */}
      <div style={{ display: 'flex', gap: '3px', borderRight: '1.5px solid var(--border-subtle)', paddingRight: '6px' }}>
        <button 
          style={buttonStyle} 
          onClick={() => handleFontSizeChange(12)} 
          title="Small Text"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <ALargeSmall size={14} />
        </button>
        <button 
          style={buttonStyle} 
          onClick={() => handleFontSizeChange(14)} 
          title="Medium Text"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <ALargeSmall size={16} />
        </button>
        <button 
          style={buttonStyle} 
          onClick={() => handleFontSizeChange(18)} 
          title="Large Text"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <ALargeSmall size={18} />
        </button>
        <button 
          style={{ ...buttonStyle, background: node?.data?.dashedEdges ? 'var(--accent-secondary-soft)' : 'transparent', color: node?.data?.dashedEdges ? 'var(--accent-secondary)' : 'var(--text-secondary)' }} 
          onClick={toggleDashedEdge} 
          title="Toggle Dashed Edge"
        >
          <Minus size={15} style={{ strokeDasharray: '3 3' }} />
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '3px' }}>
        <button 
          style={buttonStyle} 
          onClick={() => createSiblingNode(nodeId)} 
          title="Add Sibling (Enter)"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <ArrowRight size={15} />
        </button>
        <button 
          style={buttonStyle} 
          onClick={() => createChildNode(nodeId)} 
          title="Add Child (Tab)"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Plus size={15} />
        </button>
        <button 
          style={buttonStyle} 
          onClick={duplicateSelected} 
          title="Duplicate (Ctrl+D)"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Copy size={15} />
        </button>
        <button 
          style={{ ...buttonStyle, color: 'var(--node-color-red)' }} 
          onClick={deleteSelected} 
          title="Delete"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};
