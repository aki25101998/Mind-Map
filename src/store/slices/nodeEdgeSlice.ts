import type { StateCreator } from 'zustand';
import type { MindMapState, NodeEdgeSlice } from './types';
import { 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  getConnectedEdges,
} from '@xyflow/react';
import type { MindMapNode, MindMapEdge } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { findNonCollidingPosition, resolveNodeLayoutSide, getLayoutType } from '../../utils/layoutUtils';

export const createNodeEdgeSlice: StateCreator<MindMapState, [], [], NodeEdgeSlice> = (set, get) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },

  onNodesChange: (changes) => {
    const newNodes = applyNodeChanges(changes, get().nodes) as MindMapNode[];
    
    // Update selection state
    const selectedIds = newNodes.filter(n => n.selected).map(n => n.id);
    
    set({ nodes: newNodes, selectedNodeIds: selectedIds });
  },

  onEdgesChange: (changes) => {
    const newEdges = applyEdgeChanges(changes, get().edges) as MindMapEdge[];
    set({ edges: newEdges });
  },

  onConnect: (connection) => {
    const newEdges = addEdge({ 
      ...connection, 
      id: uuidv4(), 
      type: 'mindmap-edge',
      data: { edgeStyle: 'curved' }
    }, get().edges) as MindMapEdge[];
    set({ edges: newEdges });
    get().commitHistory();
  },

  setNodes: (nodes) => {
    set({ nodes });
    get().commitHistory();
  },

  setEdges: (edges) => {
    set({ edges });
    get().commitHistory();
  },

  addNode: (node) => {
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

  updateNodeData: (id, data) => {
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

  updateEdge: (id, data) => {
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

  setViewport: (viewport) => {
    set({ viewport });
  },

  createChildNode: (parentId) => {
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

  createSiblingNode: (nodeId) => {
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
});
