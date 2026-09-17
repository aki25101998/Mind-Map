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
  
  // Build adjacency list for walking
  const adjList = new Map<string, string[]>();
  edges.forEach(e => {
    if (!adjList.has(e.source)) adjList.set(e.source, []);
    adjList.get(e.source)!.push(e.target);
  });

  const leftNodeIds = new Set<string>();
  const rightNodeIds = new Set<string>();

  // Determine sides for immediate children
  const immediateChildren = adjList.get(root.id) || [];
  immediateChildren.forEach(childId => {
    const childNode = nodes.find(n => n.id === childId);
    if (!childNode) return;
    
    // Check layoutSide or fallback to current X position relative to root
    const side = (childNode.data?.layoutSide as string) || (childNode.position.x < root.position.x ? 'left' : 'right');
    
    // BFS to add all descendants to the same side
    const queue = [childId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (side === 'left') leftNodeIds.add(curr);
      else rightNodeIds.add(curr);
      
      const children = adjList.get(curr) || [];
      queue.push(...children);
    }
  });

  // What about disconnected nodes? Keep them based on their X position or default to right
  nodes.forEach(n => {
    if (n.id !== root.id && !leftNodeIds.has(n.id) && !rightNodeIds.has(n.id)) {
      if (n.position.x < root.position.x) leftNodeIds.add(n.id);
      else rightNodeIds.add(n.id);
    }
  });

  const leftNodes = nodes.filter(n => leftNodeIds.has(n.id));
  const rightNodes = nodes.filter(n => rightNodeIds.has(n.id));

  const leftNodesWithRoot = [root, ...leftNodes];
  const rightNodesWithRoot = [root, ...rightNodes];

  const leftEdges = edges.filter(e => leftNodeIds.has(e.target));
  const rightEdges = edges.filter(e => rightNodeIds.has(e.target));

  const leftLayout = applyDagre(leftNodesWithRoot, leftEdges, { direction: 'RL', ranksep: 120, nodesep: 60 });
  const rightLayout = applyDagre(rightNodesWithRoot, rightEdges, { direction: 'LR', ranksep: 120, nodesep: 60 });

  const leftRootLayout = leftLayout.find(n => n.id === root.id) || root;
  const rightRootLayout = rightLayout.find(n => n.id === root.id) || root;

  // Shift all left layout nodes so that root is at (0,0)
  const finalLeft = leftLayout.filter(n => n.id !== root.id).map(n => ({
    ...n,
    position: {
      x: n.position.x - leftRootLayout.position.x,
      y: n.position.y - leftRootLayout.position.y
    }
  }));

  // Shift all right layout nodes so that root is at (0,0)
  const finalRight = rightLayout.filter(n => n.id !== root.id).map(n => ({
    ...n,
    position: {
      x: n.position.x - rightRootLayout.position.x,
      y: n.position.y - rightRootLayout.position.y
    }
  }));

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
