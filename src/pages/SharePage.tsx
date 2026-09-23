import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MindMapCanvas } from '../canvas/MindMapCanvas';
import { useMindMapStore } from '../store/useMindMapStore';
import { ReactFlowProvider } from '@xyflow/react';
import { getPublicSharedDocument } from '../persistence/firestore';

export const SharePage = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { loadDocument, closeDocument, setIsReadOnly, documentTitle } = useMindMapStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchDoc = async () => {
      if (!shareId) {
        setError('Invalid share link.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const doc = await getPublicSharedDocument(shareId);
        if (!mounted) return;

        if (doc) {
           setIsReadOnly(true);
           loadDocument(
             doc.id, 
             doc.title, 
             doc.nodes, 
             doc.edges, 
             doc.viewport, 
             doc.templateId || 'blank', 
             doc.createdAt, 
             doc.updatedAt, 
             doc.shareEnabled, 
             doc.shareId
           );
        } else {
           setError('This Mind Map is no longer shared or does not exist.');
        }
      } catch (err) {
        if (mounted) setError('Failed to load shared mind map.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    fetchDoc();
    
    return () => { 
      mounted = false; 
      closeDocument(); 
      setIsReadOnly(false); 
    };
  }, [shareId, loadDocument, closeDocument, setIsReadOnly]);
  
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

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', 
        background: 'var(--canvas-bg)', color: 'var(--text-primary)'
      }}>
        <h2 style={{ marginBottom: '16px' }}>{error}</h2>
        <button 
          onClick={() => navigate('/')}
          style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--text-primary)', color: 'var(--canvas-bg)', border: 'none', cursor: 'pointer' }}
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
       {/* Read-only header */}
       <div style={{ padding: '16px', background: 'var(--panel-bg)', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <h3 style={{ margin: 0 }}>{documentTitle}</h3>
          <div style={{ padding: '4px 8px', background: 'var(--node-color-yellow)', color: '#000', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>VIEW ONLY</div>
       </div>
       <ReactFlowProvider>
          <div style={{ flex: 1, position: 'relative' }}>
             <MindMapCanvas />
          </div>
       </ReactFlowProvider>
    </div>
  );
};
