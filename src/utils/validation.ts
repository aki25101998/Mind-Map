import type { MindMapDocument, MindMapNode, MindMapEdge } from '../types';

export const validateDocument = (doc: unknown): MindMapDocument => {
  if (!doc || typeof doc !== 'object') {
    throw new Error('Document is malformed or empty.');
  }

  const d = doc as Record<string, unknown>;

  if (!d.id || typeof d.id !== 'string') {
    throw new Error('Document ID is missing or invalid.');
  }

  const title = typeof d.title === 'string' ? d.title : 'Untitled';

  if (!Array.isArray(d.nodes)) {
    throw new Error('Document nodes are missing or invalid.');
  }

  if (!Array.isArray(d.edges)) {
    throw new Error('Document edges are missing or invalid.');
  }

  // Validate nodes
  const validNodeTypes = ['main', 'basic', 'rounded', 'text'];
  const validLayoutSides = ['left', 'right', 'center'];
  const nodeIds = new Set<string>();

  const validatedNodes: MindMapNode[] = d.nodes.map((n: unknown, index: number) => {
    if (!n || typeof n !== 'object') throw new Error(`Node at index ${index} is invalid.`);
    const node = n as Record<string, unknown>;
    
    if (!node.id || typeof node.id !== 'string') {
      throw new Error(`Node at index ${index} is missing an ID.`);
    }
    if (nodeIds.has(node.id)) {
      throw new Error(`Duplicate node ID found: ${node.id}`);
    }
    if (typeof node.type !== 'string' || !validNodeTypes.includes(node.type)) {
      throw new Error(`Node ${node.id} has invalid type: ${node.type}`);
    }
    const pos = node.position as Record<string, unknown>;
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number' || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
      throw new Error(`Node ${node.id} has invalid position.`);
    }
    
    const data = node.data as Record<string, unknown>;
    if (!data || typeof data !== 'object') {
      throw new Error(`Node ${node.id} has invalid data.`);
    }
    if (typeof data.label !== 'string') {
      throw new Error(`Node ${node.id} label must be a string.`);
    }
    if (data.layoutSide !== undefined && (typeof data.layoutSide !== 'string' || !validLayoutSides.includes(data.layoutSide))) {
      throw new Error(`Node ${node.id} has invalid layoutSide.`);
    }

    nodeIds.add(node.id);
    return node as unknown as MindMapNode;
  });

  // Validate edges
  const validEdgeStyles = ['curved', 'straight', 'orthogonal'];
  const edgeIds = new Set<string>();

  const validatedEdges: MindMapEdge[] = d.edges.map((e: unknown, index: number) => {
    if (!e || typeof e !== 'object') throw new Error(`Edge at index ${index} is invalid.`);
    const edge = e as Record<string, unknown>;

    if (!edge.id || typeof edge.id !== 'string') {
      throw new Error(`Edge at index ${index} is missing an ID.`);
    }
    if (edgeIds.has(edge.id)) {
      throw new Error(`Duplicate edge ID found: ${edge.id}`);
    }
    if (typeof edge.source !== 'string' || !nodeIds.has(edge.source)) {
      throw new Error(`Edge ${edge.id} has invalid source node: ${edge.source}`);
    }
    if (typeof edge.target !== 'string' || !nodeIds.has(edge.target)) {
      throw new Error(`Edge ${edge.id} has invalid target node: ${edge.target}`);
    }

    if (edge.type !== undefined && edge.type !== 'mindmap-edge') {
      throw new Error(`Edge ${edge.id} has invalid type.`);
    }

    const data = edge.data as Record<string, unknown> | undefined;
    if (data !== undefined && typeof data !== 'object') {
      throw new Error(`Edge ${edge.id} has invalid data.`);
    }
    if (data?.edgeStyle !== undefined && (typeof data.edgeStyle !== 'string' || !validEdgeStyles.includes(data.edgeStyle))) {
      throw new Error(`Edge ${edge.id} has invalid edgeStyle.`);
    }
    if (data?.arrowStart !== undefined && typeof data.arrowStart !== 'boolean') {
      throw new Error(`Edge ${edge.id} arrowStart must be boolean.`);
    }
    if (data?.arrowEnd !== undefined && typeof data.arrowEnd !== 'boolean') {
      throw new Error(`Edge ${edge.id} arrowEnd must be boolean.`);
    }
    if (data?.strokeWidth !== undefined && (typeof data.strokeWidth !== 'number' || !Number.isFinite(data.strokeWidth))) {
      throw new Error(`Edge ${edge.id} strokeWidth must be a finite number.`);
    }
    if (data?.strokeColor !== undefined && typeof data.strokeColor !== 'string') {
      throw new Error(`Edge ${edge.id} strokeColor must be a string.`);
    }

    edgeIds.add(edge.id);
    return edge as unknown as MindMapEdge;
  });

  // Validate viewport
  const vp = d.viewport as Record<string, unknown>;
  if (!vp || typeof vp.x !== 'number' || typeof vp.y !== 'number' || typeof vp.zoom !== 'number') {
    throw new Error('Document viewport is malformed.');
  }

  return {
    id: d.id,
    title,
    nodes: validatedNodes,
    edges: validatedEdges,
    viewport: { x: vp.x, y: vp.y, zoom: vp.zoom },
    templateId: typeof d.templateId === 'string' ? d.templateId : undefined,
    createdAt: typeof d.createdAt === 'number' ? d.createdAt : Date.now(),
    updatedAt: typeof d.updatedAt === 'number' ? d.updatedAt : Date.now(),
  };
};
