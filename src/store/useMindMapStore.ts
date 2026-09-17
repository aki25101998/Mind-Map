import { create } from 'zustand';
import { 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges
} from '@xyflow/react';
import type {
  Connection, 
  EdgeChange, 
  NodeChange, 
  Viewport
} from '@xyflow/react';
import type { MindMapNode, MindMapEdge } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface MindMapState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  viewport: Viewport;
  documentId: string | null;
  documentTitle: string;
  
  // Actions
  onNodesChange: (changes: NodeChange<MindMapNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<MindMapEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: MindMapNode[]) => void;
  setEdges: (edges: MindMapEdge[]) => void;
  addNode: (node: MindMapNode) => void;
  updateNodeData: (id: string, data: Partial<MindMapNode['data']>) => void;
  setViewport: (viewport: Viewport) => void;
  loadDocument: (id: string, title: string, nodes: MindMapNode[], edges: MindMapEdge[], viewport: Viewport) => void;
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  documentId: null,
  documentTitle: 'Untitled Mind Map',

  onNodesChange: (changes: NodeChange<MindMapNode>[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as MindMapNode[],
    });
  },
  onEdgesChange: (changes: EdgeChange<MindMapEdge>[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges) as MindMapEdge[],
    });
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge({ ...connection, id: uuidv4(), type: 'smooth' }, get().edges) as MindMapEdge[],
    });
  },
  setNodes: (nodes: MindMapNode[]) => {
    set({ nodes });
  },
  setEdges: (edges: MindMapEdge[]) => {
    set({ edges });
  },
  addNode: (node: MindMapNode) => {
    set({ nodes: [...get().nodes, node] });
  },
  updateNodeData: (id: string, data: Partial<MindMapNode['data']>) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
    });
  },
  setViewport: (viewport: Viewport) => {
    set({ viewport });
  },
  loadDocument: (id, title, nodes, edges, viewport) => {
    set({ documentId: id, documentTitle: title, nodes, edges, viewport });
  }
}));
