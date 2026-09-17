import { create } from 'zustand';
import type { MindMapState } from './slices/types';
import { createDocumentSlice } from './slices/documentSlice';
import { createHistorySlice } from './slices/historySlice';
import { createNodeEdgeSlice } from './slices/nodeEdgeSlice';
import { createEditorSlice } from './slices/editorSlice';

export const useMindMapStore = create<MindMapState>()((...a) => ({
  ...createDocumentSlice(...a),
  ...createHistorySlice(...a),
  ...createNodeEdgeSlice(...a),
  ...createEditorSlice(...a),
}));

export * from './slices/types';
export * from './slices/historySlice';
