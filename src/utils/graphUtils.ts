import type { MindMapNode, MindMapEdge } from '../types';

/**
 * Determines whether an edge is a structural hierarchy edge (Parent -> Child)
 * or an arbitrary cross-relationship edge (A <-> B).
 */
export const isStructuralEdge = (edge: MindMapEdge): boolean => {
  return !(edge.data?.relationship === true);
};

/**
 * Checks if adding a directed structural edge from sourceId to targetId
 * would create a cycle. It does a BFS/DFS from targetId along structural edges:
 * if sourceId is reachable from targetId, adding sourceId -> targetId would form a cycle.
 */
export const wouldCreateCycle = (
  sourceId: string,
  targetId: string,
  edges: MindMapEdge[]
): boolean => {
  if (sourceId === targetId) return true;

  const queue = [targetId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === sourceId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    // Follow structural outgoing edges
    for (const edge of edges) {
      if (edge.source === current && isStructuralEdge(edge)) {
        queue.push(edge.target);
      }
    }
  }

  return false;
};

export interface ConnectionCandidate {
  source?: string | null;
  target?: string | null;
  data?: Record<string, unknown>;
}

/**
 * Validates a connection before creating an edge:
 * - Source and target must exist and be non-empty strings.
 * - Self-connections (A -> A) are disallowed.
 * - Duplicate edges (same source and target) are disallowed.
 * - For structural edges:
 *   - Reverse structural edges (B -> A when A -> B exists) are disallowed.
 *   - Cycles are strictly prohibited.
 */
export const isValidConnection = (
  connection: ConnectionCandidate,
  nodes: MindMapNode[],
  edges: MindMapEdge[]
): boolean => {
  const { source, target } = connection;
  if (!source || !target || typeof source !== 'string' || typeof target !== 'string') {
    return false;
  }

  if (source === target) {
    return false;
  }

  const sourceExists = nodes.some(n => n.id === source);
  const targetExists = nodes.some(n => n.id === target);
  if (!sourceExists || !targetExists) {
    return false;
  }

  const isDuplicate = edges.some(e => e.source === source && e.target === target);
  if (isDuplicate) {
    return false;
  }

  const isStructural = !(connection.data?.relationship === true);
  if (isStructural) {
    // Disallow reverse structural edge
    const hasReverse = edges.some(e => e.source === target && e.target === source && isStructuralEdge(e));
    if (hasReverse) {
      return false;
    }

    // Disallow cycles
    if (wouldCreateCycle(source, target, edges)) {
      return false;
    }
  }

  return true;
};

/**
 * Retrieves all structural descendants (nodes and edges) under a node.
 * Relationship edges are ignored.
 */
export const getDescendants = (
  nodeId: string,
  nodes: MindMapNode[],
  edges: MindMapEdge[]
): { descendantNodes: MindMapNode[]; descendantEdges: MindMapEdge[] } => {
  const descendantNodes: MindMapNode[] = [];
  const descendantEdges: MindMapEdge[] = [];
  
  const queue = [nodeId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const childEdges = edges.filter(e => e.source === currentId && isStructuralEdge(e));
    childEdges.forEach(edge => {
      descendantEdges.push(edge);
      const childNode = nodes.find(n => n.id === edge.target);
      if (childNode) {
        descendantNodes.push(childNode);
        queue.push(childNode.id);
      }
    });
  }

  return { descendantNodes, descendantEdges };
};

/**
 * Computes a map of node IDs that currently have structural children.
 */
export const computeHasChildrenMap = (edges: MindMapEdge[]): Record<string, boolean> => {
  const map: Record<string, boolean> = {};
  edges.forEach(e => {
    if (isStructuralEdge(e)) {
      map[e.source] = true;
    }
  });
  return map;
};

/**
 * Accurately computes visibility of all nodes and edges taking into account nested collapse.
 * A node is hidden if ANY structural ancestor along its path has `collapsed === true`.
 * An edge is hidden if its source or target is hidden, or if it is inside a collapsed subtree.
 */
export const computeSubtreeVisibility = (
  nodes: MindMapNode[],
  edges: MindMapEdge[]
): { nodes: MindMapNode[]; edges: MindMapEdge[] } => {
  // Build parent lookup for structural edges: target -> source
  const structuralParentMap = new Map<string, string>();
  edges.forEach(e => {
    if (isStructuralEdge(e)) {
      structuralParentMap.set(e.target, e.source);
    }
  });

  const nodeMap = new Map<string, MindMapNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // Determine if a node is hidden by checking whether any ancestor is collapsed
  const isNodeHiddenMemo = new Map<string, boolean>();

  const checkIsHidden = (id: string, visited: Set<string>): boolean => {
    if (isNodeHiddenMemo.has(id)) {
      return isNodeHiddenMemo.get(id)!;
    }

    if (visited.has(id)) {
      // Break cycle if malformed graph
      return false;
    }
    visited.add(id);

    const parentId = structuralParentMap.get(id);
    if (!parentId) {
      // Root or disconnected node is not hidden by collapse
      isNodeHiddenMemo.set(id, false);
      return false;
    }

    const parentNode = nodeMap.get(parentId);
    if (!parentNode) {
      isNodeHiddenMemo.set(id, false);
      return false;
    }

    // If parent itself is collapsed, this node is hidden!
    if (parentNode.data?.collapsed) {
      isNodeHiddenMemo.set(id, true);
      return true;
    }

    // Otherwise, inherit parent's hidden state
    const parentHidden = checkIsHidden(parentId, visited);
    isNodeHiddenMemo.set(id, parentHidden);
    return parentHidden;
  };

  const updatedNodes = nodes.map(node => {
    const hidden = checkIsHidden(node.id, new Set());
    return node.hidden === hidden ? node : { ...node, hidden };
  });

  const hiddenNodeIdSet = new Set(updatedNodes.filter(n => n.hidden).map(n => n.id));

  const updatedEdges = edges.map(edge => {
    let edgeHidden = false;
    if (hiddenNodeIdSet.has(edge.source) || hiddenNodeIdSet.has(edge.target)) {
      edgeHidden = true;
    } else if (isStructuralEdge(edge)) {
      const sourceNode = nodeMap.get(edge.source);
      if (sourceNode?.data?.collapsed) {
        edgeHidden = true;
      }
    }

    return edge.hidden === edgeHidden ? edge : { ...edge, hidden: edgeHidden };
  });

  return { nodes: updatedNodes, edges: updatedEdges };
};

/**
 * Returns structural ancestors of a node starting from immediate parent up to root.
 */
export const findAncestors = (
  nodeId: string,
  nodes: MindMapNode[],
  edges: MindMapEdge[]
): MindMapNode[] => {
  const ancestors: MindMapNode[] = [];
  const nodeMap = new Map<string, MindMapNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const structuralParentMap = new Map<string, string>();
  edges.forEach(e => {
    if (isStructuralEdge(e)) {
      structuralParentMap.set(e.target, e.source);
    }
  });

  let currentId = nodeId;
  const visited = new Set<string>();

  while (true) {
    const parentId = structuralParentMap.get(currentId);
    if (!parentId || visited.has(parentId)) break;
    visited.add(parentId);

    const parentNode = nodeMap.get(parentId);
    if (!parentNode) break;

    ancestors.push(parentNode);
    currentId = parentId;
  }

  return ancestors;
};
