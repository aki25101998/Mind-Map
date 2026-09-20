import { useStore } from '@xyflow/react';
import { 
  Type, Square, Circle, SquareAsterisk, Palette, Copy, Trash2, Plus, ArrowRight, ALargeSmall, Minus
} from 'lucide-react';
import { useMindMapStore } from '../store/useMindMapStore';
import { useShallow } from 'zustand/react/shallow';



interface FloatingToolbarProps {
  nodeId: string;
}

export const FloatingToolbar = ({ nodeId }: FloatingToolbarProps) => {
  const { 
    updateNodeData,
    updateNodeType,
    duplicateSelected, 
    deleteSelected, 
    createChildNode, 
    createSiblingNode,
    updateOutgoingEdges
  } = useMindMapStore(useShallow(state => ({
    updateNodeData: state.updateNodeData,
    updateNodeType: state.updateNodeType,
    duplicateSelected: state.duplicateSelected,
    deleteSelected: state.deleteSelected,
    createChildNode: state.createChildNode,
    createSiblingNode: state.createSiblingNode,
    updateOutgoingEdges: state.updateOutgoingEdges
  })));

  const node = useMindMapStore(state => state.nodes.find(n => n.id === nodeId));
  
  const transform = useStore(state => state.transform);
  const internalNode = useStore(state => state.nodeLookup.get(nodeId));

  if (!node || !internalNode) return null;

  const handleColorChange = (color: string) => {
    updateNodeData(nodeId, { backgroundColor: color });
  };

  const handleShapeChange = (shape: 'rectangle' | 'rounded' | 'ellipse' | 'text') => {
    const typeMap = { rectangle: 'basic', rounded: 'rounded', ellipse: 'ellipse', text: 'text' } as const;
    updateNodeType(nodeId, typeMap[shape] || 'basic');
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

  // Calculate screen position
  const x = internalNode.internals?.positionAbsolute?.x ?? internalNode.position.x;
  const y = (internalNode.internals?.positionAbsolute?.y ?? internalNode.position.y) - 60; // 60px above node
  const nodeWidth = internalNode.measured?.width ?? 0;
  
  // Transform flow coordinates to screen coordinates relative to ReactFlow wrapper
  const zoom = transform[2];
  const screenX = (x + nodeWidth / 2) * zoom + transform[0];
  const screenY = y * zoom + transform[1];

  return (
    <div style={{
      position: 'absolute',
      left: 0,
      top: 0,
      transform: `translate(calc(${screenX}px - 50%), ${screenY}px)`,
      background: 'var(--panel-bg)',
      border: '1px solid var(--panel-border)',
      borderRadius: '8px',
      padding: '4px',
      display: 'flex',
      gap: '4px',
      boxShadow: 'var(--shadow)',
      zIndex: 1000,
      pointerEvents: 'auto',
    }}>
      {/* Colors */}
      <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--panel-border)', paddingRight: '8px', marginRight: '4px', alignItems: 'center' }}>
        <Palette size={16} style={{ marginLeft: '4px', marginRight: '4px', color: 'var(--text-secondary)' }} />
        {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'].map(color => (
          <button
            key={color}
            onClick={() => handleColorChange(color)}
            style={{ width: '16px', height: '16px', borderRadius: '50%', background: color, border: 'none', cursor: 'pointer' }}
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
  );
};
