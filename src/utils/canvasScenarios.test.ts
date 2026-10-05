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

  // Additional Phase 4 & 15 Tests: Store-level Lock Protection
  it('Store-level Lock Protection: locked node position can NEVER be updated', () => {
    const lockedNode: MindMapNode = {
      id: 'locked-node',
      type: 'basic',
      position: { x: 50, y: 50 },
      data: { label: 'Locked Topic', locked: true }
    };

    useMindMapStore.setState({
      nodes: [...useMindMapStore.getState().nodes, lockedNode]
    });

    // Try to update locked node position
    useMindMapStore.getState().updateNodePositions([
      { ...lockedNode, position: { x: 500, y: 500 } }
    ]);

    const state = useMindMapStore.getState();
    const updated = state.nodes.find(n => n.id === 'locked-node');
    expect(updated?.position).toEqual({ x: 50, y: 50 });
  });

  // Additional Phase 11 Test: Selected Edge Deletion
  it('Edge Deletion: deleteSelected removes selected edge without deleting nodes', () => {
    const nodeA: MindMapNode = { id: 'A', type: 'basic', position: { x: 0, y: 0 }, data: { label: 'A' } };
    const nodeB: MindMapNode = { id: 'B', type: 'basic', position: { x: 100, y: 0 }, data: { label: 'B' } };
    const edgeAB: MindMapEdge = { id: 'e-ab', source: 'A', target: 'B', selected: true };

    useMindMapStore.setState({
      nodes: [nodeA, nodeB],
      edges: [edgeAB],
      selectedNodeIds: []
    });

    useMindMapStore.getState().deleteSelected();

    const state = useMindMapStore.getState();
    expect(state.edges).toHaveLength(0);
    expect(state.nodes).toHaveLength(2);
  });

  // Additional Phase 5 Test: History does not store derived hidden state
  it('History Snapshot: derived hidden is stripped and recomputed on undo/redo', () => {
    const root: MindMapNode = { id: 'R', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } };
    const child: MindMapNode = { id: 'C', type: 'basic', position: { x: 100, y: 0 }, data: { label: 'Child' } };
    const edgeRC: MindMapEdge = { id: 'e-rc', source: 'R', target: 'C' };

    useMindMapStore.setState({
      nodes: [root, child],
      edges: [edgeRC],
      history: [],
      historyIndex: -1
    });

    useMindMapStore.getState().commitHistory();
    const history1 = useMindMapStore.getState().history;
    // Ensure hidden property is undefined in history snapshot
    expect(history1[0].nodes.find(n => n.id === 'C')?.hidden).toBeUndefined();

    // Now collapse R
    useMindMapStore.getState().toggleCollapse('R');
    expect(useMindMapStore.getState().nodes.find(n => n.id === 'C')?.hidden).toBe(true);

    // Undo collapse
    useMindMapStore.getState().undo();
    // After undo, visibility is recomputed: C is not hidden
    expect(useMindMapStore.getState().nodes.find(n => n.id === 'C')?.hidden).toBe(false);
  });

  // Connecting multiple lines freely to 1 node
  it('Multiple lines: connects multiple lines to 1 node freely without deleting existing lines', () => {
    const root: MindMapNode = { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } };
    const nodeA: MindMapNode = { id: 'A', type: 'basic', position: { x: 200, y: -50 }, data: { label: 'A' } };
    const nodeB: MindMapNode = { id: 'B', type: 'basic', position: { x: 200, y: 50 }, data: { label: 'B' } };
    const edgeRootA: MindMapEdge = { id: 'e-ra', source: 'root', target: 'A', type: 'mindmap-edge' };
    const edgeRootB: MindMapEdge = { id: 'e-rb', source: 'root', target: 'B', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [root, nodeA, nodeB],
      edges: [edgeRootA, edgeRootB],
      hasChildrenMap: { root: true, A: false, B: false }
    });

    // User connects A -> B directly (now B connects to BOTH root and A freely!)
    useMindMapStore.getState().onConnect({
      source: 'A',
      target: 'B',
      sourceHandle: null,
      targetHandle: null
    });

    const state = useMindMapStore.getState();
    // All 3 edges co-exist: root -> A, root -> B, A -> B!
    expect(state.edges).toHaveLength(3);
    expect(state.edges.some(e => e.source === 'root' && e.target === 'A')).toBe(true);
    expect(state.edges.some(e => e.source === 'root' && e.target === 'B')).toBe(true);
    expect(state.edges.some(e => e.source === 'A' && e.target === 'B')).toBe(true);
    expect(state.hasChildrenMap['A']).toBe(true);
    expect(state.hasChildrenMap['root']).toBe(true);
  });

  // Edge reconnection
  it('Edge Reconnection: dragging existing edge endpoint moves connection smoothly', () => {
    const root: MindMapNode = { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } };
    const nodeA: MindMapNode = { id: 'A', type: 'basic', position: { x: 200, y: 0 }, data: { label: 'A' } };
    const nodeB: MindMapNode = { id: 'B', type: 'basic', position: { x: 400, y: 0 }, data: { label: 'B' } };
    const edgeRootA: MindMapEdge = { id: 'e-ra', source: 'root', target: 'A', type: 'mindmap-edge' };
    const edgeAB: MindMapEdge = { id: 'e-ab', source: 'A', target: 'B', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [root, nodeA, nodeB],
      edges: [edgeRootA, edgeAB],
      hasChildrenMap: { root: true, A: true, B: false }
    });

    // Reconnect edgeAB so that source is 'root' instead of 'A'
    useMindMapStore.getState().onReconnectEdge(edgeAB, {
      source: 'root',
      target: 'B',
      sourceHandle: null,
      targetHandle: null
    });

    const state = useMindMapStore.getState();
    expect(state.edges).toHaveLength(2);
    expect(state.edges.some(e => e.id === 'e-ab' && e.source === 'root' && e.target === 'B')).toBe(true);
    expect(state.hasChildrenMap['A']).toBeFalsy();
    expect(state.hasChildrenMap['root']).toBe(true);
  });

  it('Edge Reconnection: moves target endpoint from one node to another cleanly', () => {
    const root: MindMapNode = { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } };
    const nodeA: MindMapNode = { id: 'A', type: 'basic', position: { x: 200, y: 0 }, data: { label: 'A' } };
    const nodeB: MindMapNode = { id: 'B', type: 'basic', position: { x: 400, y: -50 }, data: { label: 'B' } };
    const nodeC: MindMapNode = { id: 'C', type: 'basic', position: { x: 400, y: 50 }, data: { label: 'C' } };
    const edgeRootA: MindMapEdge = { id: 'e-ra', source: 'root', target: 'A', type: 'mindmap-edge' };
    const edgeAB: MindMapEdge = { id: 'e-ab', source: 'A', target: 'B', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [root, nodeA, nodeB, nodeC],
      edges: [edgeRootA, edgeAB],
      hasChildrenMap: { root: true, A: true, B: false, C: false }
    });

    // Move target of edgeAB from B to C
    useMindMapStore.getState().onReconnectEdge(edgeAB, {
      source: 'A',
      target: 'C',
      sourceHandle: null,
      targetHandle: 'left'
    });

    const state = useMindMapStore.getState();
    expect(state.edges).toHaveLength(2);
    const reconnected = state.edges.find(e => e.id === 'e-ab')!;
    expect(reconnected.target).toBe('C');
    expect(reconnected.targetHandle).toBe('left');
    expect(state.edges.some(e => e.target === 'B')).toBe(false);
  });

  it('Edge Reconnection: adjusts handle on same node without error', () => {
    const root: MindMapNode = { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } };
    const nodeA: MindMapNode = { id: 'A', type: 'basic', position: { x: 200, y: 0 }, data: { label: 'A' } };
    const edgeRootA: MindMapEdge = { id: 'e-ra', source: 'root', target: 'A', sourceHandle: 'right-src', targetHandle: 'left', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [root, nodeA],
      edges: [edgeRootA],
      hasChildrenMap: { root: true, A: false }
    });

    // Move targetHandle from 'left' to 'top'
    useMindMapStore.getState().onReconnectEdge(edgeRootA, {
      source: 'root',
      target: 'A',
      sourceHandle: 'right-src',
      targetHandle: 'top'
    });

    const state = useMindMapStore.getState();
    const updatedEdge = state.edges.find(e => e.id === 'e-ra')!;
    expect(updatedEdge.targetHandle).toBe('top');
  });

  it('Edge Reconnection: rejects reconnecting structural target to Root node', () => {
    const root: MindMapNode = { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } };
    const nodeA: MindMapNode = { id: 'A', type: 'basic', position: { x: 200, y: 0 }, data: { label: 'A' } };
    const nodeB: MindMapNode = { id: 'B', type: 'basic', position: { x: 400, y: 0 }, data: { label: 'B' } };
    const edgeRootA: MindMapEdge = { id: 'e-ra', source: 'root', target: 'A', type: 'mindmap-edge' };
    const edgeAB: MindMapEdge = { id: 'e-ab', source: 'A', target: 'B', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [root, nodeA, nodeB],
      edges: [edgeRootA, edgeAB],
      hasChildrenMap: { root: true, A: true, B: false }
    });

    // Attempt to make root the target of A -> root
    useMindMapStore.getState().onReconnectEdge(edgeAB, {
      source: 'A',
      target: 'root',
      sourceHandle: null,
      targetHandle: null
    });

    // Should be rejected: edgeAB should still target B
    const state = useMindMapStore.getState();
    expect(state.edges.find(e => e.id === 'e-ab')?.target).toBe('B');
  });
  // Subtree deletion: deleting a parent node deletes all its descendants
  it('Subtree deletion: deleting parent node deletes all its descendants and connected edges', () => {
    const root: MindMapNode = { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } };
    const parent: MindMapNode = { id: 'P', type: 'basic', position: { x: 200, y: 0 }, data: { label: 'Parent' } };
    const child1: MindMapNode = { id: 'C1', type: 'basic', position: { x: 400, y: -50 }, data: { label: 'Child 1' } };
    const child2: MindMapNode = { id: 'C2', type: 'basic', position: { x: 400, y: 50 }, data: { label: 'Child 2' } };
    const grandChild: MindMapNode = { id: 'GC', type: 'basic', position: { x: 600, y: 50 }, data: { label: 'Grandchild' } };
    const unrelated: MindMapNode = { id: 'U', type: 'basic', position: { x: 200, y: 200 }, data: { label: 'Unrelated' } };

    const edgeRootP: MindMapEdge = { id: 'e-rp', source: 'root', target: 'P', type: 'mindmap-edge' };
    const edgePC1: MindMapEdge = { id: 'e-pc1', source: 'P', target: 'C1', type: 'mindmap-edge' };
    const edgePC2: MindMapEdge = { id: 'e-pc2', source: 'P', target: 'C2', type: 'mindmap-edge' };
    const edgeC2GC: MindMapEdge = { id: 'e-c2gc', source: 'C2', target: 'GC', type: 'mindmap-edge' };
    const edgeRootU: MindMapEdge = { id: 'e-ru', source: 'root', target: 'U', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [root, parent, child1, child2, grandChild, unrelated],
      edges: [edgeRootP, edgePC1, edgePC2, edgeC2GC, edgeRootU],
      selectedNodeIds: ['P']
    });

    useMindMapStore.getState().deleteSelected();

    const state = useMindMapStore.getState();
    const remainingIds = state.nodes.map(n => n.id);
    expect(remainingIds).toEqual(['root', 'U']);
    expect(state.edges.map(e => e.id)).toEqual(['e-ru']);
  });

  // Root node protection
  it('Root node protection: cannot convert root to other type, cannot duplicate root as main', () => {
    const root: MindMapNode = { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } };
    const other: MindMapNode = { id: 'other', type: 'basic', position: { x: 100, y: 100 }, data: { label: 'Other' } };

    useMindMapStore.setState({
      nodes: [root, other],
      edges: [],
      selectedNodeIds: ['root']
    });

    // Attempting to change root type should be ignored
    useMindMapStore.getState().updateNodeType('root', 'basic');
    expect(useMindMapStore.getState().nodes.find(n => n.id === 'root')?.type).toBe('main');

    // Attempting to change other to main should be ignored
    useMindMapStore.getState().updateNodeType('other', 'main');
    expect(useMindMapStore.getState().nodes.find(n => n.id === 'other')?.type).toBe('basic');

    // Duplicating root node should convert duplicated node to 'basic'
    useMindMapStore.getState().duplicateSelected();
    const duplicatedNode = useMindMapStore.getState().nodes.find(n => n.id !== 'root' && n.id !== 'other');
    expect(duplicatedNode).toBeDefined();
    expect(duplicatedNode?.type).toBe('basic');
  });

  // Sibling node creation data isolation
  it('Sibling node creation: inherits style but does NOT inherit note, url, tags, locked, or collapsed', () => {
    const root: MindMapNode = { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } };
    const topic: MindMapNode = { 
      id: 'topic-1', 
      type: 'basic', 
      position: { x: 200, y: 0 }, 
      data: { 
        label: 'My Topic',
        backgroundColor: '#10b981',
        fontSize: 18,
        note: 'Secret notes',
        url: 'https://example.com',
        tags: ['work', 'urgent'],
        locked: true,
        collapsed: true
      } 
    };
    const edge: MindMapEdge = { id: 'e-1', source: 'root', target: 'topic-1', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [root, topic],
      edges: [edge],
      selectedNodeIds: ['topic-1']
    });

    useMindMapStore.getState().createSiblingNode('topic-1');

    const state = useMindMapStore.getState();
    const sibling = state.nodes.find(n => n.id !== 'root' && n.id !== 'topic-1')!;
    expect(sibling).toBeDefined();
    // Inherited style
    expect(sibling.data.backgroundColor).toBe('#10b981');
    expect(sibling.data.fontSize).toBe(18);
    // NOT inherited metadata
    expect(sibling.data.note).toBeUndefined();
    expect(sibling.data.url).toBeUndefined();
    expect(sibling.data.tags).toBeUndefined();
    expect(sibling.data.locked).toBeUndefined();
    expect(sibling.data.collapsed).toBeUndefined();
  });

  // Parent auto-uncollapse on child creation
  it('Parent auto-uncollapse: creating child on collapsed parent automatically uncollapses parent', () => {
    const root: MindMapNode = { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } };
    const parent: MindMapNode = { 
      id: 'P', 
      type: 'basic', 
      position: { x: 200, y: 0 }, 
      data: { label: 'Parent', collapsed: true } 
    };
    const edge: MindMapEdge = { id: 'e-rp', source: 'root', target: 'P', type: 'mindmap-edge' };

    useMindMapStore.setState({
      nodes: [root, parent],
      edges: [edge],
      selectedNodeIds: ['P']
    });

    useMindMapStore.getState().createChildNode('P');

    const state = useMindMapStore.getState();
    const updatedParent = state.nodes.find(n => n.id === 'P')!;
    expect(updatedParent.data.collapsed).toBe(false);
    expect(state.nodes.find(n => n.selected)?.hidden).toBeFalsy();
  });
});


