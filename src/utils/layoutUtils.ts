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
const MAX_ATTEMPTS = 50;

/**
 * Finds a non-colliding position close to the preferred position.
 */
export const findNonCollidingPosition = (
  preferredX: number,
  preferredY: number,
  nodes: MindMapNode[]
): { x: number; y: number } => {
  const isColliding = (x: number, y: number) => {
    return nodes.some(existingNode => {
      const exX = existingNode.position.x;
      const exY = existingNode.position.y;
      
      const candidateRight = x + NODE_WIDTH;
      const candidateLeft = x;
      const candidateBottom = y + NODE_HEIGHT;
      const candidateTop = y;

      const existingRight = exX + NODE_WIDTH;
      const existingLeft = exX;
      const existingBottom = exY + NODE_HEIGHT;
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

  const SEARCH_STEP = 80;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const radius = attempt * SEARCH_STEP;

    // Try +Y
    if (!isColliding(preferredX, preferredY + radius)) {
      return { x: preferredX, y: preferredY + radius };
    }
    // Try -Y
    if (!isColliding(preferredX, preferredY - radius)) {
      return { x: preferredX, y: preferredY - radius };
    }
    // Try +X
    if (!isColliding(preferredX + radius, preferredY)) {
      return { x: preferredX + radius, y: preferredY };
    }
    // Try -X
    if (!isColliding(preferredX - radius, preferredY)) {
      return { x: preferredX - radius, y: preferredY };
    }
  }

  // If no position found, place at preferred
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
