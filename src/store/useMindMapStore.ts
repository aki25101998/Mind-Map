import { create } from 'zustand';
import { 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  getConnectedEdges,
} from '@xyflow/react';
import type {
  Connection, 
  Edge,
  EdgeChange, 
  NodeChange, 
  Viewport
} from '@xyflow/react';
import type { MindMapNode, MindMapEdge } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { normalizeTwoWayDocument, findNonCollidingPosition, resolveNodeLayoutSide, getLayoutType } from '../utils/layoutUtils';

export type HistorySnapshot = {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
};

export interface MindMapState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  viewport: Viewport;
  documentId: string | null;
  documentTitle: string;
  templateId: string | undefined;
  createdAt: number;
  updatedAt: number;

  // History
  history: HistorySnapshot[];
  historyIndex: number;
  commitHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Editor State
  selectedNodeIds: string[];
  clipboardNodes: MindMapNode[];
  clipboardEdges: MindMapEdge[];
  isSaving: boolean;
  saveError: string | null;

  // Actions
  onNodesChange: (changes: NodeChange<MindMapNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<MindMapEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: MindMapNode[]) => void;
  setEdges: (edges: MindMapEdge[]) => void;
  addNode: (node: MindMapNode) => void;
  deleteSelected: () => void;
  updateNodeData: (id: string, data: Partial<MindMapNode['data']>) => void;
  updateEdge: (id: string, data: Partial<MindMapEdge>) => void;
  setViewport: (viewport: Viewport) => void;
  loadDocument: (id: string, title: string, nodes: MindMapNode[], edges: MindMapEdge[], viewport: Viewport, templateId?: string, createdAt?: number, updatedAt?: number) => void;
  setIsSaving: (saving: boolean) => void;
  setSaveError: (error: string | null) => void;
  setUpdatedAt: (timestamp: number) => void;
  setTitle: (title: string) => void;
  
  // Selection
  setSelectedNodes: (ids: string[]) => void;
  
  // Advanced Actions
  createChildNode: (parentId: string) => void;
  createSiblingNode: (nodeId: string) => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  pasteFromClipboard: () => void;
}

export const createHistorySnapshot = (nodes: MindMapNode[], edges: MindMapEdge[]): HistorySnapshot => {
  const strippedNodes = nodes.map(n => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { selected, dragging, resizing, measured, width, height, ...rest } = n;
    return rest as MindMapNode;
  });

  return {
    nodes: JSON.parse(JSON.stringify(strippedNodes)),
    edges: JSON.parse(JSON.stringify(edges))
  };
};

const MAX_HISTORY = 50;

export const useMindMapStore = create<MindMapState>((set, get) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  documentId: null,
  documentTitle: 'Untitled Mind Map',
  templateId: undefined,
  createdAt: Date.now(),
  updatedAt: Date.now(),

  history: [],
  historyIndex: -1,

  selectedNodeIds: [],
  clipboardNodes: [],
  clipboardEdges: [],
  isSaving: false,
  saveError: null,

  commitHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    
    const newSnapshot = createHistorySnapshot(nodes, edges);
    const currentSnapshot = history[historyIndex];

    if (
      currentSnapshot &&
      JSON.stringify(currentSnapshot.nodes) === JSON.stringify(newSnapshot.nodes) &&
      JSON.stringify(currentSnapshot.edges) === JSON.stringify(newSnapshot.edges)
    ) {
      return;
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSnapshot);

    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const snapshot = history[prevIndex];
      set({
        nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
        edges: JSON.parse(JSON.stringify(snapshot.edges)),
        historyIndex: prevIndex
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const snapshot = history[nextIndex];
      set({
        nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
        edges: JSON.parse(JSON.stringify(snapshot.edges)),
        historyIndex: nextIndex
      });
    }
  },

  onNodesChange: (changes: NodeChange<MindMapNode>[]) => {
    const newNodes = applyNodeChanges(changes, get().nodes) as MindMapNode[];
    
    // Update selection state
    const selectedIds = newNodes.filter(n => n.selected).map(n => n.id);
    
    set({ nodes: newNodes, selectedNodeIds: selectedIds });
  },

  onEdgesChange: (changes: EdgeChange<MindMapEdge>[]) => {
    const newEdges = applyEdgeChanges(changes, get().edges) as MindMapEdge[];
    set({ edges: newEdges });
  },

  onConnect: (connection: Connection) => {
    const newEdges = addEdge({ 
      ...connection, 
      id: uuidv4(), 
      type: 'mindmap-edge',
      data: { edgeStyle: 'curved' }
    } as Edge, get().edges) as MindMapEdge[];
    set({ edges: newEdges });
    get().commitHistory();
  },

  setNodes: (nodes: MindMapNode[]) => {
    set({ nodes });
    get().commitHistory();
  },

  setEdges: (edges: MindMapEdge[]) => {
    set({ edges });
    get().commitHistory();
  },

  addNode: (node: MindMapNode) => {
    set({ nodes: [...get().nodes, node] });
    get().commitHistory();
  },

  deleteSelected: () => {
    const { nodes, edges, selectedNodeIds } = get();
    if (selectedNodeIds.length === 0) return;

    const remainingNodes = nodes.filter(n => !selectedNodeIds.includes(n.id));
    const nodesToDelete = nodes.filter(n => selectedNodeIds.includes(n.id));
    const edgesToRemove = getConnectedEdges(nodesToDelete, edges);
    
    const remainingEdges = edges.filter(e => !edgesToRemove.some(re => re.id === e.id));

    set({ nodes: remainingNodes, edges: remainingEdges, selectedNodeIds: [] });
    get().commitHistory();
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
    get().commitHistory();
  },

  updateEdge: (id: string, data: Partial<MindMapEdge>) => {
    set({
      edges: get().edges.map((edge) => {
        if (edge.id === id) {
          return { ...edge, ...data };
        }
        return edge;
      }),
    });
    get().commitHistory();
  },

  setViewport: (viewport: Viewport) => {
    set({ viewport });
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
    });
  },

  setIsSaving: (saving: boolean) => {
    set({ isSaving: saving });
  },
  
  setSaveError: (error: string | null) => {
    set({ saveError: error });
  },

  setUpdatedAt: (timestamp: number) => {
    set({ updatedAt: timestamp });
  },
  
  setTitle: (title: string) => {
    set({ documentTitle: title });
  },

  setSelectedNodes: (ids: string[]) => {
    set({
      selectedNodeIds: ids,
      nodes: get().nodes.map(n => ({ ...n, selected: ids.includes(n.id) }))
    });
  },

  createChildNode: (parentId: string) => {
    const { nodes, edges, templateId } = get();
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const root = nodes.find(n => n.type === 'main') || nodes[0];
    const layoutType = getLayoutType(templateId);
    
    let leftCount = 0;
    let rightCount = 0;
    
    if (parentNode.id === root?.id) {
      const rootEdges = edges.filter(e => e.source === root.id);
      rootEdges.forEach(e => {
        const child = nodes.find(n => n.id === e.target);
        if (child?.data?.layoutSide === 'left') leftCount++;
        else if (child?.data?.layoutSide === 'right') rightCount++;
      });
    }
    
    const layoutSide = parentNode.id === root?.id && layoutType === 'two-way'
      ? (leftCount <= rightCount ? 'left' : 'right')
      : resolveNodeLayoutSide(parentId, nodes, edges, layoutType);

    const isLeft = layoutSide === 'left';
    const offsetX = isLeft ? -200 : 200;
    
    const preferredX = parentNode.position.x + offsetX;
    const preferredY = parentNode.position.y;
    
    const { x: newX, y: newY } = findNonCollidingPosition(preferredX, preferredY, nodes);

    const newId = uuidv4();
    const newNode: MindMapNode = {
      id: newId,
      type: 'basic',
      position: { x: newX, y: newY },
      data: { label: 'New Topic', ...(layoutSide ? { layoutSide } : {}) },
      selected: true
    };

    const newEdge: MindMapEdge = {
      id: uuidv4(),
      source: parentId,
      target: newId,
      type: 'mindmap-edge',
      data: { edgeStyle: 'curved' }
    };

    set({ 
      nodes: [...nodes.map(n => ({...n, selected: false})), newNode], 
      edges: [...edges, newEdge],
      selectedNodeIds: [newId]
    });
    get().commitHistory();
  },

  createSiblingNode: (nodeId: string) => {
    const { nodes, edges, templateId } = get();
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    // Find parent edge
    const parentEdge = edges.find(e => e.target === nodeId);
    if (!parentEdge) {
      // If root, just create another root child
      get().createChildNode(nodeId);
      return;
    }

    const layoutType = getLayoutType(templateId);

    const parentId = parentEdge.source;
    const layoutSide = resolveNodeLayoutSide(targetNode.id, nodes, edges, layoutType);
    
    const preferredX = targetNode.position.x;
    const preferredY = targetNode.position.y + 80;
    
    const { x: newX, y: newY } = findNonCollidingPosition(preferredX, preferredY, nodes);

    const newId = uuidv4();
    const newNode: MindMapNode = {
      id: newId,
      type: targetNode.type,
      position: { x: newX, y: newY },
      data: { ...targetNode.data, label: 'New Topic', ...(layoutSide ? { layoutSide } : {}) },
      selected: true
    };

    const newEdge: MindMapEdge = {
      id: uuidv4(),
      source: parentId,
      target: newId,
      type: 'mindmap-edge',
      data: { edgeStyle: 'curved' }
    };

    set({ 
      nodes: [...nodes.map(n => ({...n, selected: false})), newNode], 
      edges: [...edges, newEdge],
      selectedNodeIds: [newId]
    });
    get().commitHistory();
  },

  duplicateSelected: () => {
    const { nodes, edges, selectedNodeIds } = get();
    if (selectedNodeIds.length === 0) return;

    const idMap: Record<string, string> = {};
    const newIds: string[] = [];

    const newNodes = nodes.filter(n => selectedNodeIds.includes(n.id)).map(n => {
      const newId = uuidv4();
      idMap[n.id] = newId;
      newIds.push(newId);
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + 50, y: n.position.y + 50 },
        selected: true
      };
    });

    const selectedEdges = edges.filter(e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target));
    const newEdges = selectedEdges.map(e => ({
      ...e,
      id: uuidv4(),
      source: idMap[e.source],
      target: idMap[e.target]
    }));

    set({ 
      nodes: [...nodes.map(n => ({...n, selected: false})), ...newNodes],
      edges: [...edges, ...newEdges],
      selectedNodeIds: newIds
    });
    get().commitHistory();
  },

  copySelected: () => {
    const { nodes, edges, selectedNodeIds } = get();
    if (selectedNodeIds.length === 0) return;

    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const selectedEdges = edges.filter(e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target));

    set({ clipboardNodes: JSON.parse(JSON.stringify(selectedNodes)), clipboardEdges: JSON.parse(JSON.stringify(selectedEdges)) });
  },

  pasteFromClipboard: () => {
    const { nodes, edges, clipboardNodes, clipboardEdges } = get();
    if (clipboardNodes.length === 0) return;

    const idMap: Record<string, string> = {};
    const newIds: string[] = [];

    const newNodes = clipboardNodes.map(n => {
      const newId = uuidv4();
      idMap[n.id] = newId;
      newIds.push(newId);
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + 50, y: n.position.y + 50 },
        selected: true
      };
    });

    const newEdges = clipboardEdges.map(e => ({
      ...e,
      id: uuidv4(),
      source: idMap[e.source],
      target: idMap[e.target]
    }));

    set({
      nodes: [...nodes.map(n => ({...n, selected: false})), ...newNodes],
      edges: [...edges, ...newEdges],
      selectedNodeIds: newIds
    });
    get().commitHistory();
  }
}));
