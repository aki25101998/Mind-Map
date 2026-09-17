import type { StateCreator } from 'zustand';
import type { MindMapState, HistorySlice, HistorySnapshot } from './types';
import type { MindMapNode, MindMapEdge } from '../../types';

export const createHistorySnapshot = (nodes: MindMapNode[], edges: MindMapEdge[]): HistorySnapshot => {
  const strippedNodes = nodes.map(n => {
    // Strip properties that shouldn't affect history or equality checks
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { selected, dragging, resizing, measured, width, height, ...rest } = n;
    return rest as MindMapNode;
  });

  return {
    nodes: JSON.parse(JSON.stringify(strippedNodes)),
    edges: JSON.parse(JSON.stringify(edges))
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
      set({
        nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
        edges: JSON.parse(JSON.stringify(snapshot.edges)),
        historyIndex: prevIndex
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const snapshot = history[nextIndex];
      set({
        nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
        edges: JSON.parse(JSON.stringify(snapshot.edges)),
        historyIndex: nextIndex
      });
    }
  }
});
