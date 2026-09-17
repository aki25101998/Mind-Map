import { v4 as uuidv4 } from 'uuid';
import type { Template, MindMapNode, MindMapEdge } from '../types';

export const cloneTemplate = (template: Template) => {
  const idMap: Record<string, string> = {};

  const nodes: MindMapNode[] = template.defaultNodes.map(n => {
    const newId = uuidv4();
    idMap[n.id] = newId;
    // Deep clone data
    return {
      ...n,
      id: newId,
      data: { ...n.data }
    };
  });

  const edges: MindMapEdge[] = template.defaultEdges.map(e => {
    return {
      ...e,
      id: uuidv4(),
      source: idMap[e.source],
      target: idMap[e.target]
    };
  });

  return { nodes, edges };
};
