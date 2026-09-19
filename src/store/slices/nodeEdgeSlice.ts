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
import { findNonCollidingPosition, resolveNodeLayoutSide, getLayoutType, applyAutoLayout } from '../../utils/layoutUtils';
import { getDescendants } from '../../utils/graphUtils';

const computeHasChildrenMap = (edges: MindMapEdge[]) => {
  const map: Record<string, boolean> = {};
  edges.forEach(e => {
    map[e.source] = true;
  });
  return map;
};

export const createNodeEdgeSlice: StateCreator<MindMapState, [], [], NodeEdgeSlice> = (set, get) => ({
  nodes: [],
  edges: [],
  hasChildrenMap: {},
  viewport: { x: 0, y: 0, zoom: 1 },

  onNodesChange: (changes) => {
    const currentNodes = get().nodes;
    
    // Lọc ra các thay đổi liên quan đến position khi đang kéo thả (transient state)
    // Các thay đổi này ReactFlow sẽ tự quản lý internal, KHÔNG được liên tục update vào Zustand
    const filteredChanges = changes.filter(change => {
      if (change.type === 'position' && change.dragging) {
        return false;
      }
      // Bỏ qua dragging false từ onNodesChange luôn, ta sẽ xử lý final position trong onNodeDragStop
      if (change.type === 'position' && change.dragging === false) {
        return false;
      }
      return true;
    });

    if (filteredChanges.length === 0) return;

    const newNodes = applyNodeChanges(filteredChanges, currentNodes) as MindMapNode[];
    
    // Update selection state
    const selectedIds = newNodes.filter(n => n.selected).map(n => n.id);
    
    set({ nodes: newNodes, selectedNodeIds: selectedIds });
  },

  onEdgesChange: (changes) => {
    const newEdges = applyEdgeChanges(changes, get().edges) as MindMapEdge[];
    set({ edges: newEdges, hasChildrenMap: computeHasChildrenMap(newEdges) });
  },

  onConnect: (connection) => {
    const newEdges = addEdge({ 
      ...connection, 
      id: uuidv4(), 
      type: 'mindmap-edge',
      data: { edgeStyle: 'curved' }
    }, get().edges) as MindMapEdge[];
    set({ edges: newEdges, hasChildrenMap: computeHasChildrenMap(newEdges) });
    get().commitHistory();
  },

  updateNodePositions: (draggedNodes) => {
    const currentNodes = get().nodes;
    let changed = false;
    
    const newNodes = currentNodes.map(node => {
      const dragged = draggedNodes.find(n => n.id === node.id);
      
      if (!dragged || dragged.id === 'floating-toolbar') return node;
      
      if (node.position.x !== dragged.position.x || node.position.y !== dragged.position.y) {
        changed = true;
        return {
          ...node,
          position: { x: dragged.position.x, y: dragged.position.y }
        };
      }
      
      return node;
    });

    if (changed) {
      set({ nodes: newNodes });
      get().commitHistory();
    }
  },

  setNodes: (nodes) => {
    set({ nodes });
    get().commitHistory();
  },

  setEdges: (edges) => {
    set({ edges, hasChildrenMap: computeHasChildrenMap(edges) });
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

    set({ nodes: remainingNodes, edges: remainingEdges, hasChildrenMap: computeHasChildrenMap(remainingEdges), selectedNodeIds: [] });
    get().commitHistory();
  },

  updateNodeData: (id, data) => {
    let newEdges = get().edges;
    if (data.backgroundColor) {
      newEdges = newEdges.map(e => 
        e.source === id ? { ...e, data: { ...e.data, strokeColor: data.backgroundColor } } : e
      );
    }
    
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
      edges: newEdges,
      hasChildrenMap: computeHasChildrenMap(newEdges)
    });
    get().commitHistory();
  },

  updateEdge: (id, data) => {
    const newEdges = get().edges.map((edge) => {
      if (edge.id === id) {
        return { ...edge, ...data };
      }
      return edge;
    });
    set({
      edges: newEdges,
      hasChildrenMap: computeHasChildrenMap(newEdges)
    });
    get().commitHistory();
  },

  updateOutgoingEdges: (sourceId, data) => {
    const newEdges = get().edges.map((edge) => {
      if (edge.source === sourceId) {
        return { ...edge, data: { ...edge.data, ...data } };
      }
      return edge;
    });
    set({
      edges: newEdges,
      hasChildrenMap: computeHasChildrenMap(newEdges)
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

    const newEdges = [...edges, newEdge];
    set({ 
      nodes: [...nodes.map(n => ({...n, selected: false})), newNode], 
      edges: newEdges,
      hasChildrenMap: computeHasChildrenMap(newEdges),
      selectedNodeIds: [newId],
      editingNodeId: newId
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

    const newEdges = [...edges, newEdge];
    set({ 
      nodes: [...nodes.map(n => ({...n, selected: false})), newNode], 
      edges: newEdges,
      hasChildrenMap: computeHasChildrenMap(newEdges),
      selectedNodeIds: [newId],
      editingNodeId: newId
    });
    get().commitHistory();
  },

  toggleCollapse: (nodeId) => {
    const { nodes, edges } = get();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const isCollapsed = !node.data.collapsed;
    const { descendantNodes, descendantEdges } = getDescendants(nodeId, nodes, edges);
    
    const descendantNodeIds = new Set(descendantNodes.map(n => n.id));
    const descendantEdgeIds = new Set(descendantEdges.map(e => e.id));

    const newEdges = edges.map(e => {
      if (descendantEdgeIds.has(e.id)) {
        return { ...e, hidden: isCollapsed };
      }
      return e;
    });

    set({
      nodes: nodes.map(n => {
        if (n.id === nodeId) {
          return { ...n, data: { ...n.data, collapsed: isCollapsed } };
        }
        if (descendantNodeIds.has(n.id)) {
          return { ...n, hidden: isCollapsed };
        }
        return n;
      }),
      edges: newEdges,
      hasChildrenMap: computeHasChildrenMap(newEdges)
    });
    get().commitHistory();
  },

  autoLayout: () => {
    const { nodes, edges, templateId } = get();
    const layoutType = getLayoutType(templateId);
    
    // Fit view after state update if we had access to ReactFlow, 
    // but since we are in store, we just update positions.
    const layoutedNodes = applyAutoLayout(nodes, edges, layoutType);
    
    set({ nodes: layoutedNodes });
    get().commitHistory();
  },
});
