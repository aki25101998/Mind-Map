import { useMindMapStore } from '../store/useMindMapStore';
import { 
  Trash2, 
  Copy,
  Wand2
} from 'lucide-react';

import { useShallow } from 'zustand/react/shallow';
import { useAutoLayout } from '../hooks/useAutoLayout';

export const BottomToolbar = () => {
  const { 
    selectedNodeIds,
    deleteSelected,
    duplicateSelected,
    updateNodeData
  } = useMindMapStore(useShallow(state => ({
    selectedNodeIds: state.selectedNodeIds,
    deleteSelected: state.deleteSelected,
    duplicateSelected: state.duplicateSelected,
    updateNodeData: state.updateNodeData
  })));

  const handleAutoLayout = useAutoLayout();

  const handleColorChange = (color: string) => {
    selectedNodeIds.forEach(id => updateNodeData(id, { backgroundColor: color }));
  };

  return (
    <div style={{
      position: 'absolute', bottom: 'var(--space-6)', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 'var(--space-2)', alignItems: 'center',
      background: 'var(--panel-bg)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-pill)',
      border: '1px solid var(--panel-border)', zIndex: 'var(--z-toolbar)',
      boxShadow: 'var(--shadow-toolbar)', pointerEvents: 'auto'
    }}>
      <button 
        onClick={handleAutoLayout}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: 'var(--radius-pill)', background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Wand2 size={16} /> Layout
      </button>
      
      <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />
      
      <button 
        onClick={duplicateSelected}
        disabled={selectedNodeIds.length === 0}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: 'var(--radius-pill)', background: 'transparent', color: selectedNodeIds.length === 0 ? 'var(--text-muted)' : 'var(--text-primary)', border: 'none', cursor: selectedNodeIds.length === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '500' }}
        onMouseEnter={e => selectedNodeIds.length > 0 && (e.currentTarget.style.background = 'var(--social-bg)')}
        onMouseLeave={e => selectedNodeIds.length > 0 && (e.currentTarget.style.background = 'transparent')}
      >
        <Copy size={16} /> Duplicate
      </button>
      
      <button 
        onClick={deleteSelected}
        disabled={selectedNodeIds.length === 0}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: 'var(--radius-pill)', background: 'transparent', color: selectedNodeIds.length === 0 ? 'var(--text-muted)' : 'var(--node-color-red)', border: 'none', cursor: selectedNodeIds.length === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '500' }}
        onMouseEnter={e => selectedNodeIds.length > 0 && (e.currentTarget.style.background = 'var(--social-bg)')}
        onMouseLeave={e => selectedNodeIds.length > 0 && (e.currentTarget.style.background = 'transparent')}
      >
        <Trash2 size={16} /> Delete
      </button>

      <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />

      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
        <button onClick={() => handleColorChange('var(--node-color-blue)')} style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--node-color-blue)', border: 'none', cursor: 'pointer' }} title="Blue" />
        <button onClick={() => handleColorChange('var(--node-color-red)')} style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--node-color-red)', border: 'none', cursor: 'pointer' }} title="Red" />
        <button onClick={() => handleColorChange('var(--node-color-green)')} style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--node-color-green)', border: 'none', cursor: 'pointer' }} title="Green" />
        <button onClick={() => handleColorChange('var(--node-color-yellow)')} style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--node-color-yellow)', border: 'none', cursor: 'pointer' }} title="Yellow" />
      </div>
    </div>
  );
};
