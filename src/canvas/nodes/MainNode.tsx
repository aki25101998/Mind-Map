import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { useMindMapStore } from '../../store/useMindMapStore';
import { useShallow } from 'zustand/react/shallow';
import type { NodeData } from '../../types';
import { NodeFloatingToolbar } from './NodeFloatingToolbar';

export const MainNode = ({ id, data, selected }: NodeProps<Node<NodeData, 'main'>>) => {
  const { updateNodeData, editingNodeId, setEditingNodeId, toggleCollapse } = useMindMapStore(
    useShallow(state => ({
      updateNodeData: state.updateNodeData,
      editingNodeId: state.editingNodeId,
      setEditingNodeId: state.setEditingNodeId,
      toggleCollapse: state.toggleCollapse
    }))
  );
  const hasChildren = useMindMapStore(state => state.edges.some(e => e.source === id));
  const isEditing = editingNodeId === id;
  const [label, setLabel] = useState(data.label);

  const handleBlur = () => {
    setEditingNodeId(null);
    if (label !== data.label) {
      updateNodeData(id, { label });
    }
  };

  const style: React.CSSProperties = {
    backgroundColor: data.backgroundColor || 'var(--node-color-orange)',
    borderColor: selected ? 'var(--accent)' : (data.borderColor || 'transparent'),
    borderWidth: selected ? '2px' : (data.borderWidth ? `${data.borderWidth}px` : '0px'),
    borderStyle: 'solid',
    color: data.color || 'var(--node-text-default)',
    fontSize: `${data.fontSize || 20}px`,
    fontWeight: data.fontWeight || 'bold',
    padding: '12px 24px',
    borderRadius: `${data.borderRadius || 8}px`,
    boxShadow: selected ? '0 0 0 4px var(--accent-bg)' : '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
    minWidth: '120px',
    textAlign: 'center',
  };

  return (
    <>
      <NodeFloatingToolbar nodeId={id} isVisible={selected && !isEditing} nodeType="main" />
      <div style={style} onDoubleClick={() => setEditingNodeId(id)}>
      {isEditing ? (
        <input 
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleBlur();
            if (e.key === 'Escape') {
              setLabel(data.label);
              setEditingNodeId(null);
            }
          }}
          style={{ 
            background: 'transparent', border: 'none', color: 'inherit', 
            fontSize: 'inherit', fontWeight: 'inherit', outline: 'none', width: '100%', textAlign: 'center' 
          }}
        />
      ) : (
        <div>{data.label}</div>
      )}
      
      {/* 4-way handles for freeform connectivity */}
      <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Top} id="top-src" style={{ opacity: 0 }} />
      
      {hasChildren && !isEditing && (
        <button
          onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }}
          style={{
            position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)',
            background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
            borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10, color: 'var(--text-primary)'
          }}
        >
          {data.collapsed ? '+' : '-'}
        </button>
      )}

      <Handle type="target" position={Position.Right} id="right" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right-src" style={{ opacity: 0 }} />
      
      <Handle type="target" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-src" style={{ opacity: 0 }} />
      
      <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} id="left-src" style={{ opacity: 0 }} />
    </div>
    </>
  );
};
