import dagre from 'dagre';
import type { MindMapNode, MindMapEdge } from '../types';

export const getTreeLayout = (nodes: MindMapNode[], edges: MindMapEdge[], direction: 'TB' | 'LR' = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Setup dagre layout parameters
  const nodeWidth = 172;
  const nodeHeight = 40;

  dagreGraph.setGraph({ rankdir: direction, align: 'UL', ranksep: 60, nodesep: 60 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return layoutedNodes;
};

export const getTwoWayLayout = (nodes: MindMapNode[], edges: MindMapEdge[]) => {
  // Simple heuristic for two-way:
  // Root node is at (0, 0).
  // Other nodes distribute left and right.
  // For a proper robust two-way, we could split the graph into two subtrees,
  // layout one left-to-right (LR) and the other right-to-left (RL), and combine.
  
  // As MVP, we will rely on manual placement for Two-way from template,
  // and a basic radial distribution.
  return nodes; // Placeholder for two-way auto-layout
};
