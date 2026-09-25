import type { MindMapNode, MindMapEdge } from '../types';

/**
 * Determines whether an edge is a structural hierarchy edge (Parent -> Child).
 */
export const isStructuralEdge = (edge: MindMapEdge): boolean => {
  return !(edge.data?.relationship === true);
};

/**
 * Determines whether an edge is a cross-relationship edge (A <-> B).
 */
export const isRelationshipEdge = (edge: MindMapEdge): boolean => {
  return edge.data?.relationship === true;
};

/**
 * Returns the structural parent ID of a node (if any).
 * In a valid tree, each node has at most 1 structural parent.
 */
export const getStructuralParent = (nodeId: string, edges: MindMapEdge[]): string | null => {
  const parentEdge = edges.find(e => e.target === nodeId && isStructuralEdge(e));
  return parentEdge ? parentEdge.source : null;
};

/**
 * Returns all structural child node IDs of a node.
 */
export const getStructuralChildren = (nodeId: string, edges: MindMapEdge[]): string[] => {
  return edges
    .filter(e => e.source === nodeId && isStructuralEdge(e))
    .map(e => e.target);
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
 * 1. Source and target must exist and be non-empty strings.
 * 2. Self-connections (A -> A) are disallowed.
 * 3. Source and target nodes must exist in the node list.
 * 4. Duplicate edges (same source and target) are disallowed.
 * 5. For structural edges (Parent -> Child):
 *    - Reverse structural edge (B -> A when A -> B exists) is disallowed.
 *    - Cycle creation (A -> B -> C -> A) is disallowed.
 *    - Target already having a structural parent is disallowed (tree rule: <= 1 parent).
 *    - Target cannot be the Root/main node (Root cannot have a parent).
 * 6. For relationship edges (A <-> B):
 *    - No parent/cycle hierarchy rules applied.
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

  const sourceNode = nodes.find(n => n.id === source);
  const targetNode = nodes.find(n => n.id === target);
  if (!sourceNode || !targetNode) {
    return false;
  }

  const isDuplicate = edges.some(e => e.source === source && e.target === target);
  if (isDuplicate) {
    return false;
  }

  const isStructural = !(connection.data?.relationship === true);
  if (isStructural) {
    // Root node can never have a structural parent
    if (targetNode.type === 'main') {
      return false;
    }

    // Disallow reverse structural edge
    const hasReverse = edges.some(e => e.source === target && e.target === source && isStructuralEdge(e));
    if (hasReverse) {
      return false;
    }

    // Disallow structural cycles
    if (wouldCreateCycle(source, target, edges)) {
      return false;
    }

    // Disallow multiple structural parents (tree constraint)
    const existingParent = getStructuralParent(target, edges);
    if (existingParent) {
      return false;
    }
  }

  return true;
};

/**
 * Validates whether an existing relationship edge can be converted into a structural hierarchy edge.
 */
export const canConvertToStructural = (
  edge: MindMapEdge,
  edges: MindMapEdge[],
  nodes: MindMapNode[]
): { allowed: boolean; reason?: string } => {
  const { source, target } = edge;
  const sourceNode = nodes.find(n => n.id === source);
  const targetNode = nodes.find(n => n.id === target);

  if (!sourceNode || !targetNode) {
    return { allowed: false, reason: 'Source or target node not found.' };
  }

  if (targetNode.type === 'main') {
    return { allowed: false, reason: 'Root node cannot have a parent in the hierarchy.' };
  }

  const otherEdges = edges.filter(e => e.id !== edge.id);

  // Check if target already has another structural parent
  const existingParent = getStructuralParent(target, otherEdges);
  if (existingParent) {
    return { 
      allowed: false, 
      reason: 'Cannot convert this edge to a hierarchy edge because the target already has a parent.' 
    };
  }

  // Check reverse structural edge
  const hasReverse = otherEdges.some(e => e.source === target && e.target === source && isStructuralEdge(e));
  if (hasReverse) {
    return {
      allowed: false,
      reason: 'Cannot convert this edge to a hierarchy edge because a reverse hierarchy relationship exists.'
    };
  }

  // Check cycle
  if (wouldCreateCycle(source, target, otherEdges)) {
    return {
      allowed: false,
      reason: 'Cannot convert this edge to a hierarchy edge because it would create a circular dependency.'
    };
  }

  return { allowed: true };
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

    const parentId = getStructuralParent(id, edges);
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
 * Only follows structural edges (isStructuralEdge).
 */
export const findAncestors = (
  nodeId: string,
  nodes: MindMapNode[],
  edges: MindMapEdge[]
): MindMapNode[] => {
  const ancestors: MindMapNode[] = [];
  const nodeMap = new Map<string, MindMapNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  let currentId = nodeId;
  const visited = new Set<string>();

  while (true) {
    const parentId = getStructuralParent(currentId, edges);
    if (!parentId || visited.has(parentId)) break;
    visited.add(parentId);

    const parentNode = nodeMap.get(parentId);
    if (!parentNode) break;

    ancestors.push(parentNode);
    currentId = parentId;
  }

  return ancestors;
};
