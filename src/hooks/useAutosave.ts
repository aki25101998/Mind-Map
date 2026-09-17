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
      if (!state.documentId) return;

      const isDocumentChanged = 
        state.historyIndex !== prevState.historyIndex || 
        state.documentTitle !== prevState.documentTitle ||
        state.viewport.x !== prevState.viewport.x ||
        state.viewport.y !== prevState.viewport.y ||
        state.viewport.zoom !== prevState.viewport.zoom;

      if (isDocumentChanged && !state.isDragging) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        state.setSyncStatus('saving');
        const currentSaveRequestId = ++saveRequestIdRef.current;

        timeoutRef.current = setTimeout(() => {
          // Re-fetch current state to ensure we save the absolute latest
          const currentState = useMindMapStore.getState();
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
                finalState.setUpdatedAt(now);
                finalState.setSyncStatus('saved');
              }
            } catch (err) {
              console.error('Failed to autosave document:', err);
              if (saveRequestIdRef.current === currentSaveRequestId) {
                useMindMapStore.getState().setSyncStatus('error');
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
