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

  const colors = [
    { label: 'Orange', value: 'var(--node-color-orange)' },
    { label: 'Cyan', value: 'var(--node-color-cyan)' },
    { label: 'Green', value: 'var(--node-color-green)' },
    { label: 'Purple', value: 'var(--node-color-purple)' },
    { label: 'Blue', value: 'var(--node-color-blue)' },
    { label: 'Yellow', value: 'var(--node-color-yellow)' },
    { label: 'Red', value: 'var(--node-color-red)' },
  ];

  return (
    <div style={{
      position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: '8px', alignItems: 'center',
      background: 'var(--panel-bg)', padding: '6px 16px', borderRadius: 'var(--radius-pill)',
      border: '1.5px solid var(--panel-border)', zIndex: 'var(--z-toolbar)',
      boxShadow: 'var(--shadow-toolbar)', pointerEvents: 'auto',
      transition: 'all var(--transition-fast)'
    }}>
      <button 
        onClick={handleAutoLayout}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
          borderRadius: 'var(--radius-pill)', background: 'transparent', color: 'var(--text-primary)',
          border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
          transition: 'all var(--transition-fast)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--social-bg)';
          e.currentTarget.style.color = 'var(--accent)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
      >
        <Wand2 size={15} color="var(--accent)" /> Auto Layout
      </button>
      
      <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />
      
      <button 
        onClick={duplicateSelected}
        disabled={selectedNodeIds.length === 0}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
          borderRadius: 'var(--radius-pill)', background: 'transparent',
          color: selectedNodeIds.length === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
          border: 'none', cursor: selectedNodeIds.length === 0 ? 'not-allowed' : 'pointer',
          fontSize: '13px', fontWeight: '600',
          transition: 'all var(--transition-fast)'
        }}
        onMouseEnter={e => selectedNodeIds.length > 0 && (e.currentTarget.style.background = 'var(--social-bg)')}
        onMouseLeave={e => selectedNodeIds.length > 0 && (e.currentTarget.style.background = 'transparent')}
      >
        <Copy size={15} /> Duplicate
      </button>
      
      <button 
        onClick={deleteSelected}
        disabled={selectedNodeIds.length === 0}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
          borderRadius: 'var(--radius-pill)', background: 'transparent',
          color: selectedNodeIds.length === 0 ? 'var(--text-muted)' : 'var(--node-color-red)',
          border: 'none', cursor: selectedNodeIds.length === 0 ? 'not-allowed' : 'pointer',
          fontSize: '13px', fontWeight: '600',
          transition: 'all var(--transition-fast)'
        }}
        onMouseEnter={e => selectedNodeIds.length > 0 && (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
        onMouseLeave={e => selectedNodeIds.length > 0 && (e.currentTarget.style.background = 'transparent')}
      >
        <Trash2 size={15} /> Delete
      </button>

      <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />

      {/* Vibrant Color Swatches */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '2px 4px' }}>
        {colors.map(c => (
          <button 
            key={c.label}
            onClick={() => handleColorChange(c.value)} 
            style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: c.value, border: '2px solid var(--panel-bg)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              transition: 'transform var(--transition-bounce)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title={c.label}
          />
        ))}
      </div>
    </div>
  );
};
