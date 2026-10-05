import React, { useState, useRef, useCallback } from 'react';
import { useInternalNode } from '@xyflow/react';
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
  const internalNode = useInternalNode(id);

  const [draftLabel, setDraftLabel] = useState<string | null>(null);
  const [editDimensions, setEditDimensions] = useState<{ width: number; height: number } | null>(null);

  // Helper to capture current canonical dimensions in callbacks:
  // 1. Prefer React Flow measured dimensions
  // 2. Fallback to DOM element bounding box if measured is not yet populated
  const getCanonicalDimensions = useCallback((): { width: number; height: number } | null => {
    const measuredW = internalNode?.measured?.width;
    const measuredH = internalNode?.measured?.height;
    if (typeof measuredW === 'number' && typeof measuredH === 'number' && measuredW > 0 && measuredH > 0) {
      return { width: Math.round(measuredW), height: Math.round(measuredH) };
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return { width: Math.round(rect.width), height: Math.round(rect.height) };
      }
    }

    return null;
  }, [internalNode]);

  // Synchronously resolve canonical dimensions from React Flow hook if editDimensions state is not yet set
  const measuredW = internalNode?.measured?.width;
  const measuredH = internalNode?.measured?.height;
  const fallbackDims = (typeof measuredW === 'number' && typeof measuredH === 'number' && measuredW > 0 && measuredH > 0)
    ? { width: Math.round(measuredW), height: Math.round(measuredH) }
    : null;

  const activeDims = editDimensions || (isEditing ? fallbackDims : null);

  // If draftLabel is active, use it; otherwise fallback to canonical dataLabel from store
  const label = isEditing && draftLabel !== null ? draftLabel : dataLabel;

  const handleStartEditing = useCallback(() => {
    if (isReadOnly) return;
    
    // Synchronously capture geometry BEFORE activating editing mode
    const dims = getCanonicalDimensions();
    if (dims) {
      setEditDimensions(dims);
    }
    
    setDraftLabel(dataLabel);
    setEditingNodeId(id);
  }, [id, isReadOnly, dataLabel, setEditingNodeId, getCanonicalDimensions]);

  const handleBlur = useCallback(() => {
    const finalLabel = draftLabel !== null ? draftLabel : dataLabel;
    
    // Capture post-edit geometry from container if available to get actual rendered height
    let finalDims = editDimensions || getCanonicalDimensions();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        finalDims = { width: Math.round(rect.width), height: Math.round(rect.height) };
      }
    }

    setEditingNodeId(null);
    setDraftLabel(null);
    setEditDimensions(null);

    if (finalLabel !== dataLabel) {
      updateNodeData(id, {
        label: finalLabel,
        ...(finalDims ? { width: finalDims.width, height: finalDims.height } : {})
      });
    }
  }, [id, draftLabel, dataLabel, editDimensions, getCanonicalDimensions, setEditingNodeId, updateNodeData]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
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

  // CSS dimension locking rules:
  // When editing, lock width to prevent horizontal jump, but allow height to expand naturally
  const dimensionStyle: React.CSSProperties = isEditing && activeDims ? {
    width: `${activeDims.width}px`,
    minWidth: `${activeDims.width}px`,
    maxWidth: `${activeDims.width}px`,
    minHeight: `${activeDims.height}px`,
    boxSizing: 'border-box',
    transition: 'none'
  } : {
    boxSizing: 'border-box'
  };

  return {
    containerRef,
    label,
    setLabel: setDraftLabel,
    editDimensions: activeDims,
    dimensionStyle,
    handleStartEditing,
    handleBlur,
    handleKeyDown
  };
}
