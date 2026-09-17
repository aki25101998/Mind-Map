import dagre from 'dagre';
import type { MindMapNode, MindMapEdge } from '../types';

interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'RL' | 'BT';
  nodeWidth?: number;
  nodeHeight?: number;
  ranksep?: number;
  nodesep?: number;
}

const applyDagre = (
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  options: LayoutOptions = {}
): MindMapNode[] => {
  if (nodes.length === 0) return nodes;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const dir = options.direction || 'TB';
  const nodeWidth = options.nodeWidth || 180;
  const nodeHeight = options.nodeHeight || 60;
  const ranksep = options.ranksep || 80;
  const nodesep = options.nodesep || 80;

  dagreGraph.setGraph({ rankdir: dir, align: 'UL', ranksep, nodesep });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });
};

const applyRadial = (nodes: MindMapNode[]): MindMapNode[] => {
  if (nodes.length === 0) return nodes;

  const root = nodes.find((n) => n.type === 'main') || nodes[0];
  const others = nodes.filter((n) => n.id !== root.id);

  const radius = 250;
  const angleStep = (2 * Math.PI) / others.length;

  const layoutedNodes = [...others.map((node, index) => {
    const angle = index * angleStep;
    return {
      ...node,
      position: {
        x: Math.round(Math.cos(angle) * radius),
        y: Math.round(Math.sin(angle) * radius),
      },
    };
  })];

  return [
    { ...root, position: { x: 0, y: 0 } },
    ...layoutedNodes
  ];
};

const applyTwoWay = (nodes: MindMapNode[], edges: MindMapEdge[]): MindMapNode[] => {
  if (nodes.length === 0) return nodes;
  
  // Find root
  const root = nodes.find(n => n.type === 'main') || nodes[0];
  
  // Very simplistic two-way separation based on current X position relative to root
  const leftNodes = nodes.filter(n => n.id !== root.id && n.position.x < root.position.x);
  const rightNodes = nodes.filter(n => n.id !== root.id && n.position.x >= root.position.x);

  const leftLayout = applyDagre(leftNodes, edges.filter(e => leftNodes.some(n => n.id === e.target)), { direction: 'RL' });
  const rightLayout = applyDagre(rightNodes, edges.filter(e => rightNodes.some(n => n.id === e.target)), { direction: 'LR' });

  // Re-adjust offsets
  const leftOffset = -200;
  const rightOffset = 200;

  const finalLeft = leftLayout.map(n => ({ ...n, position: { x: n.position.x + leftOffset, y: n.position.y } }));
  const finalRight = rightLayout.map(n => ({ ...n, position: { x: n.position.x + rightOffset, y: n.position.y } }));

  return [{ ...root, position: { x: 0, y: 0 } }, ...finalLeft, ...finalRight];
};

export const autoLayout = (
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  layoutType: string = 'tree'
): MindMapNode[] => {
  switch (layoutType) {
    case 'tree':
      return applyDagre(nodes, edges, { direction: 'TB', ranksep: 100, nodesep: 100 });
    case 'org':
      return applyDagre(nodes, edges, { direction: 'TB', ranksep: 120, nodesep: 150 });
    case 'flow':
      return applyDagre(nodes, edges, { direction: 'LR', ranksep: 120, nodesep: 80 });
    case 'brace':
      return applyDagre(nodes, edges, { direction: 'LR', ranksep: 150, nodesep: 60 });
    case 'one-way':
      return applyDagre(nodes, edges, { direction: 'LR', ranksep: 180, nodesep: 80 });
    case 'two-way':
      return applyTwoWay(nodes, edges);
    case 'radial':
      return applyRadial(nodes);
    case 'free':
    default:
      // Free layout should not be touched
      return nodes;
  }
};
