import React from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

export const TopToolbar = () => {
  const { documentTitle } = useMindMapStore();

  return (
    <div style={{
      position: 'absolute', top: '16px', left: '16px', right: '16px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      zIndex: 'var(--z-toolbar)', pointerEvents: 'none'
    }}>
      <div style={{
        background: 'var(--panel-bg)', padding: '8px 16px', borderRadius: 'var(--panel-radius)',
        border: '1px solid var(--panel-border)', pointerEvents: 'auto',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <div style={{ fontWeight: 'bold' }}>{documentTitle}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--node-bg-default)' }}>Undo</button>
          <button style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--node-bg-default)' }}>Redo</button>
        </div>
      </div>
      
      <div style={{
        background: 'var(--panel-bg)', padding: '8px', borderRadius: 'var(--panel-radius)',
        border: '1px solid var(--panel-border)', pointerEvents: 'auto',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)', display: 'flex', gap: '8px'
      }}>
        <button style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--accent)', color: 'white' }}>Save</button>
        <button style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--node-bg-default)' }}>Export JSON</button>
      </div>
    </div>
  );
};
