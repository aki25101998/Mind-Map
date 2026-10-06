import { getNodesBounds, type Node } from '@xyflow/react';

export interface ViewportCenterTarget {
  x: number;
  y: number;
}

/**
 * Normalizes nodes so that width/height from node.data (if not already present in measured or width)
 * are populated for bounds calculation.
 */
export function normalizeNodesForBounds<T extends Node>(nodes: T[]): T[] {
  return nodes.map(node => {
    if (node.measured?.width || node.width) return node;
    const dataW = typeof (node.data as any)?.width === 'number' ? (node.data as any).width : undefined;
    const dataH = typeof (node.data as any)?.height === 'number' ? (node.data as any).height : undefined;
    if (dataW || dataH) {
      return {
        ...node,
        width: node.width ?? dataW,
        height: node.height ?? dataH,
      };
    }
    return node;
  });
}

/**
 * Calculates the bounding box center of all visible nodes.
 * Hidden nodes (node.hidden === true, e.g. collapsed subtrees) are excluded.
 * Returns null if there are no visible nodes.
 */
export function calculateVisibleNodesCenter(nodes: Node[]): ViewportCenterTarget | null {
  const visibleNodes = nodes.filter(node => !node.hidden);
  if (visibleNodes.length === 0) {
    return null;
  }
  const bounds = getNodesBounds(normalizeNodesForBounds(visibleNodes));
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

/**
 * Calculates the React Flow viewport { x, y, zoom } needed to center a target point (targetX, targetY)
 * within a canvas container of size (containerWidth, containerHeight).
 *
 * Matching React Flow's setCenter formula:
 * viewport.x = containerWidth / 2 - targetX * zoom
 * viewport.y = containerHeight / 2 - targetY * zoom
 */
export function calculateViewportForCenter(
  target: ViewportCenterTarget,
  container: { width: number; height: number },
  zoom: number = 1
) {
  return {
    x: container.width / 2 - target.x * zoom,
    y: container.height / 2 - target.y * zoom,
    zoom,
  };
}
