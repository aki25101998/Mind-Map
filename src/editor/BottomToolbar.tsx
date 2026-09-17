import { useMindMapStore } from '../store/useMindMapStore';
import { autoLayout } from '../layouts/autoLayout';
import { 
  Trash2, 
  Copy,
  Wand2
} from 'lucide-react';

export const BottomToolbar = () => {
  const { 
    nodes, edges, setNodes, templateId, 
    selectedNodeIds, deleteSelected, duplicateSelected,
    updateNodeData
  } = useMindMapStore();

  const handleAutoLayout = () => {
    const layoutedNodes = autoLayout(nodes, edges, templateId || 'free');
    setNodes(layoutedNodes);
  };

  const handleColorChange = (color: string) => {
    selectedNodeIds.forEach(id => updateNodeData(id, { backgroundColor: color }));
  };

  return (
    <div style={{
      position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: '12px', alignItems: 'center',
      background: 'var(--panel-bg)', padding: '12px 24px', borderRadius: '32px',
      border: '1px solid var(--panel-border)', zIndex: 'var(--z-toolbar)',
      boxShadow: 'var(--shadow)'
    }}>
      <button 
        onClick={handleAutoLayout}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'transparent', color: 'var(--text-primary)' }}
      >
        <Wand2 size={18} /> Layout
      </button>
      
      <div style={{ width: '1px', height: '24px', background: 'var(--panel-border)' }} />
      
      <button 
        onClick={duplicateSelected}
        disabled={selectedNodeIds.length === 0}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'transparent', color: selectedNodeIds.length === 0 ? 'var(--text-secondary)' : 'var(--text-primary)' }}
      >
        <Copy size={18} /> Duplicate
      </button>
      
      <button 
        onClick={deleteSelected}
        disabled={selectedNodeIds.length === 0}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'transparent', color: selectedNodeIds.length === 0 ? 'var(--text-secondary)' : 'var(--node-color-red)' }}
      >
        <Trash2 size={18} /> Delete
      </button>

      <div style={{ width: '1px', height: '24px', background: 'var(--panel-border)' }} />

      <div style={{ display: 'flex', gap: '4px' }}>
        <button onClick={() => handleColorChange('var(--node-color-blue)')} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--node-color-blue)', border: 'none' }} />
        <button onClick={() => handleColorChange('var(--node-color-red)')} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--node-color-red)', border: 'none' }} />
        <button onClick={() => handleColorChange('var(--node-color-green)')} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--node-color-green)', border: 'none' }} />
        <button onClick={() => handleColorChange('var(--node-color-yellow)')} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--node-color-yellow)', border: 'none' }} />
      </div>
    </div>
  );
};
