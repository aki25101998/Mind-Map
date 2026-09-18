import React from 'react';
import { NodeToolbar, Position } from '@xyflow/react';
import { 
  Type, 
  Square, 
  Circle, 
  SquareAsterisk,
  Palette,
  Copy,
  Trash2,
  Plus,
  ArrowRight,
  ALargeSmall,
  Minus
} from 'lucide-react';
import { useMindMapStore } from '../../store/useMindMapStore';

interface NodeFloatingToolbarProps {
  nodeId: string;
  isVisible: boolean;
  nodeType: string;
}

export const NodeFloatingToolbar: React.FC<NodeFloatingToolbarProps> = ({ nodeId, isVisible }) => {
  const { 
    updateNodeData, 
    duplicateSelected, 
    deleteSelected, 
    createChildNode, 
    createSiblingNode,
    nodes,
    updateOutgoingEdges
  } = useMindMapStore();

  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;

  const handleColorChange = (color: string) => {
    updateNodeData(nodeId, { backgroundColor: color });
  };

  const handleShapeChange = (shape: 'rectangle' | 'rounded' | 'ellipse' | 'text') => {
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
    color: 'var(--text-primary)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <NodeToolbar isVisible={isVisible} position={Position.Top} offset={10}>
      <div style={{
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border)',
        borderRadius: '8px',
        padding: '4px',
        display: 'flex',
        gap: '4px',
        boxShadow: 'var(--shadow)',
        pointerEvents: 'all'
      }}>
        {/* Colors */}
        <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--panel-border)', paddingRight: '8px', marginRight: '4px', alignItems: 'center' }}>
          <Palette size={16} style={{ marginLeft: '4px', marginRight: '4px', color: 'var(--text-secondary)' }} />
          {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'].map(color => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              style={{
                width: '16px', height: '16px', borderRadius: '50%', background: color, border: 'none', cursor: 'pointer'
              }}
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
    </NodeToolbar>
  );
};
