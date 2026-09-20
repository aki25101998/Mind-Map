import type { Node, Connection, EdgeChange, NodeChange, Viewport } from '@xyflow/react';
import type { MindMapNode, MindMapEdge } from '../../types';

export type HistorySnapshot = {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
};

export interface DocumentSlice {
  documentId: string | null;
  documentTitle: string;
  templateId: string | undefined;
  createdAt: number;
  updatedAt: number;
  deletedDocumentId: string | null;
  loadDocument: (
    id: string, 
    title: string, 
    nodes: MindMapNode[], 
    edges: MindMapEdge[], 
    viewport: Viewport,
    templateId: string,
    createdAt: number,
    updatedAt: number
  ) => void;
  closeDocument: () => void;
  setUpdatedAt: (timestamp: number) => void;
  setTitle: (title: string) => void;
  setDeletedDocumentId: (id: string | null) => void;
}

export interface NodeEdgeSlice {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  hasChildrenMap: Record<string, boolean>;
  viewport: Viewport;
  onNodesChange: (changes: NodeChange<MindMapNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<MindMapEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: MindMapNode[]) => void;
  setEdges: (edges: MindMapEdge[]) => void;
  addNode: (node: MindMapNode) => void;
  deleteSelected: () => void;
  deleteNodeById: (id: string) => void;
  updateNodeData: (id: string, data: Partial<MindMapNode['data']>) => void;
  updateNodeType: (id: string, type: MindMapNode['type']) => void;
  updateEdge: (id: string, data: Partial<MindMapEdge>) => void;
  updateOutgoingEdges: (sourceId: string, data: Partial<MindMapEdge['data']>) => void;
  setViewport: (viewport: Viewport) => void;
  createChildNode: (parentId: string) => void;
  createSiblingNode: (nodeId: string) => void;
  updateNodePositions: (draggedNodes: Node[]) => void;
  toggleCollapse: (nodeId: string) => void;
  autoLayout: () => void;
}

export interface HistorySlice {
  history: HistorySnapshot[];
  historyIndex: number;
  commitHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

export interface ContextMenuState {
  x: number;
  y: number;
  target: 'canvas' | 'node';
  id?: string;
}

export interface EditorSlice {
  selectedNodeIds: string[];
  clipboardNodes: MindMapNode[];
  clipboardEdges: MindMapEdge[];
  isSaving: boolean; // Keep for backward compatibility
  saveError: string | null; // Keep for backward compatibility
  syncStatus: SyncStatus;
  isDragging: boolean;
  editingNodeId: string | null;
  contextMenu: ContextMenuState | null;
  setIsSaving: (saving: boolean) => void;
  setSaveError: (error: string | null) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setIsDragging: (isDragging: boolean) => void;
  setEditingNodeId: (id: string | null) => void;
  setContextMenu: (menu: ContextMenuState | null) => void;
  setSelectedNodes: (ids: string[]) => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  pasteFromClipboard: () => void;
}

export type MindMapState = DocumentSlice & NodeEdgeSlice & HistorySlice & EditorSlice;
