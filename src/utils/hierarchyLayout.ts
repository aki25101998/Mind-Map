import type { MindMapNode, MindMapEdge, LayoutType } from '../types';
import dagre from 'dagre';
import type { LayoutSide } from './layoutUtils';

interface TreeNode {
  node: MindMapNode;
  children: TreeNode[];
  side: LayoutSide;
  width: number;
  height: number;
  subtreeWidth: number;
  subtreeHeight: number;
  x: number;
  y: number;
}

const DEFAULT_WIDTH = 150;
const DEFAULT_HEIGHT = 50;
const NODE_SEP = 30; // Vertical spacing between siblings
const RANK_SEP = 80; // Horizontal spacing between parent and child

export const buildHierarchyTree = (
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  _layoutType: LayoutType
): TreeNode | null => {
  if (nodes.length === 0) return null;

  const rootNode = nodes.find(n => n.type === 'main') || nodes[0];
  if (!rootNode) return null;

  const adjList = new Map<string, string[]>();
  edges.forEach(e => {
    if (!e.hidden) {
      if (!adjList.has(e.source)) adjList.set(e.source, []);
      adjList.get(e.source)!.push(e.target);
    }
  });

  const buildSubtree = (nodeId: string, depth: number, parentSide?: LayoutSide): TreeNode | null => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.hidden) return null;

    const side = parentSide || 'right';

    const childrenIds = adjList.get(nodeId) || [];
    const children = childrenIds
      .map(childId => buildSubtree(childId, depth + 1, side))
      .filter((c): c is TreeNode => c !== null);

    const width = node.measured?.width ?? DEFAULT_WIDTH;
    const height = node.measured?.height ?? DEFAULT_HEIGHT;

    return {
      node,
      children,
      side: side as LayoutSide,
      width,
      height,
      subtreeWidth: 0,
      subtreeHeight: 0,
      x: 0,
      y: 0
    };
  };

  const rootTree = buildSubtree(rootNode.id, 0, 'center');
  if (!rootTree) return null;

  return rootTree;
};

const calculateSubtreeSizes = (tree: TreeNode) => {
  tree.width = tree.node.measured?.width ?? DEFAULT_WIDTH;
  tree.height = tree.node.measured?.height ?? DEFAULT_HEIGHT;

  if (tree.children.length === 0) {
    tree.subtreeWidth = tree.width;
    tree.subtreeHeight = tree.height;
    return;
  }

  let totalHeight = 0;
  let maxWidth = 0;

  tree.children.forEach((child, index) => {
    calculateSubtreeSizes(child);
    totalHeight += child.subtreeHeight;
    if (index < tree.children.length - 1) {
      totalHeight += NODE_SEP;
    }
    if (child.subtreeWidth > maxWidth) {
      maxWidth = child.subtreeWidth;
    }
  });

  tree.subtreeWidth = tree.width + RANK_SEP + maxWidth;
  tree.subtreeHeight = Math.max(tree.height, totalHeight);
};

const positionSubtreeRight = (tree: TreeNode, startX: number, startY: number) => {
  tree.x = startX;
  tree.y = startY + (tree.subtreeHeight - tree.height) / 2;

  if (tree.children.length === 0) return;

  const childrenTotalHeight = tree.children.reduce((sum, c) => sum + c.subtreeHeight, 0) + (tree.children.length - 1) * NODE_SEP;
  
  let currentY = startY + (tree.subtreeHeight - childrenTotalHeight) / 2;
  tree.children.forEach(child => {
    positionSubtreeRight(child, startX + tree.width + RANK_SEP, currentY);
    currentY += child.subtreeHeight + NODE_SEP;
  });
};

const positionSubtreeLeft = (tree: TreeNode, endX: number, startY: number) => {
  tree.x = endX - tree.width;
  tree.y = startY + (tree.subtreeHeight - tree.height) / 2;

  if (tree.children.length === 0) return;

  const childrenTotalHeight = tree.children.reduce((sum, c) => sum + c.subtreeHeight, 0) + (tree.children.length - 1) * NODE_SEP;

  let currentY = startY + (tree.subtreeHeight - childrenTotalHeight) / 2;
  tree.children.forEach(child => {
    positionSubtreeLeft(child, endX - tree.width - RANK_SEP, currentY);
    currentY += child.subtreeHeight + NODE_SEP;
  });
};

export const applyClassicMindMap = (nodes: MindMapNode[], edges: MindMapEdge[]): MindMapNode[] => {
  const tree = buildHierarchyTree(nodes, edges, 'free');
  if (!tree) return nodes;

  calculateSubtreeSizes(tree);
  tree.x = -(tree.width / 2);
  tree.y = -(tree.height / 2);

  const setSide = (t: TreeNode, side: LayoutSide) => {
    t.side = side;
    t.children.forEach(c => setSide(c, side));
  };
  tree.side = 'center';
  tree.children.forEach(c => setSide(c, 'right'));

  const childrenTotalHeight = tree.children.reduce((sum, c) => sum + c.subtreeHeight, 0) + Math.max(0, tree.children.length - 1) * NODE_SEP;

  let currentY = tree.y + (tree.height - childrenTotalHeight) / 2;
  tree.children.forEach(child => {
    positionSubtreeRight(child, tree.x + tree.width + RANK_SEP, currentY);
    currentY += child.subtreeHeight + NODE_SEP;
  });

  const flattenTree = (t: TreeNode): MindMapNode[] => {
    return [{ 
      ...t.node, 
      position: { x: t.x, y: t.y },
      data: { ...t.node.data, layoutSide: t.side }
    }, ...t.children.flatMap(flattenTree)];
  };

  const layoutedNodesMap = new Map<string, MindMapNode>();
  flattenTree(tree).forEach(n => layoutedNodesMap.set(n.id, n));

  return nodes.map(n => layoutedNodesMap.get(n.id) || n);
};

export const applyTwoWayMindMap = (nodes: MindMapNode[], edges: MindMapEdge[]): MindMapNode[] => {
  const tree = buildHierarchyTree(nodes, edges, 'two-way');
  if (!tree) return nodes;

  calculateSubtreeSizes(tree);

  const leftChildren: TreeNode[] = [];
  const rightChildren: TreeNode[] = [];
  let leftTotalHeight = 0;
  let rightTotalHeight = 0;

  // Sort by subtree height descending to balance optimally
  const sortedChildren = [...tree.children].sort((a, b) => b.subtreeHeight - a.subtreeHeight);

  sortedChildren.forEach(child => {
    if (leftTotalHeight <= rightTotalHeight) {
      leftChildren.push(child);
      leftTotalHeight += child.subtreeHeight + (leftChildren.length > 1 ? NODE_SEP : 0);
    } else {
      rightChildren.push(child);
      rightTotalHeight += child.subtreeHeight + (rightChildren.length > 1 ? NODE_SEP : 0);
    }
  });

  const setSide = (t: TreeNode, side: LayoutSide) => {
    t.side = side;
    t.children.forEach(c => setSide(c, side));
  };

  leftChildren.forEach(c => setSide(c, 'left'));
  rightChildren.forEach(c => setSide(c, 'right'));

  tree.x = -(tree.width / 2);
  tree.y = -(tree.height / 2);
  tree.side = 'center';

  let leftY = tree.y + (tree.height - leftTotalHeight) / 2;
  leftChildren.forEach(child => {
    positionSubtreeLeft(child, tree.x - RANK_SEP, leftY);
    leftY += child.subtreeHeight + NODE_SEP;
  });

  let rightY = tree.y + (tree.height - rightTotalHeight) / 2;
  rightChildren.forEach(child => {
    positionSubtreeRight(child, tree.x + tree.width + RANK_SEP, rightY);
    rightY += child.subtreeHeight + NODE_SEP;
  });

  const flattenTree = (t: TreeNode): MindMapNode[] => {
    return [{ 
      ...t.node, 
      position: { x: t.x, y: t.y },
      data: { ...t.node.data, layoutSide: t.side }
    }, ...t.children.flatMap(flattenTree)];
  };

  const layoutedNodesMap = new Map<string, MindMapNode>();
  flattenTree(tree).forEach(n => layoutedNodesMap.set(n.id, n));

  return nodes.map(n => layoutedNodesMap.get(n.id) || n);
};

export const applyRadialMindMap = (nodes: MindMapNode[], edges: MindMapEdge[]): MindMapNode[] => {
  const tree = buildHierarchyTree(nodes, edges, 'radial');
  if (!tree) return nodes;

  tree.x = -(tree.node.measured?.width ?? DEFAULT_WIDTH) / 2;
  tree.y = -(tree.node.measured?.height ?? DEFAULT_HEIGHT) / 2;

  // Flatten the rest of the nodes level by level
  let level = 1;
  const LEVEL_RADIUS = 250;
  
  let queue = tree.children;
  
  while (queue.length > 0) {
    const currentRadius = level * LEVEL_RADIUS;
    const angleStep = (2 * Math.PI) / queue.length;
    
    let nextQueue: TreeNode[] = [];
    
    queue.forEach((child, index) => {
      const angle = index * angleStep;
      child.x = Math.round(Math.cos(angle) * currentRadius) - (child.node.measured?.width ?? DEFAULT_WIDTH) / 2;
      child.y = Math.round(Math.sin(angle) * currentRadius) - (child.node.measured?.height ?? DEFAULT_HEIGHT) / 2;
      nextQueue.push(...child.children);
    });
    
    queue = nextQueue;
    level++;
  }

  const flattenTree = (t: TreeNode): MindMapNode[] => {
    return [{ ...t.node, position: { x: t.x, y: t.y } }, ...t.children.flatMap(flattenTree)];
  };

  const layoutedNodesMap = new Map<string, MindMapNode>();
  flattenTree(tree).forEach(n => layoutedNodesMap.set(n.id, n));

  return nodes.map(n => layoutedNodesMap.get(n.id) || n);
};

export const applyDagreLayout = (
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  direction: 'TB' | 'LR' | 'RL' | 'BT' = 'TB'
): MindMapNode[] => {
  if (nodes.length === 0) return nodes;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 50 });

  nodes.forEach(node => {
    if (!node.hidden) {
      dagreGraph.setNode(node.id, { 
        width: node.measured?.width ?? DEFAULT_WIDTH, 
        height: node.measured?.height ?? DEFAULT_HEIGHT 
      });
    }
  });

  edges.forEach(edge => {
    if (!edge.hidden && dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  return nodes.map(node => {
    if (node.hidden) return node;
    const nodeWithPosition = dagreGraph.node(node.id);
    if (nodeWithPosition) {
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - (node.measured?.width ?? DEFAULT_WIDTH) / 2,
          y: nodeWithPosition.y - (node.measured?.height ?? DEFAULT_HEIGHT) / 2,
        },
      };
    }
    return node;
  });
};
