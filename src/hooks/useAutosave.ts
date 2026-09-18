import { useEffect, useRef } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { saveDocument } from '../persistence/idb';
import type { MindMapDocument } from '../types';

export const useAutosave = () => {
  const setSyncStatus = useMindMapStore(state => state.setSyncStatus);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRequestIdRef = useRef<number>(0);
  const savePromiseRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const unsubscribe = useMindMapStore.subscribe((state, prevState) => {
      // Handle document switch or close: immediately flush save for the old document
      if (prevState.documentId && state.documentId !== prevState.documentId) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        const docToSave: MindMapDocument = {
          id: prevState.documentId,
          title: prevState.documentTitle,
          nodes: prevState.nodes,
          edges: prevState.edges,
          viewport: prevState.viewport,
          templateId: prevState.templateId,
          createdAt: prevState.createdAt,
          updatedAt: Date.now(),
        };

        savePromiseRef.current = savePromiseRef.current
          .then(() => saveDocument(docToSave))
          .catch(err => console.error('Failed to flush save old document:', err));
      }

      if (!state.documentId) return;

      const isDocumentChanged = 
        state.documentId === prevState.documentId && // Only auto-save if we are still on the same doc
        (state.historyIndex !== prevState.historyIndex || 
        state.documentTitle !== prevState.documentTitle ||
        state.viewport.x !== prevState.viewport.x ||
        state.viewport.y !== prevState.viewport.y ||
        state.viewport.zoom !== prevState.viewport.zoom);

      if (isDocumentChanged && !state.isDragging) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        state.setSyncStatus('saving');
        const currentSaveRequestId = ++saveRequestIdRef.current;
        const currentDocId = state.documentId;

        timeoutRef.current = setTimeout(() => {
          // Re-fetch current state to ensure we save the absolute latest
          const currentState = useMindMapStore.getState();
          // Abort if the document was switched while the timeout was pending
          if (currentState.documentId !== currentDocId) return;
          
          const now = Date.now();
          
          const doc: MindMapDocument = {
            id: currentState.documentId!,
            title: currentState.documentTitle,
            nodes: currentState.nodes,
            edges: currentState.edges,
            viewport: currentState.viewport,
            templateId: currentState.templateId,
            createdAt: currentState.createdAt,
            updatedAt: now,
          };

          savePromiseRef.current = savePromiseRef.current.then(async () => {
            try {
              await saveDocument(doc);
              if (saveRequestIdRef.current === currentSaveRequestId) {
                const finalState = useMindMapStore.getState();
                if (finalState.documentId === currentDocId) {
                  finalState.setUpdatedAt(now);
                  finalState.setSyncStatus('saved');
                }
              }
            } catch (err) {
              console.error('Failed to autosave document:', err);
              if (saveRequestIdRef.current === currentSaveRequestId) {
                const finalState = useMindMapStore.getState();
                if (finalState.documentId === currentDocId) {
                  finalState.setSyncStatus('error');
                }
              }
            }
          }).catch(err => {
            console.error('Error in save queue', err);
          });
        }, 1000);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleOnline = () => setSyncStatus('saved');
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setSyncStatus]);
};
