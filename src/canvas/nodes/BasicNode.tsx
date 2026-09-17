import React, { useState } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { useMindMapStore } from '../../store/useMindMapStore';
import type { NodeData } from '../../types';

export const BasicNode = ({ id, data, selected }: NodeProps<Node<NodeData, 'basic'>>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const style = {
    backgroundColor: data.backgroundColor || 'var(--node-bg-default)',
    borderColor: selected ? 'var(--accent)' : (data.borderColor || 'var(--node-border-default)'),
    borderWidth: '2px',
    borderStyle: 'solid',
    color: data.color || 'var(--text-primary)',
    fontSize: `${data.fontSize || 14}px`,
    fontWeight: data.fontWeight || 'normal',
    padding: '8px 16px',
    borderRadius: `${data.borderRadius || 6}px`,
    minWidth: '80px',
    textAlign: 'center' as const,
  };

  const { updateNodeData, nodes, setNodes } = useMindMapStore();

  const handleDelete = () => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  return (
    <div style={style} onDoubleClick={() => setIsEditing(true)}>
      <NodeToolbar isVisible={selected} position={Position.Top} style={{ display: 'flex', gap: '4px', background: 'var(--panel-bg)', padding: '4px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
        <button onClick={() => updateNodeData(id, { backgroundColor: 'var(--node-color-red)' })} style={{ width: '20px', height: '20px', background: 'var(--node-color-red)', borderRadius: '50%' }} />
        <button onClick={() => updateNodeData(id, { backgroundColor: 'var(--node-color-blue)' })} style={{ width: '20px', height: '20px', background: 'var(--node-color-blue)', borderRadius: '50%' }} />
        <button onClick={() => updateNodeData(id, { backgroundColor: 'var(--node-color-green)' })} style={{ width: '20px', height: '20px', background: 'var(--node-color-green)', borderRadius: '50%' }} />
        <button onClick={handleDelete} style={{ color: 'var(--node-color-red)', marginLeft: '8px' }}>Del</button>
      </NodeToolbar>
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
