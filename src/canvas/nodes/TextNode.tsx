import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { NodeData } from '../../types';

export const TextNode = ({ data, selected }: NodeProps<Node<NodeData, 'text'>>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const style = {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: '0px',
    color: data.color || 'var(--text-primary)',
    fontSize: `${data.fontSize || 16}px`,
    fontWeight: data.fontWeight || 'normal',
    padding: '4px 8px',
    minWidth: '50px',
    textAlign: 'center' as const,
    textDecoration: selected ? 'underline' : 'none',
    textDecorationColor: 'var(--accent)',
  };

  return (
    <div style={style} onDoubleClick={() => setIsEditing(true)}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Bottom} style={{ opacity: 0 }} />
      
      {isEditing ? (
        <input 
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setIsEditing(false);
          }}
          style={{ 
            background: 'transparent', border: 'none', color: 'inherit', 
            fontSize: 'inherit', fontWeight: 'inherit', outline: 'none', width: '100%', textAlign: 'center' 
          }}
        />
      ) : (
        <div>{label}</div>
      )}
      
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
};
