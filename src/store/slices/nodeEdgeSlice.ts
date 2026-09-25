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
import { 
  computeHasChildrenMap, 
  isValidConnection, 
  isStructuralEdge, 
  computeSubtreeVisibility 
} from '../../utils/graphUtils';

export const createNodeEdgeSlice: StateCreator<MindMapState, [], [], NodeEdgeSlice> = (set, get) => ({
  nodes: [],
  edges: [],
  hasChildrenMap: {},
  viewport: { x: 0, y: 0, zoom: 1 },

  onNodesChange: (changes) => {
    const currentNodes = get().nodes;
    
    // Zustand KHÔNG nhận position từ onNodesChange (vì đã có local nodes lo)
    const filteredChanges = changes.filter(change => change.type !== 'position');

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
    const { nodes, edges } = get();
    if (!isValidConnection(connection, nodes, edges)) {
      return;
    }

    const newEdges = addEdge({ 
      ...connection, 
      id: uuidv4(), 
      type: 'mindmap-edge',
      data: { edgeStyle: 'curved' }
    }, edges) as MindMapEdge[];
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
    const { nodes, edges, selectedNodeIds, editingNodeId, contextMenu } = get();
    const selectedEdges = edges.filter(e => e.selected);
    const nodesToDelete = nodes.filter(n => selectedNodeIds.includes(n.id) && n.type !== 'main');

    // If neither non-root nodes nor edges are selected, do nothing
    if (nodesToDelete.length === 0 && selectedEdges.length === 0) {
      return;
    }

    const nodeIdsToDelete = new Set(nodesToDelete.map(n => n.id));
    const edgeIdsToRemove = new Set(selectedEdges.map(e => e.id));

    const connectedEdges = getConnectedEdges(nodesToDelete, edges);
    connectedEdges.forEach(e => edgeIdsToRemove.add(e.id));

    const remainingNodes = nodes.filter(n => !nodeIdsToDelete.has(n.id));
    const remainingEdges = edges.filter(e => !edgeIdsToRemove.has(e.id));

    // Restore visibility on remaining nodes/edges
    const { nodes: visibleNodes, edges: visibleEdges } = computeSubtreeVisibility(remainingNodes, remainingEdges);

    const newSelectedNodeIds = selectedNodeIds.filter(id => !nodeIdsToDelete.has(id));
    const newEditingNodeId = editingNodeId && nodeIdsToDelete.has(editingNodeId) ? null : editingNodeId;
    const newContextMenu = contextMenu?.target === 'node' && contextMenu.id && nodeIdsToDelete.has(contextMenu.id) ? null : contextMenu;

    set({ 
      nodes: visibleNodes, 
      edges: visibleEdges, 
      hasChildrenMap: computeHasChildrenMap(visibleEdges), 
      selectedNodeIds: newSelectedNodeIds,
      editingNodeId: newEditingNodeId,
      contextMenu: newContextMenu
    });
    get().commitHistory();
  },

  deleteNodeById: (id) => {
    const { nodes, edges, selectedNodeIds, editingNodeId, contextMenu } = get();
    const nodeToDelete = nodes.find(n => n.id === id);
    if (!nodeToDelete || nodeToDelete.type === 'main') return;

    const remainingNodes = nodes.filter(n => n.id !== id);
    const edgesToRemove = getConnectedEdges([nodeToDelete], edges);
    const remainingEdges = edges.filter(e => !edgesToRemove.some(re => re.id === e.id));

    const { nodes: visibleNodes, edges: visibleEdges } = computeSubtreeVisibility(remainingNodes, remainingEdges);

    const newEditingNodeId = editingNodeId === id ? null : editingNodeId;
    const newContextMenu = contextMenu?.target === 'node' && contextMenu.id === id ? null : contextMenu;
    const newSelectedNodeIds = selectedNodeIds.filter(selId => selId !== id);

    set({ 
      nodes: visibleNodes, 
      edges: visibleEdges, 
      hasChildrenMap: computeHasChildrenMap(visibleEdges), 
      selectedNodeIds: newSelectedNodeIds,
      editingNodeId: newEditingNodeId,
      contextMenu: newContextMenu
    });
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

  updateNodeType: (id, type) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, type: type as MindMapNode['type'] };
        }
        return node;
      })
    });
    get().commitHistory();
  },

  updateEdge: (id, data) => {
    const newEdges = get().edges.map((edge) => {
      if (edge.id === id) {
        return { 
          ...edge, 
          ...data,
          data: data.data ? { ...edge.data, ...data.data } : edge.data
        };
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
    
    const { x: newX, y: newY } = findNonCollidingPosition(preferredX, preferredY, nodes, 'basic', 'New Topic');

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
    if (!targetNode || targetNode.type === 'main') return;

    // Find parent edge
    const parentEdge = edges.find(e => e.target === nodeId && isStructuralEdge(e));
    if (!parentEdge) {
      // Root or disconnected node has no sibling
      return;
    }

    const layoutType = getLayoutType(templateId);

    const parentId = parentEdge.source;
    const layoutSide = resolveNodeLayoutSide(targetNode.id, nodes, edges, layoutType);
    
    const preferredX = targetNode.position.x;
    const preferredY = targetNode.position.y + 80;
    
    const { x: newX, y: newY } = findNonCollidingPosition(preferredX, preferredY, nodes, targetNode.type, 'New Topic', targetNode.data?.fontSize);

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
    const { nodes, edges, selectedNodeIds, editingNodeId } = get();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const isCollapsed = !node.data.collapsed;
    const updatedNodes = nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, data: { ...n.data, collapsed: isCollapsed } };
      }
      return n;
    });

    const { nodes: visibleNodes, edges: visibleEdges } = computeSubtreeVisibility(updatedNodes, edges);
    const hiddenNodeIds = new Set(visibleNodes.filter(n => n.hidden).map(n => n.id));

    set({
      nodes: visibleNodes,
      edges: visibleEdges,
      hasChildrenMap: computeHasChildrenMap(visibleEdges),
      selectedNodeIds: selectedNodeIds.filter(id => !hiddenNodeIds.has(id)),
      editingNodeId: editingNodeId && hiddenNodeIds.has(editingNodeId) ? null : editingNodeId
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
