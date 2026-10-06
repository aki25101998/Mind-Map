import type { StateCreator } from 'zustand';
import type { MindMapState, NodeEdgeSlice } from './types';
import { 
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
  computeSubtreeVisibility,
  getDescendants
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

    const connData = (connection as { data?: Record<string, unknown> }).data;
    const isStructural = !(connData?.relationship === true);

    const newEdge: MindMapEdge = {
      id: uuidv4(),
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? null,
      targetHandle: connection.targetHandle ?? null,
      type: 'mindmap-edge',
      data: {
        edgeStyle: 'curved',
        ...(connData || {})
      }
    };

    // Keep all existing edges: a node can connect to multiple lines freely!
    const newEdges = [...edges, newEdge];

    // If connecting in two-way layout, initialize target node's layoutSide if unset
    let updatedNodes = nodes;
    if (isStructural && connection.source && connection.target) {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      if (sourceNode && targetNode && sourceNode.data?.layoutSide && sourceNode.data.layoutSide !== 'center') {
        if (!targetNode.data?.layoutSide || targetNode.data.layoutSide === 'center') {
          updatedNodes = nodes.map(n => 
            n.id === targetNode.id 
              ? { ...n, data: { ...n.data, layoutSide: sourceNode.data.layoutSide } }
              : n
          );
        }
      }
    }

    set({ 
      nodes: updatedNodes,
      edges: newEdges, 
      hasChildrenMap: computeHasChildrenMap(newEdges) 
    });
    get().commitHistory();
  },

  onReconnectEdge: (oldEdge, newConnection) => {
    const { nodes, edges } = get();
    const edgesWithoutOld = edges.filter(e => e.id !== oldEdge.id);
    if (!isValidConnection(newConnection, nodes, edgesWithoutOld, { ignoredEdgeId: oldEdge.id, allowReparenting: true })) {
      return;
    }

    const connData = (newConnection as { data?: Record<string, unknown> }).data;
    const isStructural = !(connData?.relationship === true || oldEdge.data?.relationship === true);

    const reconnectedEdge: MindMapEdge = {
      ...oldEdge,
      source: newConnection.source,
      target: newConnection.target,
      sourceHandle: newConnection.sourceHandle ?? null,
      targetHandle: newConnection.targetHandle ?? null,
    };

    // Reconnecting only replaces the old edge; all other edges connected to target are preserved!
    const newEdges = [...edgesWithoutOld, reconnectedEdge];

    // Update target node layoutSide if reconnecting in structural hierarchy
    let updatedNodes = nodes;
    if (isStructural && newConnection.source && newConnection.target) {
      const sourceNode = nodes.find(n => n.id === newConnection.source);
      const targetNode = nodes.find(n => n.id === newConnection.target);
      if (sourceNode && targetNode && sourceNode.data?.layoutSide && sourceNode.data.layoutSide !== 'center') {
        updatedNodes = nodes.map(n => 
          n.id === targetNode.id 
            ? { ...n, data: { ...n.data, layoutSide: sourceNode.data.layoutSide } }
            : n
        );
      }
    }

    const { nodes: visibleNodes, edges: visibleEdges } = computeSubtreeVisibility(updatedNodes, newEdges);

    set({
      nodes: visibleNodes,
      edges: visibleEdges,
      hasChildrenMap: computeHasChildrenMap(visibleEdges)
    });
    get().commitHistory();
  },

  updateNodePositions: (draggedNodes) => {
    const currentNodes = get().nodes;
    let changed = false;
    
    const newNodes = currentNodes.map(node => {
      // Store-level lock protection: locked node position can NEVER be changed
      if (node.data?.locked === true) {
        return node;
      }

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
    const nodesToDelete = nodes.filter(n => selectedNodeIds.includes(n.id));

    // If neither nodes nor edges are selected, do nothing
    if (nodesToDelete.length === 0 && selectedEdges.length === 0) {
      return;
    }

    // Collect all descendants of deleted nodes (entire subtree)
    const allNodesToDeleteMap = new Map<string, MindMapNode>();
    nodesToDelete.forEach(n => {
      allNodesToDeleteMap.set(n.id, n);
      const { descendantNodes } = getDescendants(n.id, nodes, edges);
      descendantNodes.forEach(dn => allNodesToDeleteMap.set(dn.id, dn));
    });

    const allNodesToDelete = Array.from(allNodesToDeleteMap.values());
    const nodeIdsToDelete = new Set(allNodesToDelete.map(n => n.id));
    const edgeIdsToRemove = new Set(selectedEdges.map(e => e.id));

    const connectedEdges = getConnectedEdges(allNodesToDelete, edges);
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
    if (!nodeToDelete) return;

    // Collect all descendants of deleted node (entire subtree)
    const { descendantNodes } = getDescendants(id, nodes, edges);
    const allNodesToDelete = [nodeToDelete, ...descendantNodes];
    const nodeIdsToDelete = new Set(allNodesToDelete.map(n => n.id));

    const edgesToRemove = getConnectedEdges(allNodesToDelete, edges);
    const edgeIdsToRemove = new Set(edgesToRemove.map(e => e.id));

    const remainingNodes = nodes.filter(n => !nodeIdsToDelete.has(n.id));
    const remainingEdges = edges.filter(e => !edgeIdsToRemove.has(e.id));

    const { nodes: visibleNodes, edges: visibleEdges } = computeSubtreeVisibility(remainingNodes, remainingEdges);

    const newEditingNodeId = editingNodeId && nodeIdsToDelete.has(editingNodeId) ? null : editingNodeId;
    const newContextMenu = contextMenu?.target === 'node' && contextMenu.id && nodeIdsToDelete.has(contextMenu.id) ? null : contextMenu;
    const newSelectedNodeIds = selectedNodeIds.filter(selId => !nodeIdsToDelete.has(selId));

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
    const node = get().nodes.find(n => n.id === id);
    if (!node) return;
    // Root node type cannot be changed, and no other node can be converted into 'main'
    if (node.type === 'main' || type === 'main') return;

    set({
      nodes: get().nodes.map((n) => {
        if (n.id === id) {
          return { ...n, type: type as MindMapNode['type'] };
        }
        return n;
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

    const { nodes: visibleNodes, edges: visibleEdges } = computeSubtreeVisibility(get().nodes, newEdges);

    set({
      nodes: visibleNodes,
      edges: visibleEdges,
      hasChildrenMap: computeHasChildrenMap(visibleEdges)
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

    // Automatically uncollapse parent so newly created child is immediately visible
    let updatedNodes = nodes;
    if (parentNode.data?.collapsed) {
      updatedNodes = nodes.map(n => 
        n.id === parentId ? { ...n, data: { ...n.data, collapsed: false } } : n
      );
    }

    const root = updatedNodes.find(n => n.type === 'main') || updatedNodes[0];
    const layoutType = getLayoutType(templateId);
    
    let leftCount = 0;
    let rightCount = 0;
    
    if (parentNode.id === root?.id) {
      const rootEdges = edges.filter(e => e.source === root.id);
      rootEdges.forEach(e => {
        const child = updatedNodes.find(n => n.id === e.target);
        if (child?.data?.layoutSide === 'left') leftCount++;
        else if (child?.data?.layoutSide === 'right') rightCount++;
      });
    }
    
    const layoutSide = parentNode.id === root?.id && layoutType === 'two-way'
      ? (leftCount <= rightCount ? 'left' : 'right')
      : resolveNodeLayoutSide(parentId, updatedNodes, edges, layoutType);

    const isLeft = layoutSide === 'left';
    const offsetX = isLeft ? -200 : 200;
    
    const preferredX = parentNode.position.x + offsetX;
    const preferredY = parentNode.position.y;
    
    const { x: newX, y: newY } = findNonCollidingPosition(preferredX, preferredY, updatedNodes, 'basic', 'New Topic');

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
    const allNodes = [...updatedNodes.map(n => ({...n, selected: false})), newNode];
    const { nodes: visibleNodes, edges: visibleEdges } = computeSubtreeVisibility(allNodes, newEdges);

    set({ 
      nodes: visibleNodes, 
      edges: visibleEdges, 
      hasChildrenMap: computeHasChildrenMap(visibleEdges), 
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

    // Whitelist styling attributes only; do NOT inherit metadata (note, url, tags, locked, collapsed)
    const inheritedData: Record<string, unknown> = {};
    if (targetNode.data?.backgroundColor) inheritedData.backgroundColor = targetNode.data.backgroundColor;
    if (targetNode.data?.borderColor) inheritedData.borderColor = targetNode.data.borderColor;
    if (targetNode.data?.color) inheritedData.color = targetNode.data.color;
    if (targetNode.data?.fontSize) inheritedData.fontSize = targetNode.data.fontSize;
    if (targetNode.data?.fontWeight) inheritedData.fontWeight = targetNode.data.fontWeight;
    if (targetNode.data?.textAlign) inheritedData.textAlign = targetNode.data.textAlign;
    if (targetNode.data?.shape) inheritedData.shape = targetNode.data.shape;
    if (targetNode.data?.dashedEdges !== undefined) inheritedData.dashedEdges = targetNode.data.dashedEdges;

    const newId = uuidv4();
    const newNode: MindMapNode = {
      id: newId,
      type: targetNode.type,
      position: { x: newX, y: newY },
      data: { 
        ...inheritedData, 
        label: 'New Topic', 
        ...(layoutSide ? { layoutSide } : {}) 
      },
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
