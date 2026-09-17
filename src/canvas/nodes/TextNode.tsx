import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { useMindMapStore } from '../../store/useMindMapStore';
import type { NodeData } from '../../types';

export const TextNode = ({ id, data, selected }: NodeProps<Node<NodeData, 'text'>>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const { updateNodeData } = useMindMapStore();

  const handleBlur = () => {
    setIsEditing(false);
    if (label !== data.label) {
      updateNodeData(id, { label });
    }
  };

  const style: React.CSSProperties = {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: data.color || 'var(--text-primary)',
    fontSize: `${data.fontSize || 16}px`,
    fontWeight: data.fontWeight || 'normal',
    padding: '4px 8px',
    boxShadow: selected ? '0 0 0 2px var(--accent)' : 'none',
    minWidth: '60px',
    textAlign: 'center',
  };

  return (
    <div style={style} onDoubleClick={() => setIsEditing(true)}>
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
              setIsEditing(false);
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
      
      <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Top} id="top-src" style={{ opacity: 0 }} />
      
      <Handle type="target" position={Position.Right} id="right" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right-src" style={{ opacity: 0 }} />
      
      <Handle type="target" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-src" style={{ opacity: 0 }} />
      
      <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} id="left-src" style={{ opacity: 0 }} />
    </div>
  );
};
