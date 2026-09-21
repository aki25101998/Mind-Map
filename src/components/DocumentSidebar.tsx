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
  const { documentId, loadDocument, closeDocument, setDeletedDocumentId } = useMindMapStore(useShallow(state => ({
    documentId: state.documentId,
    loadDocument: state.loadDocument,
    closeDocument: state.closeDocument,
    setDeletedDocumentId: state.setDeletedDocumentId
  })));
  const [documents, setDocuments] = useState<MindMapDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRecentDocs = () => {
    getAllDocuments()
      .then(docs => {
        setDocuments(docs.sort((a, b) => b.updatedAt - a.updatedAt));
        setError(null);
      })
      .catch(err => {
        console.error('Failed to load recent docs:', err);
        setError('Unable to load documents. Please retry.');
      });
  };

  useEffect(() => {
    let mounted = true;
    if (isOpen) {
      getAllDocuments()
        .then(docs => {
          if (mounted) {
            setDocuments(docs.sort((a, b) => b.updatedAt - a.updatedAt));
            setError(null);
          }
        })
        .catch(err => {
          if (mounted) {
            console.error('Failed to load docs on open:', err);
            setError('Unable to load documents. Please retry.');
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
      setDeletedDocumentId(id);
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
        boxShadow: 'var(--shadow-lg)', color: 'var(--text-primary)'
      }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Documents</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: 'var(--radius-sm)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', borderBottom: '1px solid var(--panel-border)' }}>
          <button 
            onClick={handleHome}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', 
              background: 'transparent', border: 'none', color: 'var(--text-primary)', 
              borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '500'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Home size={16} /> Home Dashboard
          </button>
          
          <button 
            onClick={() => { closeDocument(); onClose(); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', 
              background: 'var(--text-primary)', border: 'none', color: 'var(--panel-bg)', 
              borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left', fontWeight: '600', fontSize: '14px'
            }}
          >
            <Plus size={16} /> New Document
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-3)', fontWeight: '600', letterSpacing: '0.05em' }}>
            Recent Maps
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {documents.map(doc => (
              <div 
                key={doc.id}
                onClick={() => handleOpenDoc(doc)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: doc.id === documentId ? 'var(--accent-soft)' : 'transparent',
                  border: doc.id === documentId ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={e => {
                  if (doc.id !== documentId) e.currentTarget.style.background = 'var(--social-bg)';
                }}
                onMouseLeave={e => {
                  if (doc.id !== documentId) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', overflow: 'hidden' }}>
                  <FileText size={16} color="var(--text-secondary)" />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
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
            
            {error ? (
              <div style={{ color: 'var(--node-color-red)', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>
                {error}
              </div>
            ) : documents.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>
                No documents found.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};
