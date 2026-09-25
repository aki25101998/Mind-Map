import type { StateCreator } from 'zustand';
import type { MindMapState, EditorSlice, SyncStatus, ContextMenuState } from './types';
import { v4 as uuidv4 } from 'uuid';
import { computeHasChildrenMap } from '../../utils/graphUtils';

export const createEditorSlice: StateCreator<MindMapState, [], [], EditorSlice> = (set, get) => {
  // Read saved theme from localStorage on initialization
  const savedTheme = (typeof window !== 'undefined' && localStorage.getItem('mindmap-theme')) as 'light' | 'dark' | null;
  const initialTheme = savedTheme || 'light';
  
  // Apply dark class immediately on load so there's no flash
  if (initialTheme === 'dark' && typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }

  return {
  selectedNodeIds: [],
  clipboardNodes: [],
  clipboardEdges: [],
  pasteCount: 0,
  isSaving: false, // Legacy compatibility
  saveError: null, // Legacy compatibility
  syncStatus: 'idle',
  isDragging: false,
  editingNodeId: null,
  contextMenu: null,
  isReadOnly: false,
  theme: initialTheme,

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      // Side-effect: update document class
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // Persist to localStorage
      localStorage.setItem('mindmap-theme', newTheme);
      return { theme: newTheme };
    });
  },

  setIsSaving: (saving: boolean) => {
    set({ isSaving: saving, syncStatus: saving ? 'saving' : 'saved' });
  },
  
  setSaveError: (error: string | null) => {
    set({ saveError: error, syncStatus: error ? 'error' : 'saved' });
  },

  setSyncStatus: (status: SyncStatus) => {
    set({ syncStatus: status, isSaving: status === 'saving', saveError: status === 'error' ? 'Sync failed' : null });
  },

  setIsDragging: (isDragging: boolean) => {
    set({ isDragging });
  },

  setEditingNodeId: (id: string | null) => {
    set({ editingNodeId: id });
  },

  setContextMenu: (menu: ContextMenuState | null) => {
    set({ contextMenu: menu });
  },

  setIsReadOnly: (readOnly: boolean) => {
    set({ isReadOnly: readOnly });
  },

  setSelectedNodes: (ids: string[]) => {
    set({
      selectedNodeIds: ids,
      nodes: get().nodes.map(n => ({ ...n, selected: ids.includes(n.id) }))
    });
  },

  duplicateSelected: () => {
    const { nodes, edges, selectedNodeIds } = get();
    if (selectedNodeIds.length === 0) return;

    const idMap: Record<string, string> = {};
    const newIds: string[] = [];

    const newNodes = nodes.filter(n => selectedNodeIds.includes(n.id)).map(n => {
      const newId = uuidv4();
      idMap[n.id] = newId;
      newIds.push(newId);
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + 50, y: n.position.y + 50 },
        selected: true
      };
    });

    const selectedEdges = edges.filter(e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target));
    const newEdges = selectedEdges.map(e => ({
      ...e,
      id: uuidv4(),
      source: idMap[e.source],
      target: idMap[e.target]
    }));

    const allEdges = [...edges, ...newEdges];
    set({ 
      nodes: [...nodes.map(n => ({...n, selected: false})), ...newNodes],
      edges: allEdges,
      hasChildrenMap: computeHasChildrenMap(allEdges),
      selectedNodeIds: newIds
    });
    get().commitHistory();
  },

  copySelected: () => {
    const { nodes, edges, selectedNodeIds } = get();
    if (selectedNodeIds.length === 0) return;

    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const selectedEdges = edges.filter(e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target));

    set({ 
      clipboardNodes: JSON.parse(JSON.stringify(selectedNodes)), 
      clipboardEdges: JSON.parse(JSON.stringify(selectedEdges)),
      pasteCount: 0 
    });
  },

  pasteFromClipboard: () => {
    const { nodes, edges, clipboardNodes, clipboardEdges, pasteCount } = get();
    if (clipboardNodes.length === 0) return;

    const nextCount = pasteCount + 1;
    const offset = 40 * nextCount;

    const idMap: Record<string, string> = {};
    const newIds: string[] = [];

    const newNodes = clipboardNodes.map(n => {
      const newId = uuidv4();
      idMap[n.id] = newId;
      newIds.push(newId);
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + offset, y: n.position.y + offset },
        selected: true
      };
    });

    const newEdges = clipboardEdges.map(e => ({
      ...e,
      id: uuidv4(),
      source: idMap[e.source],
      target: idMap[e.target]
    }));

    const allEdges = [...edges, ...newEdges];
    set({
      nodes: [...nodes.map(n => ({...n, selected: false})), ...newNodes],
      edges: allEdges,
      hasChildrenMap: computeHasChildrenMap(allEdges),
      selectedNodeIds: newIds,
      pasteCount: nextCount
    });
    get().commitHistory();
  }
};
};
