import type { MindMapDocument, MindMapNode, MindMapEdge } from '../types';

/**
 * Recursively removes undefined properties from an object or array.
 * Firestore setDoc/updateDoc throws an error if any field is undefined.
 */
export function removeUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => removeUndefined(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = removeUndefined(value);
    }
  }

  return result as T;
}

/**
 * Strips ephemeral runtime properties (selected, dragging, measured, etc.)
 * from nodes and edges, and removes any undefined fields so Firestore/IDB saves cleanly.
 */
export function sanitizeDocumentForPersistence(doc: MindMapDocument): MindMapDocument {
  const sanitizedNodes: MindMapNode[] = (doc.nodes || []).map(node => {
    // Strip ephemeral runtime states
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { selected, dragging, resizing, measured, hidden, ...rest } = node as any;
    return {
      ...rest,
      data: removeUndefined(node.data || {})
    } as MindMapNode;
  });

  const sanitizedEdges: MindMapEdge[] = (doc.edges || []).map(edge => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { selected, hidden, ...rest } = edge as any;
    return {
      ...rest,
      data: removeUndefined(edge.data || {})
    } as MindMapEdge;
  });

  const baseDoc: Partial<MindMapDocument> = {
    id: doc.id,
    title: doc.title,
    nodes: sanitizedNodes,
    edges: sanitizedEdges,
    viewport: doc.viewport || { x: 0, y: 0, zoom: 1 },
    templateId: doc.templateId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    shareEnabled: doc.shareEnabled,
    shareId: doc.shareId,
    sharePermission: doc.sharePermission
  };

  return removeUndefined(baseDoc) as MindMapDocument;
}
