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

  setUpdatedAt: (timestamp) => {
    set({ updatedAt: timestamp });
  },

  setTitle: (title) => {
    set({ documentTitle: title });
  },

  loadDocument: (id, title, nodes, edges, viewport, templateId, createdAt, updatedAt) => {
    const now = Date.now();
    let finalNodes = nodes;
    
    if (getLayoutType(templateId) === 'two-way') {
      finalNodes = normalizeTwoWayDocument(nodes, edges);
    }
    
    set({ 
      documentId: id, 
      documentTitle: title, 
      nodes: finalNodes, 
      edges, 
      viewport,
      templateId,
      createdAt: createdAt ?? now,
      updatedAt: updatedAt ?? now,
      history: [createHistorySnapshot(finalNodes, edges)],
      historyIndex: 0,
      selectedNodeIds: [],
      editingNodeId: null,
      contextMenu: null,
    });
  },

  closeDocument: () => {
    set({
      documentId: null,
      documentTitle: 'Untitled Mind Map',
      templateId: undefined,
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: [],
      historyIndex: 0,
      selectedNodeIds: [],
      editingNodeId: null,
      contextMenu: null,
    });
  }
});
