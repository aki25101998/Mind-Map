import { v4 as uuidv4 } from 'uuid';
import type { Template, MindMapNode, MindMapEdge } from '../types';

export const cloneTemplate = (template: Template) => {
  const idMap: Record<string, string> = {};
  const { stylePreset } = template;

  const nodes: MindMapNode[] = template.defaultNodes.map(n => {
    const newId = uuidv4();
    idMap[n.id] = newId;
    
    let presetData = {};
    if (stylePreset) {
      if (n.type === 'main' && stylePreset.rootStyle) {
        presetData = stylePreset.rootStyle;
      } else if (n.type !== 'main' && stylePreset.branchStyles && stylePreset.branchStyles.length > 0) {
        // Use a simple hash or just the first style for branches
        presetData = stylePreset.branchStyles[0];
      }
    }

    return {
      ...n,
      id: newId,
      data: { ...presetData, ...n.data }
    };
  });

  const edges: MindMapEdge[] = template.defaultEdges.map(e => {
    return {
      ...(stylePreset?.edgeStyle || {}),
      ...e,
      id: uuidv4(),
      source: idMap[e.source],
      target: idMap[e.target],
      data: {
        ...(stylePreset?.edgeStyle?.data || {}),
        ...(e.data || {})
      }
    };
  });

  return { nodes, edges };
};
