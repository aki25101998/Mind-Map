import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MindMapCanvas } from '../canvas/MindMapCanvas';
import { useMindMapStore } from '../store/useMindMapStore';
import { ReactFlowProvider } from '@xyflow/react';
import { getPublicSharedDocument, saveSharedCloudDocument, type PublicSharedDocument } from '../persistence/firestore';
import { Sun, Moon, Sparkles } from 'lucide-react';

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
            sharePermission: currentState.sharePermission || 'view',
            ownerId: sharedDocInfo.ownerId
          };

          try {
            await saveSharedCloudDocument(sharedDocInfo.ownerId, docToSave);
            setSyncStatus('saved');
          } catch (err) {
            console.error('Failed to sync shared edit:', err);
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
        background: 'var(--canvas-ambient)', color: 'var(--text-primary)'
      }}>
        <div style={{
          width: '38px', height: '38px', border: '3.5px solid var(--border-subtle)',
          borderTopColor: 'var(--accent)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', 
        background: 'var(--canvas-ambient)', color: 'var(--text-primary)', padding: '24px', textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '16px', fontSize: '22px', fontWeight: '700' }}>{error}</h2>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '10px 22px', borderRadius: 'var(--radius-lg)',
            background: 'var(--gradient-primary)', color: '#ffffff',
            border: 'none', cursor: 'pointer', fontWeight: '700',
            boxShadow: 'var(--accent-glow)'
          }}
        >
          Go to Studio
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
       {/* Shared creative header */}
       <div style={{
         padding: '12px 24px', background: 'var(--panel-bg)',
         borderBottom: '1.5px solid var(--panel-border)', display: 'flex',
         justifyContent: 'space-between', alignItems: 'center', zIndex: 10,
         boxShadow: 'var(--shadow-sm)'
       }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{documentTitle}</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!isReadOnly && (
              <span style={{ fontSize: '12px', fontWeight: '600', color: syncStatus === 'error' ? 'var(--node-color-red)' : 'var(--text-secondary)' }}>
                {syncStatus === 'saving' ? 'Saving...' : syncStatus === 'error' ? 'Save failed' : 'Saved'}
              </span>
            )}
            
            <button 
              type="button"
              onClick={toggleTheme}
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                padding: '7px', borderRadius: 'var(--radius-md)', 
                background: 'transparent', color: 'var(--text-primary)', 
                border: '1px solid var(--border-subtle)', cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} color="var(--accent)" /> : <Moon size={16} color="var(--accent-secondary)" />}
            </button>

            <div style={{ 
              padding: '4px 12px', 
              background: isReadOnly ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
              color: isReadOnly ? 'var(--node-color-yellow)' : 'var(--node-color-green)', 
              border: isReadOnly ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-pill)', fontSize: '11px', fontWeight: '800', letterSpacing: '0.04em' 
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
