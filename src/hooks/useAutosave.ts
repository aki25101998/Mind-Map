import { useEffect, useRef, useCallback } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { syncDocument } from '../persistence/persistenceService';
import type { MindMapDocument } from '../types';

export const useAutosave = () => {
  const setSyncStatus = useMindMapStore(state => state.setSyncStatus);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRequestIdRef = useRef<number>(0);
  const savePromiseRef = useRef<Promise<void>>(Promise.resolve());
  const hasPendingChangesRef = useRef<boolean>(false);
  const lastDirtyDocRef = useRef<MindMapDocument | null>(null);

  const flushSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!hasPendingChangesRef.current || !lastDirtyDocRef.current) {
      return;
    }

    const docToSave = {
      ...lastDirtyDocRef.current,
      updatedAt: Date.now()
    };
    hasPendingChangesRef.current = false;

    savePromiseRef.current = savePromiseRef.current
      .then(async () => {
        const result = await syncDocument(docToSave);
        const finalState = useMindMapStore.getState();
        if (finalState.documentId === docToSave.id) {
          finalState.setUpdatedAt(docToSave.updatedAt);
          if (!result.success) {
            finalState.setSyncStatus(navigator.onLine ? 'error' : 'offline');
          } else {
            finalState.setSyncStatus('saved');
          }
        }
      })
      .catch(err => {
        console.error('Failed to flush save document:', err);
      });
  }, []);

  useEffect(() => {
    const handleFlush = () => {
      flushSave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSave();
      }
    };


    window.addEventListener('beforeunload', handleFlush);
    window.addEventListener('pagehide', handleFlush);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const unsubscribe = useMindMapStore.subscribe((state, prevState) => {
      // Handle document switch or close: immediately flush save for the old document
      if (prevState.documentId && state.documentId !== prevState.documentId) {
        if (state.deletedDocumentId === prevState.documentId) {
          // Document was just deleted, cancel pending save and DO NOT flush
          hasPendingChangesRef.current = false;
          lastDirtyDocRef.current = null;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          return;
        }

        // Flush any pending save for the previous document
        flushSave();
      }

      if (!state.documentId) return;

      const isDocumentChanged = 
        state.documentId === prevState.documentId && // Only auto-save if we are still on the same doc
        (state.revision !== prevState.revision || 
        state.documentTitle !== prevState.documentTitle ||
        state.viewport.x !== prevState.viewport.x ||
        state.viewport.y !== prevState.viewport.y ||
        state.viewport.zoom !== prevState.viewport.zoom ||
        state.shareEnabled !== prevState.shareEnabled ||
        state.shareId !== prevState.shareId);

      if (isDocumentChanged && !state.isDragging) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        state.setSyncStatus('saving');
        hasPendingChangesRef.current = true;
        const currentSaveRequestId = ++saveRequestIdRef.current;
        const currentDocId = state.documentId;

        const currentDoc: MindMapDocument = {
          id: state.documentId,
          title: state.documentTitle,
          nodes: state.nodes,
          edges: state.edges,
          viewport: state.viewport,
          templateId: state.templateId,
          createdAt: state.createdAt,
          updatedAt: Date.now(),
          shareEnabled: state.shareEnabled,
          shareId: state.shareId || undefined,
          sharePermission: state.sharePermission || 'view',
        };
        lastDirtyDocRef.current = currentDoc;

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
            shareEnabled: currentState.shareEnabled,
            shareId: currentState.shareId || undefined,
            sharePermission: currentState.sharePermission || 'view',
          };
          lastDirtyDocRef.current = doc;

          savePromiseRef.current = savePromiseRef.current.then(async () => {
            try {
              const result = await syncDocument(doc);
              hasPendingChangesRef.current = false;
              if (saveRequestIdRef.current === currentSaveRequestId) {
                const finalState = useMindMapStore.getState();
                if (finalState.documentId === currentDocId) {
                  finalState.setUpdatedAt(now);
                  if (!result.success) {
                    finalState.setSyncStatus(navigator.onLine ? 'error' : 'offline');
                  } else {
                    finalState.setSyncStatus('saved');
                  }
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

    return () => {
      // Flush before unmounting
      flushSave();
      window.removeEventListener('beforeunload', handleFlush);
      window.removeEventListener('pagehide', handleFlush);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribe();
    };
  }, [flushSave]);

  useEffect(() => {
    const handleOnline = () => {
      // When back online, flush any pending save or set status
      flushSave();
      setSyncStatus('saved');
    };
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setSyncStatus, flushSave]);
};

