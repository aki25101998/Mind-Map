import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { NodeData } from '../../types';

export const MainNode = ({ data, selected }: NodeProps<Node<NodeData, 'main'>>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const style = {
    backgroundColor: data.backgroundColor || 'var(--node-color-orange)',
    borderColor: selected ? 'var(--text-primary)' : (data.borderColor || 'transparent'),
    borderWidth: selected ? '2px' : '0px',
    borderStyle: 'solid',
    color: data.color || 'var(--node-text-default)',
    fontSize: `${data.fontSize || 20}px`,
    fontWeight: data.fontWeight || 'bold',
    padding: '12px 24px',
    borderRadius: `${data.borderRadius || 8}px`,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
    minWidth: '120px',
    textAlign: 'center' as const,
  };

  return (
    <div style={style} onDoubleClick={() => setIsEditing(true)}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      
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
