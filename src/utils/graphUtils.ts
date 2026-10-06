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
 * Returns all structural parent IDs of a node.
 * In a general graph, a node may have multiple structural parents/incoming lines.
 */
export const getStructuralParents = (nodeId: string, edges: MindMapEdge[]): string[] => {
  return edges
    .filter(e => e.target === nodeId && isStructuralEdge(e))
    .map(e => e.source);
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
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data?: Record<string, unknown>;
}


export interface IsValidConnectionOptions {
  allowReparenting?: boolean;
  ignoredEdgeId?: string;
  strictTree?: boolean;
}

/**
 * Validates a connection before creating or reconnecting an edge:
 * 1. Source and target must exist and be non-empty strings.
 * 2. Self-connections (A -> A) are disallowed.
 * 3. Source and target nodes must exist in the node list.
 * 4. Duplicate edges (same source, target, and matching handles) are disallowed.
 * 5. Structural cycle is disallowed.
 * 6. Target cannot be Root / main node in structural mode.
 * 7. By default, nodes CAN connect multiple incoming and outgoing lines freely.
 *    Single-parent tree constraint is only enforced if options?.strictTree === true.
 */
export const isValidConnection = (
  connection: ConnectionCandidate,
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  options?: IsValidConnectionOptions
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

  const effectiveEdges = options?.ignoredEdgeId 
    ? edges.filter(e => e.id !== options.ignoredEdgeId)
    : edges;

  const isDuplicate = effectiveEdges.some(e => {
    if (e.source !== source || e.target !== target) return false;
    const eSrc = e.sourceHandle ?? null;
    const cSrc = connection.sourceHandle ?? null;
    const eTgt = e.targetHandle ?? null;
    const cTgt = connection.targetHandle ?? null;
    if (cSrc !== null && eSrc !== null && cSrc !== eSrc) return false;
    if (cTgt !== null && eTgt !== null && cTgt !== eTgt) return false;
    if ((cSrc !== null || cTgt !== null) && (cSrc !== eSrc || cTgt !== eTgt)) return false;
    return true;
  });

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
    const hasReverse = effectiveEdges.some(e => e.source === target && e.target === source && isStructuralEdge(e));
    if (hasReverse) {
      return false;
    }

    if (options?.allowReparenting) {
      // Exclude existing parent edge of target if reparenting
      const edgesWithoutOldParent = effectiveEdges.filter(e => !(e.target === target && isStructuralEdge(e)));

      // Disallow structural cycles in the resulting tree
      if (wouldCreateCycle(source, target, edgesWithoutOldParent)) {
        return false;
      }
    } else {
      // Disallow structural cycles
      if (wouldCreateCycle(source, target, effectiveEdges)) {
        return false;
      }

      // Disallow multiple structural parents ONLY if strictTree constraint is explicitly enabled
      if (options?.strictTree) {
        const existingParent = getStructuralParent(target, effectiveEdges);
        if (existingParent) {
          return false;
        }
      }
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
  nodes: MindMapNode[],
  options?: { strictTree?: boolean }
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

  // Check if target already has another structural parent (only in strict tree mode)
  if (options?.strictTree) {
    const existingParent = getStructuralParent(target, otherEdges);
    if (existingParent) {
      return { 
        allowed: false, 
        reason: 'Cannot convert this edge to a hierarchy edge because the target already has a parent.' 
      };
    }
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

    const parentIds = getStructuralParents(id, edges);
    if (parentIds.length === 0) {
      // Root or disconnected node is not hidden by collapse
      isNodeHiddenMemo.set(id, false);
      return false;
    }

    // A node is hidden if ALL of its structural parents are collapsed or hidden
    const allParentsHidden = parentIds.every(parentId => {
      const parentNode = nodeMap.get(parentId);
      if (!parentNode) return false;
      if (parentNode.data?.collapsed) return true;
      return checkIsHidden(parentId, visited);
    });

    isNodeHiddenMemo.set(id, allParentsHidden);
    return allParentsHidden;
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
