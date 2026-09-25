import { useMindMapStore } from '../store/useMindMapStore';
import { 
  Trash2, 
  Copy,
  Wand2,
  RotateCcw
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { useAutoLayout } from '../hooks/useAutoLayout';

export const BottomToolbar = () => {
  const { 
    selectedNodeIds,
    nodes,
    edges,
    deleteSelected,
    duplicateSelected,
    updateNodeData,
    isReadOnly
  } = useMindMapStore(useShallow(state => ({
    selectedNodeIds: state.selectedNodeIds,
    nodes: state.nodes,
    edges: state.edges,
    deleteSelected: state.deleteSelected,
    duplicateSelected: state.duplicateSelected,
    updateNodeData: state.updateNodeData,
    isReadOnly: state.isReadOnly
  })));

  const { setViewport } = useReactFlow();
  const handleAutoLayout = useAutoLayout();

  const handleResetView = () => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 600 });
  };

  const handleColorChange = (color: string) => {
    if (isReadOnly) return;
    selectedNodeIds.forEach(id => updateNodeData(id, { backgroundColor: color }));
  };

  const selectedNonRootNodes = nodes.filter(n => selectedNodeIds.includes(n.id) && n.type !== 'main');
  const selectedEdges = edges.filter(e => e.selected);
  const canDelete = !isReadOnly && (selectedNonRootNodes.length > 0 || selectedEdges.length > 0);
  const canDuplicate = !isReadOnly && selectedNodeIds.length > 0;

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
        disabled={isReadOnly}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
          borderRadius: 'var(--radius-pill)', background: 'transparent', 
          color: isReadOnly ? 'var(--text-muted)' : 'var(--text-primary)',
          border: 'none', cursor: isReadOnly ? 'not-allowed' : 'pointer', 
          fontSize: '13px', fontWeight: '600',
          transition: 'all var(--transition-fast)'
        }}
        onMouseEnter={e => {
          if (!isReadOnly) {
            e.currentTarget.style.background = 'var(--social-bg)';
            e.currentTarget.style.color = 'var(--accent)';
          }
        }}
        onMouseLeave={e => {
          if (!isReadOnly) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-primary)';
          }
        }}
      >
        <Wand2 size={15} color="var(--accent)" /> Auto Layout
      </button>

      <button 
        onClick={handleResetView}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
          borderRadius: 'var(--radius-pill)', background: 'transparent', color: 'var(--text-primary)',
          border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
          transition: 'all var(--transition-fast)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--social-bg)';
          e.currentTarget.style.color = 'var(--accent-secondary)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        title="Reset View (1:1)"
      >
        <RotateCcw size={15} color="var(--accent-secondary)" /> Reset View
      </button>
      
      <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />
      
      <button 
        onClick={duplicateSelected}
        disabled={!canDuplicate}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
          borderRadius: 'var(--radius-pill)', background: 'transparent',
          color: canDuplicate ? 'var(--text-primary)' : 'var(--text-muted)',
          border: 'none', cursor: canDuplicate ? 'pointer' : 'not-allowed',
          fontSize: '13px', fontWeight: '600',
          transition: 'all var(--transition-fast)'
        }}
        onMouseEnter={e => canDuplicate && (e.currentTarget.style.background = 'var(--social-bg)')}
        onMouseLeave={e => canDuplicate && (e.currentTarget.style.background = 'transparent')}
      >
        <Copy size={15} /> Duplicate
      </button>
      
      <button 
        onClick={deleteSelected}
        disabled={!canDelete}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
          borderRadius: 'var(--radius-pill)', background: 'transparent',
          color: canDelete ? 'var(--node-color-red)' : 'var(--text-muted)',
          border: 'none', cursor: canDelete ? 'pointer' : 'not-allowed',
          fontSize: '13px', fontWeight: '600',
          transition: 'all var(--transition-fast)'
        }}
        onMouseEnter={e => canDelete && (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
        onMouseLeave={e => canDelete && (e.currentTarget.style.background = 'transparent')}
        title={!canDelete && selectedNodeIds.length === 1 && nodes.find(n => n.id === selectedNodeIds[0])?.type === 'main' ? "Root Node cannot be deleted" : "Delete selected"}
      >
        <Trash2 size={15} /> Delete
      </button>

      {!isReadOnly && (
        <>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />

          {/* Vibrant Color Swatches */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '2px 4px' }}>
            {colors.map(c => (
              <button 
                key={c.label}
                onClick={() => handleColorChange(c.value)} 
                disabled={selectedNodeIds.length === 0}
                style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: c.value, border: '2px solid var(--panel-bg)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  cursor: selectedNodeIds.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedNodeIds.length === 0 ? 0.4 : 1,
                  transition: 'transform var(--transition-bounce)'
                }}
                onMouseEnter={e => selectedNodeIds.length > 0 && (e.currentTarget.style.transform = 'scale(1.25)')}
                onMouseLeave={e => selectedNodeIds.length > 0 && (e.currentTarget.style.transform = 'scale(1)')}
                title={c.label}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
