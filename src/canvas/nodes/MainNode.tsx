import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { useMindMapStore } from '../../store/useMindMapStore';
import { useShallow } from 'zustand/react/shallow';
import type { NodeData } from '../../types';
import { Lock, ExternalLink } from 'lucide-react';

export const MainNode = ({ id, data, selected }: NodeProps<Node<NodeData, 'main'>>) => {
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
  const [label, setLabel] = React.useState(data.label);

  React.useEffect(() => {
    if (!isEditing) {
      setLabel(data.label);
    }
  }, [data.label, isEditing]);

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
    fontWeight: data.fontWeight || '700',
    padding: 'var(--space-3) var(--space-6)',
    borderRadius: data.borderRadius ? `${data.borderRadius}px` : 'var(--radius-lg)',
    boxShadow: selected ? '0 0 0 2px var(--accent)' : 'var(--shadow-sm)',
    minWidth: '120px',
    textAlign: (data.textAlign as 'left' | 'center' | 'right') || 'center',
    transition: 'var(--transition-fast)',
    cursor: data.locked ? 'default' : 'grab',
    position: 'relative'
  };

  return (
    <>
      <div style={style} onDoubleClick={() => !isReadOnly && setEditingNodeId(id)}>
        {data.locked && (
          <span 
            title="Node position is locked"
            style={{ 
              position: 'absolute', top: '-8px', left: '-8px', 
              background: 'var(--panel-bg)', borderRadius: '50%', padding: '3px',
              border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Lock size={11} color="var(--node-color-red)" />
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
              position: 'absolute', top: '-8px', right: '-8px', 
              background: 'var(--panel-bg)', borderRadius: '50%', padding: '3px',
              border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)', color: 'var(--accent-secondary)'
            }}
          >
            <ExternalLink size={11} />
          </a>
        )}

        {isEditing ? (
          <div style={{ display: 'inline-grid', alignItems: 'center', justifyItems: 'center' }}>
            <span style={{ visibility: 'hidden', gridArea: '1 / 1', whiteSpace: 'pre' }}>{label || ' '}</span>
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
                gridArea: '1 / 1', background: 'transparent', border: 'none', color: 'inherit', 
                fontSize: 'inherit', fontWeight: 'inherit', outline: 'none', width: '100%', minWidth: 0, textAlign: 'inherit' 
              }}
            />
          </div>
        ) : (
          <div>{data.label}</div>
        )}
        
        {/* 4-way handles for freeform connectivity */}
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
