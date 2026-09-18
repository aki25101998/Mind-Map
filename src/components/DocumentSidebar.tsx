import { useEffect, useState } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { useShallow } from 'zustand/react/shallow';
import { getAllDocuments, deleteDocument } from '../persistence/idb';
import type { MindMapDocument } from '../types';
import { FileText, Home, Plus, Trash2, X } from 'lucide-react';
import { validateDocument } from '../utils/validation';

interface DocumentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentSidebar = ({ isOpen, onClose }: DocumentSidebarProps) => {
  const { documentId, loadDocument, closeDocument } = useMindMapStore(useShallow(state => ({
    documentId: state.documentId,
    loadDocument: state.loadDocument,
    closeDocument: state.closeDocument
  })));
  const [documents, setDocuments] = useState<MindMapDocument[]>([]);

  const loadRecentDocs = () => {
    getAllDocuments().then(docs => {
      setDocuments(docs.sort((a, b) => b.updatedAt - a.updatedAt));
    });
  };

  useEffect(() => {
    let mounted = true;
    if (isOpen) {
      getAllDocuments().then(docs => {
        if (mounted) {
          setDocuments(docs.sort((a, b) => b.updatedAt - a.updatedAt));
        }
      });
    }
    return () => { mounted = false; };
  }, [isOpen]);

  const handleOpenDoc = (doc: MindMapDocument) => {
    try {
      const validDoc = validateDocument(doc);
      loadDocument(validDoc.id, validDoc.title, validDoc.nodes, validDoc.edges, validDoc.viewport, validDoc.templateId || 'blank', validDoc.createdAt, validDoc.updatedAt);
      onClose();
    } catch (err) {
      console.error('Failed to load document:', err);
      alert('This document is corrupted and cannot be loaded.');
    }
  };

  const handleDeleteDoc = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteDocument(id);
    if (id === documentId) {
      closeDocument();
    }
    loadRecentDocs();
  };

  const handleHome = () => {
    closeDocument();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)'
        }} 
      />
      
      {/* Sidebar */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: '300px',
        background: 'var(--panel-bg)', borderRight: '1px solid var(--panel-border)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow)', color: 'var(--text-primary)'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Documents</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid var(--panel-border)' }}>
          <button 
            onClick={handleHome}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', 
              background: 'transparent', border: 'none', color: 'var(--text-primary)', 
              borderRadius: '8px', cursor: 'pointer', textAlign: 'left'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--node-border-default)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Home size={18} /> Home Dashboard
          </button>
          
          <button 
            onClick={() => { closeDocument(); onClose(); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', 
              background: 'var(--accent)', border: 'none', color: '#fff', 
              borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold'
            }}
          >
            <Plus size={18} /> New Document
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 'bold' }}>
            Recent Maps
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {documents.map(doc => (
              <div 
                key={doc.id}
                onClick={() => handleOpenDoc(doc)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                  background: doc.id === documentId ? 'var(--node-border-default)' : 'transparent',
                  border: doc.id === documentId ? '1px solid var(--accent)' : '1px solid transparent'
                }}
                onMouseEnter={e => {
                  if (doc.id !== documentId) e.currentTarget.style.background = 'var(--node-border-default)';
                }}
                onMouseLeave={e => {
                  if (doc.id !== documentId) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                  <FileText size={16} color="var(--accent)" />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => handleDeleteDoc(e, doc.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--node-color-red)', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            
            {documents.length === 0 && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>
                No documents found.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
