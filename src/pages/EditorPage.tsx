import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MindMapCanvas } from '../canvas/MindMapCanvas';
import { useMindMapStore } from '../store/useMindMapStore';
import { TopToolbar } from '../editor/TopToolbar';
import { BottomToolbar } from '../editor/BottomToolbar';
import { DocumentSidebar } from '../components/DocumentSidebar';
import { useAutosave } from '../hooks/useAutosave';
import { ReactFlowProvider } from '@xyflow/react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { loadDocument } from '../persistence/persistenceService';

export const EditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { documentId, loadDocument: setStoreDocument, closeDocument } = useMindMapStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize autosave
  useAutosave();

  useEffect(() => {
    let mounted = true;

    const fetchDoc = async () => {
      if (!id) {
        navigate('/mindmaps');
        return;
      }

      // If it's already loaded in store, just skip
      if (documentId === id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const doc = await loadDocument(id);
        if (!mounted) return;

        if (doc) {
          setStoreDocument(doc.id, doc.title, doc.nodes, doc.edges, doc.viewport, doc.templateId || 'blank', doc.createdAt, doc.updatedAt);
        } else {
          setError('Document not found or access denied.');
        }
      } catch (err) {
        console.error('Error loading document:', err);
        if (mounted) setError('Failed to load document.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchDoc();

    return () => {
      mounted = false;
    };
  }, [id, documentId, navigate, setStoreDocument]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', 
        background: 'var(--canvas-bg)', color: 'var(--text-primary)'
      }}>
        <div style={{
          width: '32px', height: '32px', border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--text-primary)', borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (error || !documentId) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', 
        background: 'var(--canvas-bg)', color: 'var(--text-primary)'
      }}>
        <h2 style={{ marginBottom: '16px' }}>{error || 'Document not found'}</h2>
        <button 
          onClick={() => navigate('/mindmaps')}
          style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--text-primary)', color: 'var(--canvas-bg)', border: 'none', cursor: 'pointer' }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <DocumentSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <ReactFlowProvider>
        <ErrorBoundary documentId={documentId} onReset={() => {
          closeDocument();
          navigate('/mindmaps');
        }}>
          <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <TopToolbar onMenuClick={() => setIsSidebarOpen(true)} />
            <MindMapCanvas />
            <BottomToolbar />
          </main>
        </ErrorBoundary>
      </ReactFlowProvider>
    </div>
  );
};
