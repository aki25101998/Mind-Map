import type { MindMapDocument } from '../types';

export const validateDocument = (doc: any): MindMapDocument => {
  if (!doc || typeof doc !== 'object') {
    throw new Error('Document is malformed or empty.');
  }

  if (!doc.id || typeof doc.id !== 'string') {
    throw new Error('Document ID is missing or invalid.');
  }

  if (!Array.isArray(doc.nodes)) {
    throw new Error('Document nodes are missing or invalid.');
  }

  if (!Array.isArray(doc.edges)) {
    throw new Error('Document edges are missing or invalid.');
  }

  // Validate nodes
  const validNodeTypes = ['main', 'basic', 'rounded', 'text'];
  const nodeIds = new Set<string>();

  doc.nodes.forEach((node: any, index: number) => {
    if (!node.id || typeof node.id !== 'string') {
      throw new Error(`Node at index ${index} is missing an ID.`);
    }
    if (!validNodeTypes.includes(node.type)) {
      throw new Error(`Node ${node.id} has invalid type: ${node.type}`);
    }
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      throw new Error(`Node ${node.id} has invalid position.`);
    }
    nodeIds.add(node.id);
  });

  // Validate edges
  doc.edges.forEach((edge: any, index: number) => {
    if (!edge.id || typeof edge.id !== 'string') {
      throw new Error(`Edge at index ${index} is missing an ID.`);
    }
    if (!edge.source || !nodeIds.has(edge.source)) {
      throw new Error(`Edge ${edge.id} has invalid source node: ${edge.source}`);
    }
    if (!edge.target || !nodeIds.has(edge.target)) {
      throw new Error(`Edge ${edge.id} has invalid target node: ${edge.target}`);
    }
  });

  // Validate viewport
  if (!doc.viewport || typeof doc.viewport.x !== 'number' || typeof doc.viewport.y !== 'number' || typeof doc.viewport.zoom !== 'number') {
    throw new Error('Document viewport is malformed.');
  }

  return doc as MindMapDocument;
};
