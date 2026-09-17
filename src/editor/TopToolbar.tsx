import { useState } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { exportToJSON } from '../utils/exportUtils';
import { Undo, Redo, Download, Share2, ChevronLeft } from 'lucide-react';

export const TopToolbar = () => {
  const { documentTitle, setTitle, undo, redo, isSaving, nodes, edges, viewport, documentId, templateId } = useMindMapStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(documentTitle);

  const handleTitleSubmit = () => {
    setEditingTitle(false);
    if (titleInput.trim()) {
      setTitle(titleInput);
    } else {
      setTitleInput(documentTitle);
    }
  };

  const handleExport = () => {
    if (!documentId) return;
    exportToJSON({ id: documentId, title: documentTitle, nodes, edges, viewport, templateId, createdAt: Date.now(), updatedAt: Date.now() });
  };

  return (
    <div style={{
      position: 'absolute', top: '16px', left: '16px', right: '16px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      zIndex: 'var(--z-toolbar)', pointerEvents: 'none'
    }}>
      <div style={{
        background: 'var(--panel-bg)', padding: '8px 16px', borderRadius: 'var(--panel-radius)',
        border: '1px solid var(--panel-border)', pointerEvents: 'auto',
        boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <button 
          title="Back to Dashboard (Not Implemented)"
          style={{ display: 'flex', alignItems: 'center', background: 'transparent', color: 'var(--text-primary)', padding: 0 }}
          disabled
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ width: '1px', height: '20px', background: 'var(--panel-border)' }} />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={undo} style={{ padding: '6px', borderRadius: '6px', background: 'transparent', color: 'var(--text-primary)' }} title="Undo (Ctrl+Z)"><Undo size={18} /></button>
          <button onClick={redo} style={{ padding: '6px', borderRadius: '6px', background: 'transparent', color: 'var(--text-primary)' }} title="Redo (Ctrl+Shift+Z)"><Redo size={18} /></button>
        </div>
        <div style={{ width: '1px', height: '20px', background: 'var(--panel-border)' }} />
        <div 
          onDoubleClick={() => setEditingTitle(true)}
          style={{ fontWeight: '600', minWidth: '150px', cursor: 'text' }}
        >
          {editingTitle ? (
            <input 
              autoFocus
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={e => e.key === 'Enter' && handleTitleSubmit()}
              style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 'inherit', outline: 'none' }}
            />
          ) : (
            documentTitle
          )}
        </div>
      </div>
      
      <div style={{
        background: 'var(--panel-bg)', padding: '8px', borderRadius: 'var(--panel-radius)',
        border: '1px solid var(--panel-border)', pointerEvents: 'auto',
        boxShadow: 'var(--shadow)', display: 'flex', gap: '8px', alignItems: 'center'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '8px' }}>
          {isSaving ? 'Saving...' : 'Saved'}
        </div>
        <button 
          onClick={handleExport}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: 'var(--node-bg-default)', color: 'var(--text-primary)' }}
        >
          <Download size={16} /> Export
        </button>
        <button 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: 'var(--accent)', color: '#fff', border: 'none' }}
          disabled title="Future functionality"
        >
          <Share2 size={16} /> Share
        </button>
      </div>
    </div>
  );
};
