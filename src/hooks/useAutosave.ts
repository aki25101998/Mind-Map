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
    setIsSaving 
  } = useMindMapStore();

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!documentId) return;

    // Debounce save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);

    timeoutRef.current = setTimeout(async () => {
      const doc: MindMapDocument = {
        id: documentId,
        title: documentTitle,
        nodes,
        edges,
        viewport,
        templateId,
        createdAt: Date.now(), // Real implementation would track this properly
        updatedAt: Date.now(),
      };

      try {
        await saveDocument(doc);
      } catch (err) {
        console.error('Failed to autosave document:', err);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // 1s debounce

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [documentId, documentTitle, nodes, edges, viewport, templateId]); // trigger on any of these changes
};
