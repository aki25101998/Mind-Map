import type { MindMapNode, MindMapEdge, LayoutType } from '../types';
import { templates } from '../templates/definitions';

export type LayoutSide = 'left' | 'right' | 'center';

export const getLayoutType = (templateId?: string): LayoutType => {
  if (!templateId) return 'free';
  const template = templates.find(t => t.id === templateId);
  return template?.layoutType || 'free';
};

/**
 * Resolves the logical layout side of a node in a Two-way layout.
 */
export const resolveNodeLayoutSide = (
  nodeId: string,
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  layoutType: LayoutType
): LayoutSide | undefined => {
  if (layoutType === 'free') {
    return undefined;
  }
  if (layoutType !== 'two-way') {
    const node = nodes.find(n => n.id === nodeId);
    return node?.data?.layoutSide as LayoutSide | undefined;
  }

  const node = nodes.find(n => n.id === nodeId);
  if (!node) return undefined;

  if (node.type === 'main') return 'center';

  if (node.data?.layoutSide === 'left' || node.data?.layoutSide === 'right') {
    return node.data.layoutSide;
  }

  // Trace parent relationships toward root
  let currentNodeId = nodeId;
  const maxDepth = 1000;
  let depth = 0;

  while (depth < maxDepth) {
    const parentEdge = edges.find(e => e.target === currentNodeId);
    if (!parentEdge) break; // Disconnected

    const parentNode = nodes.find(n => n.id === parentEdge.source);
    if (!parentNode) break;

    if (parentNode.type === 'main') {
      // Current node is an immediate child of root
      const currNodeData = nodes.find(n => n.id === currentNodeId);
      if (currNodeData?.data?.layoutSide === 'left' || currNodeData?.data?.layoutSide === 'right') {
        return currNodeData.data.layoutSide;
      }
      
      // Fallback for legacy items without layoutSide: use X position
      return (currNodeData?.position.x ?? 0) < (parentNode.position.x ?? 0) ? 'left' : 'right';
    }

    currentNodeId = parentNode.id;
    depth++;
  }

  // If entirely disconnected and no explicit side, fallback to X position relative to 0
  return node.position.x < 0 ? 'left' : 'right';
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;
const COLLISION_GAP = 20;

export const findNonCollidingPosition = (
  preferredX: number,
  preferredY: number,
  nodes: MindMapNode[]
): { x: number; y: number } => {
  const candW = NODE_WIDTH;
  const candH = NODE_HEIGHT;

  const isColliding = (x: number, y: number) => {
    return nodes.some(existingNode => {
      const exX = existingNode.position.x;
      const exY = existingNode.position.y;
      const exW = existingNode.measured?.width ?? NODE_WIDTH;
      const exH = existingNode.measured?.height ?? NODE_HEIGHT;
      
      const candidateRight = x + candW;
      const candidateLeft = x;
      const candidateBottom = y + candH;
      const candidateTop = y;

      const existingRight = exX + exW;
      const existingLeft = exX;
      const existingBottom = exY + exH;
      const existingTop = exY;

      return (
        candidateRight + COLLISION_GAP > existingLeft &&
        candidateLeft - COLLISION_GAP < existingRight &&
        candidateBottom + COLLISION_GAP > existingTop &&
        candidateTop - COLLISION_GAP < existingBottom
      );
    });
  };

  if (!isColliding(preferredX, preferredY)) {
    return { x: preferredX, y: preferredY };
  }

  let angle = 0;
  let radius = 30;
  const MAX_ATTEMPTS = 300;
  
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const testX = preferredX + Math.cos(angle) * radius;
    const testY = preferredY + Math.sin(angle) * radius;
    
    if (!isColliding(testX, testY)) {
      return { x: Math.round(testX), y: Math.round(testY) };
    }
    
    // Spiral search: 30 degrees step, grow radius every full circle
    angle += Math.PI / 6; 
    if (angle >= 2 * Math.PI - 0.01) {
      angle = 0;
      radius += 40;
    }
  }

  // If no position found (extremely rare), place at preferred
  return { x: preferredX, y: preferredY };
};

export const normalizeTwoWayDocument = (nodes: MindMapNode[], edges: MindMapEdge[]): MindMapNode[] => {
  const rootNode = nodes.find(n => n.type === 'main');
  if (!rootNode) return nodes;

  const adjList = new Map<string, string[]>();
  edges.forEach(e => {
    if (!adjList.has(e.source)) adjList.set(e.source, []);
    adjList.get(e.source)!.push(e.target);
  });

  const nodeSides = new Map<string, LayoutSide>();
  nodeSides.set(rootNode.id, 'center');

  const immediateChildren = adjList.get(rootNode.id) || [];
  immediateChildren.forEach(childId => {
    const childNode = nodes.find(n => n.id === childId);
    if (!childNode) return;

    let side = childNode.data?.layoutSide as LayoutSide | undefined;
    if (side !== 'left' && side !== 'right') {
      side = childNode.position.x < (rootNode.position.x || 0) ? 'left' : 'right';
    }

    const queue = [childId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (!nodeSides.has(curr)) {
        nodeSides.set(curr, side);
        const children = adjList.get(curr) || [];
        queue.push(...children);
      }
    }
  });

  return nodes.map(n => {
    let side = nodeSides.get(n.id);
    
    // Disconnected node fallback
    if (!side && n.type !== 'main') {
      side = n.data?.layoutSide as LayoutSide | undefined;
      if (side !== 'left' && side !== 'right') {
        side = n.position.x < (rootNode.position.x || 0) ? 'left' : 'right';
      }
    }

    if (side && n.data?.layoutSide !== side) {
      return {
        ...n,
        data: {
          ...n.data,
          layoutSide: side
        }
      };
    }
    return n;
  });
};

import { applyClassicMindMap, applyTwoWayMindMap, applyRadialMindMap, applyDagreLayout } from './hierarchyLayout';

export const applyAutoLayout = (
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  layoutType: LayoutType
): MindMapNode[] => {
  if (nodes.length === 0 || layoutType === 'free') return nodes;

  switch (layoutType) {
    case 'tree':
      return applyClassicMindMap(nodes, edges);
    case 'two-way':
      return applyTwoWayMindMap(nodes, edges);
    case 'radial':
      return applyRadialMindMap(nodes, edges);
    case 'org':
      return applyDagreLayout(nodes, edges, 'TB');
    case 'flow':
      return applyDagreLayout(nodes, edges, 'LR');
    case 'brace':
      return applyDagreLayout(nodes, edges, 'LR');
    case 'one-way':
      return applyClassicMindMap(nodes, edges);
    default:
      return applyClassicMindMap(nodes, edges);
  }
};
