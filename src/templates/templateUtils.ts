import { v4 as uuidv4 } from 'uuid';
import type { Template, MindMapNode, MindMapEdge } from '../types';

export const cloneTemplate = (template: Template) => {
  const idMap: Record<string, string> = {};
  const { stylePreset } = template;

  // Generate new IDs
  template.defaultNodes.forEach(n => {
    idMap[n.id] = uuidv4();
  });

  const rootNode = template.defaultNodes.find(n => n.type === 'main') || template.defaultNodes[0];

  // Build adjacency to determine branch indices
  const adjList = new Map<string, string[]>();
  template.defaultEdges.forEach(e => {
    if (!adjList.has(e.source)) adjList.set(e.source, []);
    adjList.get(e.source)!.push(e.target);
  });

  // Assign a branch index to each node
  const nodeBranchIndex = new Map<string, number>();
  if (rootNode) {
    const immediateChildren = adjList.get(rootNode.id) || [];
    immediateChildren.forEach((childId, index) => {
      // All descendants of this child inherit the same branch index
      const queue = [childId];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (!nodeBranchIndex.has(curr)) {
          nodeBranchIndex.set(curr, index);
          const children = adjList.get(curr) || [];
          queue.push(...children);
        }
      }
    });
  }

  const nodes: MindMapNode[] = template.defaultNodes.map(n => {
    let presetData = {};
    if (stylePreset) {
      if (n.type === 'main' && stylePreset.rootStyle) {
        presetData = stylePreset.rootStyle;
      } else if (n.type !== 'main' && stylePreset.branchStyles && stylePreset.branchStyles.length > 0) {
        const bIndex = nodeBranchIndex.get(n.id) ?? 0;
        const style = stylePreset.branchStyles[bIndex % stylePreset.branchStyles.length];
        presetData = style;
      }
    }

    return {
      ...n,
      id: idMap[n.id],
      data: { ...presetData, ...n.data }
    };
  });

  const edges: MindMapEdge[] = template.defaultEdges.map(e => {
    // Merge preset edge style but let specific edge data override
    const presetEdgeStyleData = stylePreset?.edgeStyle?.data || {};
    const explicitEdgeStyleData = e.data || {};
    
    return {
      ...(stylePreset?.edgeStyle || {}),
      ...e,
      id: uuidv4(),
      source: idMap[e.source],
      target: idMap[e.target],
      data: {
        ...presetEdgeStyleData,
        ...explicitEdgeStyleData
      }
    };
  });

  return { nodes, edges };
};
