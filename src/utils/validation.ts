import type { MindMapDocument, MindMapNode, MindMapEdge } from '../types';

export const validateDocument = (doc: unknown): MindMapDocument => {
  if (!doc || typeof doc !== 'object') {
    throw new Error('Document is malformed or empty.');
  }

  const d = doc as Record<string, unknown>;

  if (!d.id || typeof d.id !== 'string') {
    throw new Error('Document ID is missing or invalid.');
  }

  if (typeof d.title !== 'string') {
    d.title = 'Untitled';
  }

  if (!Array.isArray(d.nodes)) {
    throw new Error('Document nodes are missing or invalid.');
  }

  if (!Array.isArray(d.edges)) {
    throw new Error('Document edges are missing or invalid.');
  }

  // Validate nodes
  const validNodeTypes = ['main', 'basic', 'rounded', 'text'];
  const nodeIds = new Set<string>();

  const validatedNodes: MindMapNode[] = d.nodes.map((n: unknown, index: number) => {
    if (!n || typeof n !== 'object') throw new Error(`Node at index ${index} is invalid.`);
    const node = n as Record<string, unknown>;
    
    if (!node.id || typeof node.id !== 'string') {
      throw new Error(`Node at index ${index} is missing an ID.`);
    }
    if (typeof node.type !== 'string' || !validNodeTypes.includes(node.type)) {
      throw new Error(`Node ${node.id} has invalid type: ${node.type}`);
    }
    const pos = node.position as Record<string, unknown>;
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
      throw new Error(`Node ${node.id} has invalid position.`);
    }
    if (!node.data || typeof node.data !== 'object') {
      throw new Error(`Node ${node.id} has invalid data.`);
    }
    nodeIds.add(node.id);
    return node as unknown as MindMapNode;
  });

  // Validate edges
  const validatedEdges: MindMapEdge[] = d.edges.map((e: unknown, index: number) => {
    if (!e || typeof e !== 'object') throw new Error(`Edge at index ${index} is invalid.`);
    const edge = e as Record<string, unknown>;

    if (!edge.id || typeof edge.id !== 'string') {
      throw new Error(`Edge at index ${index} is missing an ID.`);
    }
    if (typeof edge.source !== 'string' || !nodeIds.has(edge.source)) {
      throw new Error(`Edge ${edge.id} has invalid source node: ${edge.source}`);
    }
    if (typeof edge.target !== 'string' || !nodeIds.has(edge.target)) {
      throw new Error(`Edge ${edge.id} has invalid target node: ${edge.target}`);
    }
    return edge as unknown as MindMapEdge;
  });

  // Validate viewport
  const vp = d.viewport as Record<string, unknown>;
  if (!vp || typeof vp.x !== 'number' || typeof vp.y !== 'number' || typeof vp.zoom !== 'number') {
    throw new Error('Document viewport is malformed.');
  }

  return {
    id: d.id,
    title: d.title as string,
    nodes: validatedNodes,
    edges: validatedEdges,
    viewport: { x: vp.x, y: vp.y, zoom: vp.zoom },
    templateId: typeof d.templateId === 'string' ? d.templateId : undefined,
    createdAt: typeof d.createdAt === 'number' ? d.createdAt : Date.now(),
    updatedAt: typeof d.updatedAt === 'number' ? d.updatedAt : Date.now(),
  };
};
