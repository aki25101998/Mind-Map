import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { useMindMapStore } from '../../store/useMindMapStore';
import { useShallow } from 'zustand/react/shallow';
import type { NodeData } from '../../types';
import { Lock, ExternalLink } from 'lucide-react';
import { useNodeEditing } from './useNodeEditing';
import { NodeTextEditor } from './NodeTextEditor';

export const TextNode = ({ id, data, selected }: NodeProps<Node<NodeData, 'text'>>) => {
  const { updateNodeData, editingNodeId, setEditingNodeId, toggleCollapse, isReadOnly } = useMindMapStore(
    useShallow(state => ({
      updateNodeData: state.updateNodeData,
      editingNodeId: state.editingNodeId,
      setEditingNodeId: state.setEditingNodeId,
      toggleCollapse: state.toggleCollapse,
      isReadOnly: state.isReadOnly
    }))
  );
  const hasChildren = useMindMapStore(state => state.hasChildrenMap[id] || false);
  const isEditing = editingNodeId === id;

  const {
    containerRef,
    label,
    setLabel,
    dimensionStyle,
    handleStartEditing,
    handleBlur,
    handleKeyDown
  } = useNodeEditing({
    id,
    dataLabel: data.label,
    isEditing,
    isReadOnly: !!isReadOnly,
    setEditingNodeId,
    updateNodeData
  });

  const style: React.CSSProperties = {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: data.color || 'var(--text-primary)',
    fontSize: `${data.fontSize || 16}px`,
    fontWeight: data.fontWeight || '400',
    padding: 'var(--space-1) var(--space-2)',
    boxShadow: selected ? '0 0 0 2px var(--accent-soft)' : 'none',
    minWidth: '60px',
    width: data.width ? `${data.width}px` : undefined,
    height: data.height ? `${data.height}px` : undefined,
    maxWidth: data.width ? `${data.width}px` : undefined,
    maxHeight: data.height ? `${data.height}px` : undefined,
    textAlign: (data.textAlign as 'left' | 'center' | 'right') || 'center',
    transition: isEditing ? 'none' : 'var(--transition-fast)',
    cursor: data.locked ? 'default' : 'grab',
    position: 'relative',
    ...dimensionStyle
  };

  return (
    <>
      <div 
        ref={containerRef}
        style={style} 
        onDoubleClick={handleStartEditing}
      >
        {data.locked && (
          <span 
            title="Node position is locked"
            style={{ 
              position: 'absolute', top: '-7px', left: '-7px', 
              background: 'var(--panel-bg)', borderRadius: '50%', padding: '2px',
              border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Lock size={10} color="var(--node-color-red)" />
          </span>
        )}

        {data.url && (
          <a 
            href={String(data.url).startsWith('http') ? String(data.url) : `https://${data.url}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open URL: ${data.url}`}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: 'absolute', top: '-7px', right: '-7px', 
              background: 'var(--panel-bg)', borderRadius: '50%', padding: '2px',
              border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)', color: 'var(--accent-secondary)'
            }}
          >
            <ExternalLink size={10} />
          </a>
        )}

        {isEditing ? (
          <NodeTextEditor
            value={label}
            onChange={setLabel}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            fontSize={data.fontSize || 16}
            fontWeight={data.fontWeight || '400'}
            textAlign={(data.textAlign as 'left' | 'center' | 'right') || 'center'}
            color={data.color || 'var(--text-primary)'}
          />
        ) : (
          <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
            {data.label}
          </div>
        )}
        
        <Handle type="target" position={Position.Top} id="top" />
        <Handle type="source" position={Position.Top} id="top-src" />
        
        {hasChildren && !isEditing && (
          <button
            type="button"
            className="nodrag nopan"
            onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }}
            style={{
              position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)',
              background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
              borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10, color: 'var(--text-primary)',
              pointerEvents: 'all'
            }}
          >
            {data.collapsed ? '+' : '-'}
          </button>
        )}

        <Handle type="target" position={Position.Right} id="right" />
        <Handle type="source" position={Position.Right} id="right-src" />
        
        <Handle type="target" position={Position.Bottom} id="bottom" />
        <Handle type="source" position={Position.Bottom} id="bottom-src" />
        
        <Handle type="target" position={Position.Left} id="left" />
        <Handle type="source" position={Position.Left} id="left-src" />
      </div>
    </>
  );
};
