import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { useMindMapStore } from '../../store/useMindMapStore';
import { useShallow } from 'zustand/react/shallow';
import type { NodeData } from '../../types';
import { useNodeEditing } from './useNodeEditing';
import { NodeTextEditor } from './NodeTextEditor';
import { NodeBadges, NodeTags } from './NodeDecorations';

export const EllipseNode = ({ id, data, selected }: NodeProps<Node<NodeData, 'ellipse'>>) => {
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
    backgroundColor: data.backgroundColor || 'var(--node-bg-default)',
    borderColor: selected ? 'var(--accent)' : (data.borderColor || 'var(--node-border-default)'),
    borderWidth: '1px',
    borderStyle: 'solid',
    color: data.color || 'var(--text-primary)',
    fontSize: `${data.fontSize || 14}px`,
    fontWeight: data.fontWeight || '500',
    padding: 'var(--space-4) var(--space-6)',
    borderRadius: '50%',
    boxShadow: selected ? '0 0 0 2px var(--accent-soft)' : 'var(--shadow-sm)',
    minWidth: '100px',
    width: data.width ? `${data.width}px` : undefined,
    height: data.height ? `${data.height}px` : undefined,
    maxWidth: data.width ? `${data.width}px` : undefined,
    maxHeight: data.height ? `${data.height}px` : undefined,
    textAlign: (data.textAlign as 'left' | 'center' | 'right') || 'center',
    aspectRatio: '2/1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
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
        <NodeBadges data={data} isEditing={isEditing} />

        {isEditing ? (
          <NodeTextEditor
            value={label}
            onChange={setLabel}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            fontSize={data.fontSize || 14}
            fontWeight={data.fontWeight || '500'}
            textAlign={(data.textAlign as 'left' | 'center' | 'right') || 'center'}
            color={data.color || 'var(--text-primary)'}
          />
        ) : (
          <>
            <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
              {data.label}
            </div>
            <NodeTags data={data} isEditing={isEditing} />
          </>
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
