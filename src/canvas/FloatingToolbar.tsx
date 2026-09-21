
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

  const buttonStyle = {
    padding: '6px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
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
      border: '1px solid var(--panel-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-1)',
      display: 'flex',
      gap: 'var(--space-1)',
      boxShadow: 'var(--shadow-toolbar)',
      zIndex: 1000,
      pointerEvents: 'auto',
      cursor: 'grab',
      userSelect: 'none',
    }}>
      {/* Colors */}
      <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--panel-border)', paddingRight: '8px', marginRight: '4px', alignItems: 'center' }}>
        <Palette size={16} style={{ marginLeft: '4px', marginRight: '4px', color: 'var(--text-secondary)' }} />
        {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'].map(color => (
          <button
            key={color}
            onClick={() => handleColorChange(color)}
            style={{ width: '16px', height: '16px', borderRadius: '50%', background: color, border: 'none', cursor: 'pointer' }}
            title="Set color"
          />
        ))}
      </div>

      {/* Shapes */}
      <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--panel-border)', paddingRight: '8px', marginRight: '4px' }}>
        <button style={buttonStyle} onClick={() => handleShapeChange('rectangle')} title="Rectangle"><Square size={16} /></button>
        <button style={buttonStyle} onClick={() => handleShapeChange('rounded')} title="Rounded"><SquareAsterisk size={16} /></button>
        <button style={buttonStyle} onClick={() => handleShapeChange('ellipse')} title="Ellipse"><Circle size={16} /></button>
        <button style={buttonStyle} onClick={() => handleShapeChange('text')} title="Text"><Type size={16} /></button>
      </div>

      {/* Text & Edge Styles */}
      <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--panel-border)', paddingRight: '8px', marginRight: '4px' }}>
        <button style={buttonStyle} onClick={() => handleFontSizeChange(12)} title="Small Text"><ALargeSmall size={14} /></button>
        <button style={buttonStyle} onClick={() => handleFontSizeChange(14)} title="Medium Text"><ALargeSmall size={16} /></button>
        <button style={buttonStyle} onClick={() => handleFontSizeChange(18)} title="Large Text"><ALargeSmall size={20} /></button>
        <div style={{ width: '1px', height: '100%', background: 'var(--panel-border)', margin: '0 4px' }} />
        <button style={{ ...buttonStyle, background: node?.data?.dashedEdges ? 'var(--node-border-default)' : 'transparent' }} onClick={toggleDashedEdge} title="Toggle Dashed Edge"><Minus size={16} style={{ strokeDasharray: '4 4' }} /></button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button style={buttonStyle} onClick={() => createSiblingNode(nodeId)} title="Add Sibling (Enter)"><ArrowRight size={16} /></button>
        <button style={buttonStyle} onClick={() => createChildNode(nodeId)} title="Add Child (Tab)"><Plus size={16} /></button>
        <button style={buttonStyle} onClick={duplicateSelected} title="Duplicate (Ctrl+D)"><Copy size={16} /></button>
        <button style={{ ...buttonStyle, color: 'var(--node-color-red)' }} onClick={deleteSelected} title="Delete"><Trash2 size={16} /></button>
      </div>
    </div>
  );
};
