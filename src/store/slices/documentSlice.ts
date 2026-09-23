import type { StateCreator } from 'zustand';
import type { MindMapState, DocumentSlice } from './types';
import { normalizeTwoWayDocument, getLayoutType } from '../../utils/layoutUtils';
import { createHistorySnapshot } from './historySlice';

export const createDocumentSlice: StateCreator<MindMapState, [], [], DocumentSlice> = (set) => ({
  documentId: null,
  documentTitle: 'Untitled Mind Map',
  templateId: undefined,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedDocumentId: null,
  shareEnabled: false,
  shareId: null,

  setUpdatedAt: (timestamp) => {
    set({ updatedAt: timestamp });
  },

  setTitle: (title) => {
    set({ documentTitle: title });
  },

  setDeletedDocumentId: (id) => {
    set({ deletedDocumentId: id });
  },

  setShareConfig: (enabled, shareId) => {
    set((state) => ({ 
      shareEnabled: enabled, 
      shareId: shareId !== undefined ? shareId : state.shareId 
    }));
  },

  loadDocument: (id, title, nodes, edges, viewport, templateId, createdAt, updatedAt, shareEnabled, shareId) => {
    const now = Date.now();
    let finalNodes = nodes;
    
    if (getLayoutType(templateId) === 'two-way') {
      finalNodes = normalizeTwoWayDocument(nodes, edges);
    }
    
    // We need computeHasChildrenMap here. Let's just import it at the top or compute it here inline since it's just edges.
    const hasChildrenMap: Record<string, boolean> = {};
    edges.forEach(e => {
      hasChildrenMap[e.source] = true;
    });

    set({ 
      documentId: id, 
      documentTitle: title, 
      nodes: finalNodes, 
      edges, 
      hasChildrenMap,
      viewport,
      templateId,
      createdAt: createdAt ?? now,
      updatedAt: updatedAt ?? now,
      history: [createHistorySnapshot(finalNodes, edges)],
      historyIndex: 0,
      selectedNodeIds: [],
      editingNodeId: null,
      contextMenu: null,
      isDragging: false,
      deletedDocumentId: null,
      shareEnabled: shareEnabled ?? false,
      shareId: shareId ?? null,
    });
  },

  closeDocument: () => {
    set({
      documentId: null,
      documentTitle: 'Untitled Mind Map',
      templateId: undefined,
      nodes: [],
      edges: [],
      hasChildrenMap: {},
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: [],
      historyIndex: 0,
      selectedNodeIds: [],
      editingNodeId: null,
      contextMenu: null,
      isDragging: false,
      deletedDocumentId: null,
    });
  }
});
