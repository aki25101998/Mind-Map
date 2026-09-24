import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MindMapCanvas } from '../canvas/MindMapCanvas';
import { useMindMapStore } from '../store/useMindMapStore';
import { ReactFlowProvider } from '@xyflow/react';
import { getPublicSharedDocument, saveSharedCloudDocument, type PublicSharedDocument } from '../persistence/firestore';
import { Sun, Moon } from 'lucide-react';

export const SharePage = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { loadDocument, closeDocument, setIsReadOnly, documentTitle, theme, toggleTheme, isReadOnly } = useMindMapStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedDocInfo, setSharedDocInfo] = useState<PublicSharedDocument | null>(null);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
           setSharedDocInfo(doc);
           const canEdit = doc.sharePermission === 'edit';
           setIsReadOnly(!canEdit);
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
             doc.shareId,
             doc.sharePermission
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

  // Handle saving if edit permission is granted
  useEffect(() => {
    if (isReadOnly || !sharedDocInfo || !sharedDocInfo.ownerId) return;

    const unsubscribe = useMindMapStore.subscribe((state, prevState) => {
      if (!state.documentId || state.documentId !== sharedDocInfo.id) return;

      const isChanged = 
        state.historyIndex !== prevState.historyIndex || 
        state.documentTitle !== prevState.documentTitle ||
        state.viewport.x !== prevState.viewport.x ||
        state.viewport.y !== prevState.viewport.y ||
        state.viewport.zoom !== prevState.viewport.zoom;

      if (isChanged && !state.isDragging) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSyncStatus('saving');

        saveTimeoutRef.current = setTimeout(async () => {
          const currentState = useMindMapStore.getState();
          const docToSave = {
            id: currentState.documentId!,
            title: currentState.documentTitle,
            nodes: currentState.nodes,
            edges: currentState.edges,
            viewport: currentState.viewport,
            templateId: currentState.templateId,
            createdAt: currentState.createdAt,
            updatedAt: Date.now(),
            shareEnabled: currentState.shareEnabled,
            shareId: currentState.shareId || undefined,
            sharePermission: currentState.sharePermission,
          };

          try {
            await saveSharedCloudDocument(sharedDocInfo.ownerId, docToSave);
            setSyncStatus('saved');
          } catch (err) {
            console.error('Failed to save shared document:', err);
            setSyncStatus('error');
          }
        }, 1000);
      }
    });

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [isReadOnly, sharedDocInfo]);
  
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
       {/* Shared header */}
       <div style={{ padding: '12px 20px', background: 'var(--panel-bg)', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{documentTitle}</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!isReadOnly && (
              <span style={{ fontSize: '12px', color: syncStatus === 'error' ? 'var(--node-color-red)' : 'var(--text-secondary)' }}>
                {syncStatus === 'saving' ? 'Saving...' : syncStatus === 'error' ? 'Save failed' : 'Saved'}
              </span>
            )}
            
            <button 
              type="button"
              onClick={toggleTheme}
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                padding: '6px', borderRadius: 'var(--radius-md)', 
                background: 'transparent', color: 'var(--text-primary)', 
                border: '1px solid var(--border-subtle)', cursor: 'pointer' 
              }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <div style={{ 
              padding: '4px 10px', 
              background: isReadOnly ? 'var(--node-color-yellow)' : 'var(--node-color-green)', 
              color: isReadOnly ? '#000' : '#fff', 
              borderRadius: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' 
            }}>
              {isReadOnly ? 'VIEW ONLY' : 'CAN EDIT'}
            </div>
          </div>
       </div>
       <ReactFlowProvider>
          <div style={{ flex: 1, position: 'relative' }}>
             <MindMapCanvas />
          </div>
       </ReactFlowProvider>
    </div>
  );
};
