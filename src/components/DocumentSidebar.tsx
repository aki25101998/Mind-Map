import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMindMapStore } from '../store/useMindMapStore';
import { useShallow } from 'zustand/react/shallow';
import { loadAllDocuments, removeDocument, syncDocument } from '../persistence/persistenceService';
import type { MindMapDocument } from '../types';
import { FileText, Home, Plus, Trash2, X } from 'lucide-react';
import { validateDocument } from '../utils/validation';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ConfirmModal } from './ConfirmModal';

interface DocumentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentSidebar = ({ isOpen, onClose }: DocumentSidebarProps) => {
  const { documentId, closeDocument, setDeletedDocumentId } = useMindMapStore(useShallow(state => ({
    documentId: state.documentId,
    closeDocument: state.closeDocument,
    setDeletedDocumentId: state.setDeletedDocumentId
  })));
  const [documents, setDocuments] = useState<MindMapDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const loadRecentDocs = () => {
    loadAllDocuments()
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
      loadAllDocuments()
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleteTarget) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, deleteTarget, onClose]);

  const handleOpenDoc = (doc: MindMapDocument) => {
    try {
      const validDoc = validateDocument(doc);
      onClose();
      navigate(`/mindmaps/${validDoc.id}`);
    } catch (err) {
      console.error('Failed to load document:', err);
      alert('This document is corrupted and cannot be loaded.');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, doc: MindMapDocument) => {
    e.stopPropagation();
    setDeleteTarget({ id: doc.id, title: doc.title || 'Untitled Mind Map' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await removeDocument(deleteTarget.id);
      if (deleteTarget.id === documentId) {
        setDeletedDocumentId(deleteTarget.id);
        closeDocument();
        navigate('/mindmaps');
      }
      loadRecentDocs();
    } catch (err) {
      console.error('Failed to delete document from sidebar:', err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleNewDocument = async () => {
    onClose();
    const newDocId = uuidv4();
    const now = Date.now();
    const newDoc: MindMapDocument = {
      id: newDocId,
      title: 'Untitled Mind Map',
      nodes: [
        { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Main Idea' } }
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      templateId: 'blank',
      createdAt: now,
      updatedAt: now
    };
    await syncDocument(newDoc);
    navigate(`/mindmaps/${newDocId}`);
  };

  const handleHome = () => {
    onClose();
    navigate('/mindmaps');
  };

  if (!isOpen) return null;

  const content = (
    <>
      {/* Backdrop */}
      <div 
        className="document-sidebar-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 'var(--z-sidebar-backdrop, 400)',
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)'
        }} 
      />
      
      {/* Sidebar */}
      <div 
        className="document-sidebar-panel"
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, width: '300px',
          background: 'var(--panel-bg)', borderRight: '1px solid var(--panel-border)',
          zIndex: 'var(--z-sidebar, 500)', display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)', color: 'var(--text-primary)'
        }}
      >
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
            onClick={handleNewDocument}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '10px 14px', 
              background: 'var(--gradient-primary)', border: 'none', color: '#ffffff', 
              borderRadius: 'var(--radius-lg)', cursor: 'pointer', textAlign: 'left', fontWeight: '700', fontSize: '14px',
              boxShadow: 'var(--accent-glow)', transition: 'transform var(--transition-bounce)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
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
                  type="button"
                  onClick={(e) => handleDeleteClick(e, doc)}
                  title="Delete Mind Map"
                  aria-label="Delete Mind Map"
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Mind Map?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All nodes, connections and notes in this map will be permanently removed.`}
        confirmLabel="Delete Map"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />
    </>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};
