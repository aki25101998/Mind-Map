import React from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { getTreeLayout } from '../layouts/autoLayout';

export const BottomToolbar = () => {
  const { nodes, edges, setNodes } = useMindMapStore();

  const handleAutoLayout = () => {
    const layoutedNodes = getTreeLayout(nodes, edges);
    setNodes(layoutedNodes);
  };

  return (
    <div style={{
      position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: '12px', alignItems: 'center',
      background: 'var(--panel-bg)', padding: '8px 16px', borderRadius: '24px',
      border: '1px solid var(--panel-border)', zIndex: 'var(--z-toolbar)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    }}>
      <button style={{ padding: '8px 12px', borderRadius: '16px', background: 'var(--node-bg-default)' }} onClick={handleAutoLayout}>Auto Layout</button>
      <div style={{ width: '1px', height: '24px', background: 'var(--panel-border)' }} />
      <button style={{ padding: '8px 12px', borderRadius: '16px', background: 'var(--node-bg-default)' }}>Add Node</button>
      <button style={{ padding: '8px 12px', borderRadius: '16px', background: 'var(--node-bg-default)' }}>Colors</button>
    </div>
  );
};
