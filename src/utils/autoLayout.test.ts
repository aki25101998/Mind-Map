import { describe, it, expect } from 'vitest';
import { useMindMapStore } from '../store/useMindMapStore';
import { templates } from '../templates/definitions';
import { cloneTemplate } from '../templates/templateUtils';
import { applyAutoLayout } from './layoutUtils';

describe('Auto Layout Engine Tests', () => {
  it('Scenario 1: Two-way Mind Map preserves left/right sides and vertical order', () => {
    const twoWayTemplate = templates.find(t => t.id === 'two-way')!;
    const { nodes, edges } = cloneTemplate(twoWayTemplate, true);

    // Initial state:
    // left-1 and left-2 are on the left
    // right-1 and right-2 are on the right
    const layouted = applyAutoLayout(nodes, edges, 'two-way');
    const root = layouted.find(n => n.id === 'root')!;
    const left1 = layouted.find(n => n.id === 'left-1')!;
    const left2 = layouted.find(n => n.id === 'left-2')!;
    const right1 = layouted.find(n => n.id === 'right-1')!;
    const right2 = layouted.find(n => n.id === 'right-2')!;

    // Left nodes must stay strictly to the left of root
    expect(left1.position.x).toBeLessThan(root.position.x);
    expect(left2.position.x).toBeLessThan(root.position.x);
    expect(left1.data?.layoutSide).toBe('left');
    expect(left2.data?.layoutSide).toBe('left');

    // Right nodes must stay strictly to the right of root
    expect(right1.position.x).toBeGreaterThan(root.position.x);
    expect(right2.position.x).toBeGreaterThan(root.position.x);
    expect(right1.data?.layoutSide).toBe('right');
    expect(right2.data?.layoutSide).toBe('right');

    // Vertical order must be preserved (left-1 was above left-2, right-1 was above right-2)
    expect(left1.position.y).toBeLessThan(left2.position.y);
    expect(right1.position.y).toBeLessThan(right2.position.y);
  });

  it('Scenario 2: Tree Chart preserves Top-to-Bottom vertical hierarchy', () => {
    const treeTemplate = templates.find(t => t.id === 'tree')!;
    const { nodes, edges } = cloneTemplate(treeTemplate, true);

    const layouted = applyAutoLayout(nodes, edges, 'tree');
    const root = layouted.find(n => n.id === 'root')!;
    const a = layouted.find(n => n.id === 'a')!;
    const b = layouted.find(n => n.id === 'b')!;
    const a1 = layouted.find(n => n.id === 'a1')!;
    const a2 = layouted.find(n => n.id === 'a2')!;
    const b1 = layouted.find(n => n.id === 'b1')!;

    // Children A and B must be strictly below Root (Y increases downwards)
    expect(a.position.y).toBeGreaterThan(root.position.y);
    expect(b.position.y).toBeGreaterThan(root.position.y);

    // Grandchildren must be strictly below A and B
    expect(a1.position.y).toBeGreaterThan(a.position.y);
    expect(a2.position.y).toBeGreaterThan(a.position.y);
    expect(b1.position.y).toBeGreaterThan(b.position.y);

    // A and B must be spaced horizontally side-by-side
    expect(a.position.x).toBeLessThan(b.position.x);
    // A1 and A2 must be spaced horizontally
    expect(a1.position.x).toBeLessThan(a2.position.x);
  });

  it('Scenario 3: Organization Chart preserves Top-to-Bottom vertical hierarchy', () => {
    const orgTemplate = templates.find(t => t.id === 'org')!;
    const { nodes, edges } = cloneTemplate(orgTemplate, true);

    const layouted = applyAutoLayout(nodes, edges, 'org');
    const root = layouted.find(n => n.id === 'root')!;
    const m1 = layouted.find(n => n.id === 'm1')!;
    const m2 = layouted.find(n => n.id === 'm2')!;

    // Managers below CEO
    expect(m1.position.y).toBeGreaterThan(root.position.y);
    expect(m2.position.y).toBeGreaterThan(root.position.y);
    expect(m1.position.x).toBeLessThan(m2.position.x);
  });

  it('Scenario 4: Brace Map lays out horizontally to the right', () => {
    const braceTemplate = templates.find(t => t.id === 'brace')!;
    const { nodes, edges } = cloneTemplate(braceTemplate, true);

    const layouted = applyAutoLayout(nodes, edges, 'brace');
    const root = layouted.find(n => n.id === 'root')!;
    const p1 = layouted.find(n => n.id === 'p1')!;
    const p2 = layouted.find(n => n.id === 'p2')!;
    const p11 = layouted.find(n => n.id === 'p1-1')!;

    // Parts must be to the right of root
    expect(p1.position.x).toBeGreaterThan(root.position.x);
    expect(p2.position.x).toBeGreaterThan(root.position.x);
    // Sub-parts must be to the right of parts
    expect(p11.position.x).toBeGreaterThan(p1.position.x);
    // Vertical order preserved
    expect(p1.position.y).toBeLessThan(p2.position.y);
  });

  it('Scenario 5: Blank canvas with created nodes auto layouts into balanced two-way map', () => {
    const blankTemplate = templates.find(t => t.id === 'blank')!;
    const { nodes: initNodes } = cloneTemplate(blankTemplate, true);

    useMindMapStore.setState({
      templateId: 'blank',
      nodes: initNodes,
      edges: [],
      selectedNodeIds: ['root'],
      history: [{ nodes: initNodes, edges: [] }],
      historyIndex: 0
    });

    const store = useMindMapStore.getState();
    // Create 2 children
    store.createChildNode('root');
    const state1 = useMindMapStore.getState();
    const child1Id = state1.selectedNodeIds[0];

    store.createChildNode('root');
    const state2 = useMindMapStore.getState();
    const child2Id = state2.selectedNodeIds[0];

    // Trigger auto layout
    state2.autoLayout();
    const finalState = useMindMapStore.getState();
    const c1 = finalState.nodes.find(n => n.id === child1Id)!;
    const c2 = finalState.nodes.find(n => n.id === child2Id)!;
    const root = finalState.nodes.find(n => n.id === 'root')!;

    // One child on left, one child on right
    const oneLeft = (c1.position.x < root.position.x && c2.position.x > root.position.x) ||
                    (c1.position.x > root.position.x && c2.position.x < root.position.x);
    expect(oneLeft).toBe(true);
  });

  it('Scenario 6: Locked nodes preserve their user positions during auto layout', () => {
    const twoWayTemplate = templates.find(t => t.id === 'two-way')!;
    const { nodes, edges } = cloneTemplate(twoWayTemplate, true);

    // Lock left-1 at a custom user position
    const lockedX = -999;
    const lockedY = 888;
    const modifiedNodes = nodes.map(n => 
      n.id === 'left-1' 
        ? { ...n, position: { x: lockedX, y: lockedY }, data: { ...n.data, locked: true } }
        : n
    );

    const layouted = applyAutoLayout(modifiedNodes, edges, 'two-way');
    const left1 = layouted.find(n => n.id === 'left-1')!;

    expect(left1.position.x).toBe(lockedX);
    expect(left1.position.y).toBe(lockedY);
  });
});
