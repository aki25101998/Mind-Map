import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import type { NodeData } from '../../types';

interface UseNodeEditingProps {
  id: string;
  dataLabel: string;
  isEditing: boolean;
  isReadOnly: boolean;
  setEditingNodeId: (id: string | null) => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
}

export function useNodeEditing({
  id,
  dataLabel,
  isEditing,
  isReadOnly,
  setEditingNodeId,
  updateNodeData
}: UseNodeEditingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draftLabel, setDraftLabel] = useState<string | null>(null);
  const [editDimensions, setEditDimensions] = useState<{ width: number; height: number } | null>(null);

  // If draftLabel is active, use it; otherwise fallback to canonical dataLabel from store
  const label = isEditing && draftLabel !== null ? draftLabel : dataLabel;

  useLayoutEffect(() => {
    if (isEditing) {
      if (!editDimensions && containerRef.current) {
        const el = containerRef.current;
        const width = el.offsetWidth;
        const height = el.offsetHeight;
        if (width > 0 && height > 0) {
          setEditDimensions({ width, height });
        }
      }
    } else {
      if (draftLabel !== null) {
        setDraftLabel(null);
      }
      if (editDimensions !== null) {
        setEditDimensions(null);
      }
    }
  }, [isEditing, editDimensions, draftLabel]);

  const handleStartEditing = useCallback(() => {
    if (isReadOnly) return;
    if (containerRef.current) {
      const el = containerRef.current;
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      if (width > 0 && height > 0) {
        setEditDimensions({ width, height });
      }
    }
    setDraftLabel(dataLabel);
    setEditingNodeId(id);
  }, [id, isReadOnly, dataLabel, setEditingNodeId]);

  const handleBlur = useCallback(() => {
    const finalLabel = draftLabel !== null ? draftLabel : dataLabel;
    setEditingNodeId(null);
    setDraftLabel(null);
    setEditDimensions(null);
    if (finalLabel !== dataLabel) {
      updateNodeData(id, { label: finalLabel });
    }
  }, [id, draftLabel, dataLabel, setEditingNodeId, updateNodeData]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDraftLabel(null);
      setEditDimensions(null);
      setEditingNodeId(null);
    }
  }, [handleBlur, setEditingNodeId]);

  // CSS dimension locking rules for edit mode
  const dimensionStyle: React.CSSProperties = isEditing && editDimensions ? {
    width: `${editDimensions.width}px`,
    height: `${editDimensions.height}px`,
    minWidth: `${editDimensions.width}px`,
    maxWidth: `${editDimensions.width}px`,
    minHeight: `${editDimensions.height}px`,
    maxHeight: `${editDimensions.height}px`,
    boxSizing: 'border-box',
    transition: 'none'
  } : {
    boxSizing: 'border-box'
  };

  return {
    containerRef,
    label,
    setLabel: setDraftLabel,
    editDimensions,
    dimensionStyle,
    handleStartEditing,
    handleBlur,
    handleKeyDown
  };
}
