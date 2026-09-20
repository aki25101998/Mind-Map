import type { MindMapNode, MindMapEdge } from '../types';

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

    const childEdges = edges.filter(e => e.source === currentId);
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

export const computeHasChildrenMap = (edges: MindMapEdge[]): Record<string, boolean> => {
  const map: Record<string, boolean> = {};
  edges.forEach(e => {
    map[e.source] = true;
  });
  return map;
};
