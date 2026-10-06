import { describe, it, expect, beforeEach } from 'vitest';
import { useMindMapStore } from '../store/useMindMapStore';
import { getNodesBounds, type Node } from '@xyflow/react';
import { 
  calculateVisibleNodesCenter, 
  calculateViewportForCenter, 
  normalizeNodesForBounds 
} from './viewUtils';
import type { MindMapNode } from '../types';

describe('Reset View (viewUtils & scenarios)', () => {
  beforeEach(() => {
    useMindMapStore.setState({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      history: [],
      historyIndex: 0,
      viewport: { x: 500, y: -300, zoom: 2.5 },
      isReadOnly: false,
    });
  });

  // Scenario 1: Single node at (1000, 500)
  it('Scenario 1: Single node at (1000, 500) is placed at exact viewport center with zoom = 1', () => {
    const singleNode: Node = {
      id: 'node-1',
      position: { x: 1000, y: 500 },
      measured: { width: 160, height: 40 },
      data: { label: 'Single Node' },
    };

    const center = calculateVisibleNodesCenter([singleNode]);
    expect(center).not.toBeNull();
    // bounds: x: 1000, y: 500, w: 160, h: 40 -> center: x: 1000 + 80 = 1080, y: 500 + 20 = 520
    expect(center).toEqual({ x: 1080, y: 520 });

    const container = { width: 1200, height: 800 };
    const vp = calculateViewportForCenter(center!, container, 1);
    expect(vp.zoom).toBe(1);
    expect(vp.x).toBe(1200 / 2 - 1080); // -480
    expect(vp.y).toBe(800 / 2 - 520);  // -120

    // Verify screen coordinates: (flowPos * zoom) + vp
    const screenX = center!.x * vp.zoom + vp.x;
    const screenY = center!.y * vp.zoom + vp.y;
    expect(screenX).toBe(container.width / 2);
    expect(screenY).toBe(container.height / 2);
  });

  // Scenario 2: Multiple nodes with highly skewed coordinates
  it('Scenario 2: Multiple nodes with skewed coordinates have bounding box center placed at viewport center with zoom = 1', () => {
    const nodeA: Node = {
      id: 'node-a',
      position: { x: -2500, y: -1400 },
      measured: { width: 200, height: 80 },
      data: { label: 'Far Left' },
    };
    const nodeB: Node = {
      id: 'node-b',
      position: { x: 3800, y: 4100 },
      measured: { width: 250, height: 100 },
      data: { label: 'Far Right' },
    };

    const center = calculateVisibleNodesCenter([nodeA, nodeB]);
    expect(center).not.toBeNull();

    // Bounds:
    // minX = -2500, maxX = 3800 + 250 = 4050 -> width = 6550 -> centerX = -2500 + 3275 = 775
    // minY = -1400, maxY = 4100 + 100 = 4200 -> height = 5600 -> centerY = -1400 + 2800 = 1400
    expect(center).toEqual({ x: 775, y: 1400 });

    const container = { width: 1920, height: 1080 };
    const vp = calculateViewportForCenter(center!, container, 1);
    expect(vp.zoom).toBe(1);
    expect(vp.x).toBe(1920 / 2 - 775); // 185
    expect(vp.y).toBe(1080 / 2 - 1400); // -860

    // Screen coordinates of bounding box center must be dead center
    expect(center!.x * vp.zoom + vp.x).toBe(container.width / 2);
    expect(center!.y * vp.zoom + vp.y).toBe(container.height / 2);
  });

  // Scenario 3: Hidden nodes do NOT affect the center
  it('Scenario 3: Hidden node very far away does NOT influence bounding box center', () => {
    const visible1: Node = {
      id: 'vis-1',
      position: { x: 100, y: 100 },
      measured: { width: 150, height: 50 },
      data: { label: 'Visible 1' },
      hidden: false,
    };
    const visible2: Node = {
      id: 'vis-2',
      position: { x: 400, y: 300 },
      measured: { width: 150, height: 50 },
      data: { label: 'Visible 2' },
      hidden: false,
    };
    const hiddenNode: Node = {
      id: 'hidden-far',
      position: { x: 99999, y: 99999 },
      measured: { width: 500, height: 500 },
      data: { label: 'Hidden Ancestor/Child' },
      hidden: true,
    };

    const centerWithHidden = calculateVisibleNodesCenter([visible1, visible2, hiddenNode]);
    const centerWithoutHidden = calculateVisibleNodesCenter([visible1, visible2]);

    expect(centerWithHidden).not.toBeNull();
    expect(centerWithHidden).toEqual(centerWithoutHidden);

    // Bounds: minX = 100, maxX = 550 (width 450) -> centerX = 100 + 225 = 325
    //         minY = 100, maxY = 350 (height 250) -> centerY = 100 + 125 = 225
    expect(centerWithHidden).toEqual({ x: 325, y: 225 });
  });

  // Scenario 4: Existing viewport panned/zoomed does not corrupt reset calculation or mutate nodes
  it('Scenario 4: Existing viewport (pan & zoom) is reset without altering nodes, edges, or history', () => {
    const rootNode: MindMapNode = {
      id: 'root',
      type: 'main',
      position: { x: 200, y: 100 },
      measured: { width: 180, height: 60 },
      data: { label: 'Root' },
    };

    useMindMapStore.setState({
      nodes: [rootNode],
      edges: [],
      history: [{ nodes: [rootNode], edges: [] }],
      historyIndex: 0,
      viewport: { x: -5000, y: 3500, zoom: 3.2 },
    });

    const currentStore = useMindMapStore.getState();
    const visibleNodes = currentStore.nodes.filter(n => !n.hidden);
    const bounds = getNodesBounds(visibleNodes);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    expect(centerX).toBe(200 + 90);
    expect(centerY).toBe(100 + 30);

    const container = { width: 1400, height: 900 };
    const newVp = calculateViewportForCenter({ x: centerX, y: centerY }, container, 1);

    // Simulate React Flow updating the viewport in Zustand upon move end
    currentStore.setViewport(newVp);

    const afterReset = useMindMapStore.getState();
    // Viewport is updated to 100% zoom and centered
    expect(afterReset.viewport.zoom).toBe(1);
    expect(afterReset.viewport.x).toBe(1400 / 2 - 290);
    expect(afterReset.viewport.y).toBe(900 / 2 - 130);

    // Node position is completely untouched!
    expect(afterReset.nodes[0].position).toEqual({ x: 200, y: 100 });
    // History is not mutated
    expect(afterReset.historyIndex).toBe(0);
    expect(afterReset.history).toHaveLength(1);
  });

  // Scenario 5: Empty or all-hidden nodes gracefully returns null
  it('Scenario 5: Empty or all-hidden nodes returns null without crashing', () => {
    expect(calculateVisibleNodesCenter([])).toBeNull();

    const allHidden: Node[] = [
      { id: 'h1', position: { x: 10, y: 10 }, hidden: true, data: {} },
      { id: 'h2', position: { x: 50, y: 50 }, hidden: true, data: {} },
    ];
    expect(calculateVisibleNodesCenter(allHidden)).toBeNull();
  });

  // Scenario 6: Responsive viewports on various device sizes
  it('Scenario 6: Adapts accurately to different container dimensions (laptop, desktop, widescreen)', () => {
    const target = { x: 450, y: 250 };

    const sizes = [
      { name: 'Laptop', width: 1366, height: 768 },
      { name: 'Full HD', width: 1920, height: 1080 },
      { name: 'Ultrawide', width: 3440, height: 1440 },
      { name: 'Tablet/Window', width: 800, height: 600 },
    ];

    for (const size of sizes) {
      const vp = calculateViewportForCenter(target, size, 1);
      expect(vp.zoom).toBe(1);
      // Center position projected to screen
      const screenX = target.x * vp.zoom + vp.x;
      const screenY = target.y * vp.zoom + vp.y;
      expect(screenX).toBe(size.width / 2);
      expect(screenY).toBe(size.height / 2);
    }
  });

  // Scenario 7: Regression check - Auto Layout leaves viewport completely unchanged
  it('Scenario 7: Auto Layout leaves viewport and zoom completely unchanged', () => {
    const rootNode: MindMapNode = {
      id: 'root',
      type: 'main',
      position: { x: 0, y: 0 },
      data: { label: 'Root' },
    };
    const childNode: MindMapNode = {
      id: 'child',
      type: 'basic',
      position: { x: 500, y: 500 },
      data: { label: 'Child' },
    };

    const initialViewport = { x: -123, y: 456, zoom: 1.85 };
    useMindMapStore.setState({
      nodes: [rootNode, childNode],
      edges: [{ id: 'e1', source: 'root', target: 'child' }],
      viewport: initialViewport,
    });

    useMindMapStore.getState().autoLayout();
    const afterAutoLayout = useMindMapStore.getState();

    // Auto Layout must NEVER modify viewport
    expect(afterAutoLayout.viewport).toEqual(initialViewport);
  });

  // Scenario 8: normalizeNodesForBounds populates width/height from node.data when unmeasured
  it('Scenario 8: normalizeNodesForBounds correctly falls back to node.data dimensions', () => {
    const unmeasuredNode: Node = {
      id: 'custom-dim',
      position: { x: 50, y: 50 },
      data: { width: 220, height: 90 },
    };

    const normalized = normalizeNodesForBounds([unmeasuredNode]);
    expect(normalized[0].width).toBe(220);
    expect(normalized[0].height).toBe(90);

    const center = calculateVisibleNodesCenter([unmeasuredNode]);
    expect(center).toEqual({ x: 50 + 110, y: 50 + 45 });
  });
});
