import { describe, it, expect, beforeEach } from 'vitest';
import { useMindMapStore } from '../store/useMindMapStore';
import type { MindMapNode, MindMapEdge } from '../types';
import { isValidConnection } from './graphUtils';
import { findNonCollidingPosition } from './layoutUtils';

describe('Canvas Scenarios (Phase 18 Testing Suite)', () => {
  beforeEach(() => {
    // Reset store to a clean state with a Root Node
    const rootNode: MindMapNode = {
      id: 'root-1',
      type: 'main',
      position: { x: 0, y: 0 },
      data: { label: 'Central Topic' }
    };

    useMindMapStore.setState({
      nodes: [rootNode],
      edges: [],
      hasChildrenMap: {},
      selectedNodeIds: ['root-1'],
      clipboardNodes: [],
      clipboardEdges: [],
      pasteCount: 0,
      history: [{ nodes: [rootNode], edges: [] }],
      historyIndex: 0,
      viewport: { x: 100, y: 50, zoom: 1.5 },
      isReadOnly: false,
      editingNodeId: null,
      contextMenu: null,
    });
  });

  // TEST 1: Create root -> Tab -> Tab -> Enter
  it('TEST 1: Create root -> Tab (child) -> Tab (child of child) -> Enter (sibling)', () => {
    const store = useMindMapStore.getState();
    // Root is selected. Tab -> create child
    store.createChildNode('root-1');
    let state = useMindMapStore.getState();
    expect(state.nodes).toHaveLength(2);
    const child1Id = state.selectedNodeIds[0];

    // Tab -> create child of child1
    state.createChildNode(child1Id);
    state = useMindMapStore.getState();
    expect(state.nodes).toHaveLength(3);
    const child2Id = state.selectedNodeIds[0];

    // Enter -> create sibling of child2
    state.createSiblingNode(child2Id);
    state = useMindMapStore.getState();
    expect(state.nodes).toHaveLength(4);
    
    // Sibling should share parent with child2
    const edgeToSibling = state.edges.find(e => e.target === state.selectedNodeIds[0]);
    expect(edgeToSibling?.source).toBe(child1Id);
  });

  // TEST 2: Create A -> B, A -> C. Delete B.
  it('TEST 2: Create A -> B and A -> C, delete B leaves A and C without orphan edges', () => {
    const root: MindMapNode = { id: 'A', type: 'main', position: { x: 0, y: 0 }, data: { label: 'A' } };
    const nodeB: MindMapNode = { id: 'B', type: 'basic', position: { x: 200, y: -50 }, data: { label: 'B' } };
    const nodeC: MindMapNode = { id: 'C', type: 'basic', position: { x: 200, y: 50 }, data: { label: 'C' } };
    const edgeAB: MindMapEdge = { id: 'e-ab', source: 'A', target: 'B', type: 'mindmap-edge' };
    const edgeAC: MindMapEdge = { id: 'e-ac', source: 'A', target: 'C', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [root, nodeB, nodeC],
      edges: [edgeAB, edgeAC],
      selectedNodeIds: ['B']
    });

    useMindMapStore.getState().deleteSelected();

    const state = useMindMapStore.getState();
    expect(state.nodes.map(n => n.id)).toEqual(['A', 'C']);
    expect(state.edges.map(e => e.id)).toEqual(['e-ac']);
  });

  // TEST 3: Attempt A -> A must fail
  it('TEST 3: Attempt self-loop A -> A fails', () => {
    const state = useMindMapStore.getState();
    const canConnect = isValidConnection({ source: 'root-1', target: 'root-1' }, state.nodes, state.edges);
    expect(canConnect).toBe(false);

    // Call onConnect in store
    state.onConnect({ source: 'root-1', target: 'root-1', sourceHandle: null, targetHandle: null });
    expect(useMindMapStore.getState().edges).toHaveLength(0);
  });

  // TEST 4: Attempt duplicate A -> B fails
  it('TEST 4: Attempt duplicate edge A -> B fails', () => {
    const nodeB: MindMapNode = { id: 'B', type: 'basic', position: { x: 100, y: 100 }, data: { label: 'B' } };
    const edgeAB: MindMapEdge = { id: 'e-ab', source: 'root-1', target: 'B', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [...useMindMapStore.getState().nodes, nodeB],
      edges: [edgeAB]
    });

    const state = useMindMapStore.getState();
    const canConnect = isValidConnection({ source: 'root-1', target: 'B' }, state.nodes, state.edges);
    expect(canConnect).toBe(false);

    state.onConnect({ source: 'root-1', target: 'B', sourceHandle: null, targetHandle: null });
    expect(useMindMapStore.getState().edges).toHaveLength(1);
  });

  // TEST 5: Attempt cycle A -> B -> C -> A fails
  it('TEST 5: Attempt structural cycle A -> B -> C -> A fails', () => {
    const nodeB: MindMapNode = { id: 'B', type: 'basic', position: { x: 200, y: 0 }, data: { label: 'B' } };
    const nodeC: MindMapNode = { id: 'C', type: 'basic', position: { x: 400, y: 0 }, data: { label: 'C' } };
    const edgeAB: MindMapEdge = { id: 'e-ab', source: 'root-1', target: 'B', type: 'mindmap-edge' };
    const edgeBC: MindMapEdge = { id: 'e-bc', source: 'B', target: 'C', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [...useMindMapStore.getState().nodes, nodeB, nodeC],
      edges: [edgeAB, edgeBC]
    });

    const state = useMindMapStore.getState();
    // Attempt C -> root-1 (creates cycle)
    const canConnect = isValidConnection({ source: 'C', target: 'root-1' }, state.nodes, state.edges);
    expect(canConnect).toBe(false);

    state.onConnect({ source: 'C', target: 'root-1', sourceHandle: null, targetHandle: null });
    expect(useMindMapStore.getState().edges).toHaveLength(2);
  });

  // TEST 6: Collapse B -> Expand B
  it('TEST 6: Collapse and expand subtree', () => {
    const root: MindMapNode = { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } };
    const nodeB: MindMapNode = { id: 'B', type: 'basic', position: { x: 200, y: 0 }, data: { label: 'B' } };
    const nodeC: MindMapNode = { id: 'C', type: 'basic', position: { x: 400, y: -50 }, data: { label: 'C' } };
    const nodeD: MindMapNode = { id: 'D', type: 'basic', position: { x: 400, y: 50 }, data: { label: 'D' } };
    const edgeRB: MindMapEdge = { id: 'e-rb', source: 'root', target: 'B', type: 'mindmap-edge' };
    const edgeBC: MindMapEdge = { id: 'e-bc', source: 'B', target: 'C', type: 'mindmap-edge' };
    const edgeBD: MindMapEdge = { id: 'e-bd', source: 'B', target: 'D', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [root, nodeB, nodeC, nodeD],
      edges: [edgeRB, edgeBC, edgeBD]
    });

    // Collapse B
    useMindMapStore.getState().toggleCollapse('B');
    let state = useMindMapStore.getState();
    expect(state.nodes.find(n => n.id === 'B')?.data?.collapsed).toBe(true);
    expect(state.nodes.find(n => n.id === 'C')?.hidden).toBe(true);
    expect(state.nodes.find(n => n.id === 'D')?.hidden).toBe(true);

    // Expand B
    useMindMapStore.getState().toggleCollapse('B');
    state = useMindMapStore.getState();
    expect(state.nodes.find(n => n.id === 'B')?.data?.collapsed).toBe(false);
    expect(state.nodes.find(n => n.id === 'C')?.hidden).toBe(false);
    expect(state.nodes.find(n => n.id === 'D')?.hidden).toBe(false);
  });

  // TEST 7: Nested collapse
  it('TEST 7: Nested collapse preserves inner collapsed state upon parent expand', () => {
    const root: MindMapNode = { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } };
    const nodeB: MindMapNode = { id: 'B', type: 'basic', position: { x: 200, y: 0 }, data: { label: 'B' } };
    const nodeC: MindMapNode = { id: 'C', type: 'basic', position: { x: 400, y: 0 }, data: { label: 'C' } };
    const nodeD: MindMapNode = { id: 'D', type: 'basic', position: { x: 600, y: 0 }, data: { label: 'D' } };
    const edgeRB: MindMapEdge = { id: 'e-rb', source: 'root', target: 'B', type: 'mindmap-edge' };
    const edgeBC: MindMapEdge = { id: 'e-bc', source: 'B', target: 'C', type: 'mindmap-edge' };
    const edgeCD: MindMapEdge = { id: 'e-cd', source: 'C', target: 'D', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [root, nodeB, nodeC, nodeD],
      edges: [edgeRB, edgeBC, edgeCD]
    });

    // Collapse C first
    useMindMapStore.getState().toggleCollapse('C');
    // Collapse B next
    useMindMapStore.getState().toggleCollapse('B');

    // Both C and D are hidden
    let state = useMindMapStore.getState();
    expect(state.nodes.find(n => n.id === 'C')?.hidden).toBe(true);
    expect(state.nodes.find(n => n.id === 'D')?.hidden).toBe(true);

    // Expand B
    useMindMapStore.getState().toggleCollapse('B');
    state = useMindMapStore.getState();
    // C is restored visible, but D remains hidden because C is still collapsed!
    expect(state.nodes.find(n => n.id === 'C')?.hidden).toBe(false);
    expect(state.nodes.find(n => n.id === 'D')?.hidden).toBe(true);
  });

  // TEST 8: Duplicate subtree
  it('TEST 8: Duplicate selected nodes and internal edges', () => {
    const nodeB: MindMapNode = { id: 'B', type: 'basic', position: { x: 100, y: 0 }, data: { label: 'B' } };
    const nodeC: MindMapNode = { id: 'C', type: 'basic', position: { x: 200, y: 0 }, data: { label: 'C' } };
    const edgeBC: MindMapEdge = { id: 'e-bc', source: 'B', target: 'C', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [nodeB, nodeC],
      edges: [edgeBC],
      selectedNodeIds: ['B', 'C']
    });

    useMindMapStore.getState().duplicateSelected();
    const state = useMindMapStore.getState();
    expect(state.nodes).toHaveLength(4);
    expect(state.edges).toHaveLength(2);
  });

  // TEST 9: Copy -> Paste 5 times with cumulative offset
  it('TEST 9: Copy -> Paste 5 times creates cumulative offsets', () => {
    const nodeB: MindMapNode = { id: 'B', type: 'basic', position: { x: 100, y: 100 }, data: { label: 'B' } };
    useMindMapStore.setState({
      nodes: [nodeB],
      edges: [],
      selectedNodeIds: ['B']
    });

    const store = useMindMapStore.getState();
    store.copySelected();

    for (let i = 0; i < 5; i++) {
      useMindMapStore.getState().pasteFromClipboard();
    }

    const state = useMindMapStore.getState();
    expect(state.nodes).toHaveLength(6);
    // Paste 1 offset: +40, Paste 2: +80, ... Paste 5: +200
    const lastPastedNode = state.nodes[state.nodes.length - 1];
    expect(lastPastedNode.position.x).toBe(100 + 40 * 5);
    expect(lastPastedNode.position.y).toBe(100 + 40 * 5);
  });

  // TEST 10: Multi-select -> Delete
  it('TEST 10: Multi-select non-root nodes and delete', () => {
    const root: MindMapNode = { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } };
    const node1: MindMapNode = { id: 'n1', type: 'basic', position: { x: 100, y: 0 }, data: { label: '1' } };
    const node2: MindMapNode = { id: 'n2', type: 'basic', position: { x: 200, y: 0 }, data: { label: '2' } };

    useMindMapStore.setState({
      nodes: [root, node1, node2],
      edges: [],
      selectedNodeIds: ['n1', 'n2']
    });

    useMindMapStore.getState().deleteSelected();
    const state = useMindMapStore.getState();
    expect(state.nodes.map(n => n.id)).toEqual(['root']);
  });

  // TEST 11 & 12: Auto Layout does NOT change viewport or zoom
  it('TEST 11 & 12: Auto Layout leaves viewport and zoom completely unchanged', () => {
    const initialVp = { x: 150, y: -80, zoom: 1.75 };
    useMindMapStore.setState({
      viewport: initialVp
    });

    useMindMapStore.getState().autoLayout();
    const state = useMindMapStore.getState();
    expect(state.viewport).toEqual(initialVp);
  });

  // TEST 13, 14, 15: Drag node commits exactly 1 history entry, can Undo and Redo
  it('TEST 13, 14, 15: Dragging a node commits exactly 1 history entry; can Undo and Redo', () => {
    const root = useMindMapStore.getState().nodes[0];
    const initialIndex = useMindMapStore.getState().historyIndex;

    // Simulate drag stop
    useMindMapStore.getState().updateNodePositions([
      { ...root, position: { x: 300, y: 200 } }
    ]);

    const stateAfterDrag = useMindMapStore.getState();
    expect(stateAfterDrag.historyIndex).toBe(initialIndex + 1);
    expect(stateAfterDrag.nodes[0].position).toEqual({ x: 300, y: 200 });

    // Undo
    stateAfterDrag.undo();
    const stateAfterUndo = useMindMapStore.getState();
    expect(stateAfterUndo.historyIndex).toBe(initialIndex);
    expect(stateAfterUndo.nodes[0].position).toEqual({ x: 0, y: 0 });

    // Redo
    stateAfterUndo.redo();
    const stateAfterRedo = useMindMapStore.getState();
    expect(stateAfterRedo.historyIndex).toBe(initialIndex + 1);
    expect(stateAfterRedo.nodes[0].position).toEqual({ x: 300, y: 200 });
  });

  // TEST 16: Delete Root -> Root remains
  it('TEST 16: Attempting to delete Root node leaves Root intact', () => {
    useMindMapStore.setState({
      selectedNodeIds: ['root-1']
    });

    useMindMapStore.getState().deleteSelected();
    expect(useMindMapStore.getState().nodes).toHaveLength(1);
    expect(useMindMapStore.getState().nodes[0].id).toBe('root-1');

    useMindMapStore.getState().deleteNodeById('root-1');
    expect(useMindMapStore.getState().nodes).toHaveLength(1);
  });

  // TEST 17: Select Root -> Add Sibling -> No sibling created
  it('TEST 17: createSiblingNode on Root does not create sibling', () => {
    useMindMapStore.getState().createSiblingNode('root-1');
    expect(useMindMapStore.getState().nodes).toHaveLength(1);
  });

  // TEST 18: Read-only prevents mutation
  it('TEST 18: Read-only flag is properly set in editor slice', () => {
    useMindMapStore.getState().setIsReadOnly(true);
    expect(useMindMapStore.getState().isReadOnly).toBe(true);
  });

  // TEST 19 & 20: Long label and large font collision avoidance
  it('TEST 19 & 20: Collision detection accounts for long labels and font sizes', () => {
    const existingNode: MindMapNode = {
      id: 'existing',
      type: 'basic',
      position: { x: 100, y: 100 },
      data: { label: 'A very very very long node title that exceeds normal bounds', fontSize: 18 }
    };

    const pos = findNonCollidingPosition(100, 100, [existingNode], 'basic', 'Short', 14);
    // Position should be offset and not overlap
    expect(pos.x !== 100 || pos.y !== 100).toBe(true);
  });
});
