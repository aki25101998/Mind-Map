import type { StateCreator } from 'zustand';
import type { MindMapState, HistorySlice, HistorySnapshot } from './types';
import type { MindMapNode, MindMapEdge } from '../../types';
import { computeHasChildrenMap, computeSubtreeVisibility } from '../../utils/graphUtils';

export const createHistorySnapshot = (nodes: MindMapNode[], edges: MindMapEdge[]): HistorySnapshot => {
  const strippedNodes = nodes.map(n => {
    // Strip derived and ephemeral properties that shouldn't affect history or equality checks
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { selected, dragging, resizing, measured, width, height, hidden, ...rest } = n;
    return rest as MindMapNode;
  });

  const strippedEdges = edges.map(e => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { selected, hidden, ...rest } = e;
    return rest as MindMapEdge;
  });

  return {
    nodes: JSON.parse(JSON.stringify(strippedNodes)),
    edges: JSON.parse(JSON.stringify(strippedEdges))
  };
};

const MAX_HISTORY = 50;

export const createHistorySlice: StateCreator<MindMapState, [], [], HistorySlice> = (set, get) => ({
  history: [],
  historyIndex: -1,

  commitHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    
    const newSnapshot = createHistorySnapshot(nodes, edges);
    const currentSnapshot = history[historyIndex];

    if (
      currentSnapshot &&
      JSON.stringify(currentSnapshot.nodes) === JSON.stringify(newSnapshot.nodes) &&
      JSON.stringify(currentSnapshot.edges) === JSON.stringify(newSnapshot.edges)
    ) {
      return;
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSnapshot);

    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const snapshot = history[prevIndex];
      const parsedNodes = JSON.parse(JSON.stringify(snapshot.nodes));
      const parsedEdges = JSON.parse(JSON.stringify(snapshot.edges));

      // Derive visibility and children map from restored structure
      const { nodes: visibleNodes, edges: visibleEdges } = computeSubtreeVisibility(parsedNodes, parsedEdges);

      set({
        nodes: visibleNodes,
        edges: visibleEdges,
        hasChildrenMap: computeHasChildrenMap(visibleEdges),
        selectedNodeIds: [],
        editingNodeId: null,
        contextMenu: null,
        historyIndex: prevIndex
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const snapshot = history[nextIndex];
      const parsedNodes = JSON.parse(JSON.stringify(snapshot.nodes));
      const parsedEdges = JSON.parse(JSON.stringify(snapshot.edges));

      // Derive visibility and children map from restored structure
      const { nodes: visibleNodes, edges: visibleEdges } = computeSubtreeVisibility(parsedNodes, parsedEdges);

      set({
        nodes: visibleNodes,
        edges: visibleEdges,
        hasChildrenMap: computeHasChildrenMap(visibleEdges),
        selectedNodeIds: [],
        editingNodeId: null,
        contextMenu: null,
        historyIndex: nextIndex
      });
    }
  }
});
