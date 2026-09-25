import React, { useState, useRef } from 'react';
import { 
  Palette, Trash2, Minus, Spline, ArrowRight, CornerDownRight, Slash
} from 'lucide-react';
import { useMindMapStore } from '../../store/useMindMapStore';
import { useShallow } from 'zustand/react/shallow';
import type { MindMapEdgeStyle } from '../../types';
import { canConvertToStructural } from '../../utils/graphUtils';

let persistedEdgePosition: { x: number; y: number } | null = null;

interface EdgeFloatingToolbarProps {
  edgeId: string;
}

export const EdgeFloatingToolbar = ({ edgeId }: EdgeFloatingToolbarProps) => {
  const { updateEdge, deleteSelected, nodes, edges } = useMindMapStore(
    useShallow(state => ({
      updateEdge: state.updateEdge,
      deleteSelected: state.deleteSelected,
      nodes: state.nodes,
      edges: state.edges
    }))
  );

  const edge = edges.find(e => e.id === edgeId);

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (persistedEdgePosition) return persistedEdgePosition;
    return { x: window.innerWidth / 2, y: 100 };
  });

  const toolbarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  if (!edge) return null;

  const edgeData = edge.data || {};
  const currentStyle: MindMapEdgeStyle = edgeData.edgeStyle || 'curved';
  const isRelationship = edgeData.relationship === true;
  const isDashed = !!edgeData.dashed;
  const hasArrowStart = !!edgeData.arrowStart;
  const hasArrowEnd = !!edgeData.arrowEnd;
  const currentWidth = edgeData.strokeWidth || 2;

  const handleModeChange = (makeRelationship: boolean) => {
    if (makeRelationship === isRelationship) return;

    if (!makeRelationship) {
      const result = canConvertToStructural(edge, edges, nodes);
      if (!result.allowed) {
        alert(result.reason || 'Cannot convert this edge to a hierarchy edge because the target already has a parent.');
        return;
      }
      updateEdge(edgeId, { data: { relationship: false } });
    } else {
      updateEdge(edgeId, { data: { relationship: true } });
    }
  };

  const handleStyleChange = (style: MindMapEdgeStyle) => {
    updateEdge(edgeId, { data: { edgeStyle: style } });
  };

  const toggleDashed = () => {
    updateEdge(edgeId, { data: { dashed: !isDashed } });
  };

  const toggleArrowStart = () => {
    updateEdge(edgeId, { data: { arrowStart: !hasArrowStart } });
  };

  const toggleArrowEnd = () => {
    updateEdge(edgeId, { data: { arrowEnd: !hasArrowEnd } });
  };

  const handleColorChange = (color: string) => {
    updateEdge(edgeId, { data: { strokeColor: color } });
  };

  const handleWidthChange = (width: number) => {
    updateEdge(edgeId, { data: { strokeWidth: width } });
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
    persistedEdgePosition = newPos;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    if (toolbarRef.current) {
      toolbarRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const vibrantSwatches = [
    '#a3a3a3', '#f97316', '#06b6d4', '#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'
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
      {/* Edge Mode: Hierarchy vs Relationship */}
      <div style={{ display: 'flex', gap: '2px', borderRight: '1.5px solid var(--border-subtle)', paddingRight: '6px', alignItems: 'center' }}>
        <button
          onClick={() => handleModeChange(false)}
          style={{
            ...buttonStyle,
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: !isRelationship ? '600' : '400',
            background: !isRelationship ? 'var(--social-bg)' : 'transparent',
            color: !isRelationship ? 'var(--accent)' : 'var(--text-secondary)',
          }}
          title="Structural Hierarchy Edge (Parent -> Child)"
        >
          Hierarchy
        </button>
        <button
          onClick={() => handleModeChange(true)}
          style={{
            ...buttonStyle,
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: isRelationship ? '600' : '400',
            background: isRelationship ? 'var(--social-bg)' : 'transparent',
            color: isRelationship ? 'var(--accent)' : 'var(--text-secondary)',
          }}
          title="Free Cross-link Relationship Edge"
        >
          Relationship
        </button>
      </div>

      {/* Edge Geometry: Curved, Straight, Orthogonal */}
      <div style={{ display: 'flex', gap: '3px', borderRight: '1.5px solid var(--border-subtle)', paddingRight: '6px' }}>
        <button 
          style={{ ...buttonStyle, background: currentStyle === 'curved' ? 'var(--social-bg)' : 'transparent', color: currentStyle === 'curved' ? 'var(--accent)' : 'var(--text-secondary)' }} 
          onClick={() => handleStyleChange('curved')} 
          title="Curved Line"
        >
          <Spline size={15} />
        </button>
        <button 
          style={{ ...buttonStyle, background: currentStyle === 'straight' ? 'var(--social-bg)' : 'transparent', color: currentStyle === 'straight' ? 'var(--accent)' : 'var(--text-secondary)' }} 
          onClick={() => handleStyleChange('straight')} 
          title="Straight Line"
        >
          <Slash size={15} />
        </button>
        <button 
          style={{ ...buttonStyle, background: currentStyle === 'orthogonal' ? 'var(--social-bg)' : 'transparent', color: currentStyle === 'orthogonal' ? 'var(--accent)' : 'var(--text-secondary)' }} 
          onClick={() => handleStyleChange('orthogonal')} 
          title="Orthogonal / Step Line"
        >
          <CornerDownRight size={15} />
        </button>
      </div>

      {/* Pattern & Arrows */}
      <div style={{ display: 'flex', gap: '3px', borderRight: '1.5px solid var(--border-subtle)', paddingRight: '6px' }}>
        <button 
          style={{ ...buttonStyle, background: isDashed ? 'var(--accent-secondary-soft)' : 'transparent', color: isDashed ? 'var(--accent-secondary)' : 'var(--text-secondary)' }} 
          onClick={toggleDashed} 
          title="Toggle Dashed"
        >
          <Minus size={15} style={{ strokeDasharray: '3 3' }} />
        </button>
        <button 
          style={{ ...buttonStyle, background: hasArrowStart ? 'var(--social-bg)' : 'transparent', color: hasArrowStart ? 'var(--accent)' : 'var(--text-secondary)' }} 
          onClick={toggleArrowStart} 
          title="Arrow Start"
        >
          <ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <button 
          style={{ ...buttonStyle, background: hasArrowEnd ? 'var(--social-bg)' : 'transparent', color: hasArrowEnd ? 'var(--accent)' : 'var(--text-secondary)' }} 
          onClick={toggleArrowEnd} 
          title="Arrow End"
        >
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Stroke Width */}
      <div style={{ display: 'flex', gap: '3px', borderRight: '1.5px solid var(--border-subtle)', paddingRight: '6px' }}>
        <button 
          style={{ ...buttonStyle, fontWeight: currentWidth === 1 ? '700' : '400', color: currentWidth === 1 ? 'var(--accent)' : 'var(--text-secondary)' }} 
          onClick={() => handleWidthChange(1)} 
          title="Thin (1px)"
        >
          1px
        </button>
        <button 
          style={{ ...buttonStyle, fontWeight: currentWidth === 2 ? '700' : '400', color: currentWidth === 2 ? 'var(--accent)' : 'var(--text-secondary)' }} 
          onClick={() => handleWidthChange(2)} 
          title="Medium (2px)"
        >
          2px
        </button>
        <button 
          style={{ ...buttonStyle, fontWeight: currentWidth === 4 ? '700' : '400', color: currentWidth === 4 ? 'var(--accent)' : 'var(--text-secondary)' }} 
          onClick={() => handleWidthChange(4)} 
          title="Thick (4px)"
        >
          4px
        </button>
      </div>

      {/* Edge Colors */}
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
              border: edgeData.strokeColor === color ? '2px solid var(--accent)' : '2px solid var(--panel-bg)',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'transform var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title={`Set color ${color}`}
          />
        ))}
      </div>

      {/* Delete Edge */}
      <div style={{ display: 'flex', gap: '3px' }}>
        <button 
          style={{ ...buttonStyle, color: 'var(--node-color-red)' }} 
          onClick={deleteSelected} 
          title="Delete Edge"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};
