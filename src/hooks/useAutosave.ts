import { useEffect, useRef } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { saveDocument } from '../persistence/idb';
import type { MindMapDocument } from '../types';

export const useAutosave = () => {
  const { 
    documentId, 
    documentTitle, 
    nodes, 
    edges, 
    viewport, 
    templateId, 
    createdAt,
    setIsSaving,
    setSaveError,
    setUpdatedAt
  } = useMindMapStore();

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRequestIdRef = useRef<number>(0);
  const savePromiseRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!documentId) return;

    // Debounce save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);
    const currentSaveRequestId = ++saveRequestIdRef.current;

    timeoutRef.current = setTimeout(() => {
      const now = Date.now();
      const doc: MindMapDocument = {
        id: documentId,
        title: documentTitle,
        nodes,
        edges,
        viewport,
        templateId,
        createdAt,
        updatedAt: now,
      };

      savePromiseRef.current = savePromiseRef.current.then(async () => {
        try {
          await saveDocument(doc);
          // Only update state if this is the most recent save request
          if (saveRequestIdRef.current === currentSaveRequestId) {
            setSaveError(null);
            setUpdatedAt(now);
            setIsSaving(false);
          }
        } catch (err) {
          console.error('Failed to autosave document:', err);
          if (saveRequestIdRef.current === currentSaveRequestId) {
            setSaveError('Save failed');
            setIsSaving(false);
          }
        }
      }).catch(err => {
        // Prevent promise chain from breaking
        console.error('Error in save queue', err);
      });
    }, 1000); // 1s debounce

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [documentId, documentTitle, nodes, edges, viewport, templateId, createdAt, setIsSaving, setSaveError, setUpdatedAt]); // trigger on any of these changes
};
