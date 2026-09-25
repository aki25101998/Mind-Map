import { describe, it, expect, beforeEach } from 'vitest';
import { useMindMapStore } from '../../store/useMindMapStore';
import type { MindMapNode } from '../../types';

describe('Node Editing Geometry Safety', () => {
  beforeEach(() => {
    const nodes: MindMapNode[] = [
      {
        id: 'main-1',
        type: 'main',
        position: { x: 100, y: 150 },
        data: { label: 'Main Idea' },
        measured: { width: 160, height: 50 }
      },
      {
        id: 'basic-1',
        type: 'basic',
        position: { x: 350, y: 150 },
        data: { label: 'Basic Topic' },
        measured: { width: 120, height: 40 }
      },
      {
        id: 'ellipse-1',
        type: 'ellipse',
        position: { x: 350, y: 250 },
        data: { label: 'Ellipse Topic' },
        measured: { width: 140, height: 70 }
      },
      {
        id: 'rounded-1',
        type: 'rounded',
        position: { x: 350, y: 350 },
        data: { label: 'Rounded Topic' },
        measured: { width: 130, height: 40 }
      },
      {
        id: 'text-1',
        type: 'text',
        position: { x: 350, y: 450 },
        data: { label: 'Text Topic' },
        measured: { width: 100, height: 30 }
      }
    ];

    useMindMapStore.setState({
      nodes,
      edges: [],
      hasChildrenMap: {},
      selectedNodeIds: ['main-1'],
      clipboardNodes: [],
      clipboardEdges: [],
      pasteCount: 0,
      history: [{ nodes, edges: [] }],
      historyIndex: 0,
      viewport: { x: 0, y: 0, zoom: 1 },
      isReadOnly: false,
      editingNodeId: null,
      contextMenu: null,
    });
  });

  it('entering edit mode updates editingNodeId without moving node position', () => {
    const store = useMindMapStore.getState();
    const nodeBefore = store.nodes.find(n => n.id === 'main-1')!;
    const posXBefore = nodeBefore.position.x;
    const posYBefore = nodeBefore.position.y;

    store.setEditingNodeId('main-1');

    const state = useMindMapStore.getState();
    expect(state.editingNodeId).toBe('main-1');
    const nodeAfter = state.nodes.find(n => n.id === 'main-1')!;
    expect(nodeAfter.position.x).toBe(posXBefore);
    expect(nodeAfter.position.y).toBe(posYBefore);
  });

  it('saving new text via updateNodeData preserves width and height and does not alter position', () => {
    const store = useMindMapStore.getState();
    const longText = 'This is a very long mind map topic containing many words that should wrap inside the node rather than making the node wider';

    store.updateNodeData('main-1', {
      label: longText,
      width: 160,
      height: 50
    });

    const state = useMindMapStore.getState();
    const updatedNode = state.nodes.find(n => n.id === 'main-1')!;
    expect(updatedNode.data.label).toBe(longText);
    expect(updatedNode.data.width).toBe(160);
    expect(updatedNode.data.height).toBe(50);
    expect(updatedNode.position.x).toBe(100);
    expect(updatedNode.position.y).toBe(150);
  });

  it('all node types retain their geometry and position upon updating label', () => {
    const store = useMindMapStore.getState();
    const nodeTypes = ['main-1', 'basic-1', 'ellipse-1', 'rounded-1', 'text-1'];

    nodeTypes.forEach(id => {
      const node = store.nodes.find(n => n.id === id)!;
      const initialPos = { ...node.position };
      const measured = node.measured!;

      store.updateNodeData(id, {
        label: `Updated text for ${id} AAAAAAAAAAAAAAAAAAAAAAAAA`,
        width: measured.width,
        height: measured.height
      });

      const updated = useMindMapStore.getState().nodes.find(n => n.id === id)!;
      expect(updated.position.x).toBe(initialPos.x);
      expect(updated.position.y).toBe(initialPos.y);
      expect(updated.data.width).toBe(measured.width);
      expect(updated.data.height).toBe(measured.height);
    });
  });

  it('EllipseNode maintains 2/1 aspect ratio expectation and geometry stability', () => {
    const store = useMindMapStore.getState();
    const ellipse = store.nodes.find(n => n.id === 'ellipse-1')!;
    expect(ellipse.measured!.width! / ellipse.measured!.height!).toBe(2);

    store.updateNodeData('ellipse-1', {
      label: 'New Ellipse Content',
      width: 140,
      height: 70
    });

    const updated = useMindMapStore.getState().nodes.find(n => n.id === 'ellipse-1')!;
    expect(updated.data.width).toBe(140);
    expect(updated.data.height).toBe(70);
    expect((updated.data.width as number) / (updated.data.height as number)).toBe(2);
  });
});
