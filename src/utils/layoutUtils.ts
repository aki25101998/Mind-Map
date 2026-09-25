import type { MindMapNode, MindMapEdge, LayoutType, MindMapNodeType } from '../types';
import { templates } from '../templates/definitions';
import { isStructuralEdge, getStructuralParent } from './graphUtils';

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

  // Trace parent relationships toward root using only structural edges
  let currentNodeId = nodeId;
  const maxDepth = 1000;
  let depth = 0;

  while (depth < maxDepth) {
    const parentId = getStructuralParent(currentNodeId, edges);
    if (!parentId) break; // Disconnected

    const parentNode = nodes.find(n => n.id === parentId);
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

export const estimateNodeSize = (
  type?: MindMapNodeType,
  label?: string,
  fontSize?: number
): { width: number; height: number } => {
  const effectiveFontSize = fontSize || (type === 'main' ? 20 : 14);
  const textLength = label?.length || 8;
  const paddingX = type === 'main' ? 48 : (type === 'rounded' ? 36 : 28);
  const paddingY = type === 'main' ? 28 : 20;

  // Approximate character width
  const charWidth = effectiveFontSize * 0.6;
  const estimatedTextWidth = textLength * charWidth;

  let baseWidth = 160;
  let baseHeight = 50;

  if (type === 'main') {
    baseWidth = 200;
    baseHeight = 70;
  } else if (type === 'ellipse') {
    baseWidth = 160;
    baseHeight = 80;
  } else if (type === 'text') {
    baseWidth = 120;
    baseHeight = 40;
  }

  const width = Math.max(baseWidth, Math.round(estimatedTextWidth + paddingX));
  const height = Math.max(baseHeight, Math.round(effectiveFontSize + paddingY));

  return { width, height };
};

const COLLISION_GAP = 24;

export const findNonCollidingPosition = (
  preferredX: number,
  preferredY: number,
  nodes: MindMapNode[],
  candidateType?: MindMapNodeType,
  candidateLabel?: string,
  candidateFontSize?: number
): { x: number; y: number } => {
  const { width: candW, height: candH } = estimateNodeSize(candidateType, candidateLabel, candidateFontSize);

  const isColliding = (x: number, y: number) => {
    return nodes.some(existingNode => {
      if (existingNode.hidden) return false;

      const exX = existingNode.position.x;
      const exY = existingNode.position.y;
      
      const estimatedExisting = estimateNodeSize(
        existingNode.type, 
        existingNode.data?.label, 
        existingNode.data?.fontSize
      );

      const exW = existingNode.data?.width ?? existingNode.measured?.width ?? estimatedExisting.width;
      const exH = existingNode.data?.height ?? existingNode.measured?.height ?? estimatedExisting.height;
      
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
  let radius = 35;
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
      radius += 45;
    }
  }

  // Fallback to preferred
  return { x: preferredX, y: preferredY };
};

export const normalizeTwoWayDocument = (nodes: MindMapNode[], edges: MindMapEdge[]): MindMapNode[] => {
  const rootNode = nodes.find(n => n.type === 'main');
  if (!rootNode) return nodes;

  const adjList = new Map<string, string[]>();
  edges.forEach(e => {
    if (isStructuralEdge(e)) {
      if (!adjList.has(e.source)) adjList.set(e.source, []);
      adjList.get(e.source)!.push(e.target);
    }
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

/**
 * Calculates auto layout positions for nodes based on template/layoutType.
 * Locked nodes (node.data.locked === true) preserve their exact user-assigned positions.
 */
export const applyAutoLayout = (
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  layoutType: LayoutType
): MindMapNode[] => {
  if (nodes.length === 0 || layoutType === 'free') return nodes;

  let layoutedNodes: MindMapNode[] = [];

  switch (layoutType) {
    case 'tree':
      layoutedNodes = applyClassicMindMap(nodes, edges);
      break;
    case 'two-way':
      layoutedNodes = applyTwoWayMindMap(nodes, edges);
      break;
    case 'radial':
      layoutedNodes = applyRadialMindMap(nodes, edges);
      break;
    case 'org':
      layoutedNodes = applyDagreLayout(nodes, edges, 'TB');
      break;
    case 'flow':
    case 'brace':
      layoutedNodes = applyDagreLayout(nodes, edges, 'LR');
      break;
    case 'one-way':
    default:
      layoutedNodes = applyClassicMindMap(nodes, edges);
      break;
  }

  // Preserve positions for locked nodes
  const lockedNodeMap = new Map<string, { x: number; y: number }>();
  nodes.forEach(n => {
    if (n.data?.locked) {
      lockedNodeMap.set(n.id, n.position);
    }
  });

  if (lockedNodeMap.size > 0) {
    return layoutedNodes.map(n => {
      const lockedPos = lockedNodeMap.get(n.id);
      if (lockedPos) {
        return { ...n, position: lockedPos };
      }
      return n;
    });
  }

  return layoutedNodes;
};
