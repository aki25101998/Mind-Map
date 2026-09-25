import { describe, it, expect } from 'vitest';
import { 
  isStructuralEdge, 
  wouldCreateCycle, 
  isValidConnection, 
  getDescendants, 
  computeHasChildrenMap, 
  computeSubtreeVisibility,
  findAncestors
} from './graphUtils';
import type { MindMapNode, MindMapEdge } from '../types';

describe('graphUtils', () => {
  const nodes: MindMapNode[] = [
    { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } },
    { id: 'nodeA', type: 'basic', position: { x: 200, y: -100 }, data: { label: 'Node A' } },
    { id: 'nodeB', type: 'basic', position: { x: 200, y: 100 }, data: { label: 'Node B' } },
    { id: 'nodeC', type: 'basic', position: { x: 400, y: 100 }, data: { label: 'Node C' } },
    { id: 'nodeD', type: 'basic', position: { x: 600, y: 100 }, data: { label: 'Node D' } },
  ];

  const structuralEdges: MindMapEdge[] = [
    { id: 'e-root-a', source: 'root', target: 'nodeA', type: 'mindmap-edge' },
    { id: 'e-root-b', source: 'root', target: 'nodeB', type: 'mindmap-edge' },
    { id: 'e-b-c', source: 'nodeB', target: 'nodeC', type: 'mindmap-edge' },
    { id: 'e-c-d', source: 'nodeC', target: 'nodeD', type: 'mindmap-edge' },
  ];

  const relationshipEdge: MindMapEdge = {
    id: 'e-rel-a-d',
    source: 'nodeA',
    target: 'nodeD',
    type: 'mindmap-edge',
    data: { relationship: true }
  };

  describe('isStructuralEdge', () => {
    it('identifies structural and relationship edges correctly', () => {
      expect(isStructuralEdge(structuralEdges[0])).toBe(true);
      expect(isStructuralEdge(relationshipEdge)).toBe(false);
      expect(isStructuralEdge({ id: 'e1', source: 'a', target: 'b', data: {} })).toBe(true);
    });
  });

  describe('wouldCreateCycle', () => {
    it('detects direct reverse cycle', () => {
      // Adding nodeA -> root when root -> nodeA exists
      expect(wouldCreateCycle('nodeA', 'root', structuralEdges)).toBe(true);
    });

    it('detects indirect cycle in structural chain', () => {
      // nodeB -> nodeC -> nodeD exists. Adding nodeD -> nodeB creates a cycle
      expect(wouldCreateCycle('nodeD', 'nodeB', structuralEdges)).toBe(true);
      // Adding nodeD -> root creates a cycle
      expect(wouldCreateCycle('nodeD', 'root', structuralEdges)).toBe(true);
    });

    it('returns false when no cycle would be created', () => {
      // Adding nodeA -> nodeD (new structural connection)
      expect(wouldCreateCycle('nodeA', 'nodeD', structuralEdges)).toBe(false);
      // Adding root -> nodeC
      expect(wouldCreateCycle('root', 'nodeC', structuralEdges)).toBe(false);
    });

    it('ignores relationship edges in cycle detection', () => {
      const allEdges = [...structuralEdges, relationshipEdge];
      // nodeA -> nodeD is relationship edge, so adding nodeD -> nodeA as structural is not a structural cycle
      expect(wouldCreateCycle('nodeD', 'nodeA', allEdges)).toBe(false);
    });
  });

  describe('isValidConnection', () => {
    it('rejects self-connection (A -> A)', () => {
      expect(isValidConnection({ source: 'nodeA', target: 'nodeA' }, nodes, structuralEdges)).toBe(false);
    });

    it('rejects duplicate edge', () => {
      expect(isValidConnection({ source: 'root', target: 'nodeA' }, nodes, structuralEdges)).toBe(false);
    });

    it('rejects reverse structural edge (B -> A when A -> B exists)', () => {
      expect(isValidConnection({ source: 'nodeA', target: 'root' }, nodes, structuralEdges)).toBe(false);
    });

    it('rejects cycle in structural mind map (nodeD -> root)', () => {
      expect(isValidConnection({ source: 'nodeD', target: 'root' }, nodes, structuralEdges)).toBe(false);
    });

    it('rejects missing source or target', () => {
      expect(isValidConnection({ source: 'missing', target: 'nodeA' }, nodes, structuralEdges)).toBe(false);
      expect(isValidConnection({ source: 'nodeA', target: 'missing' }, nodes, structuralEdges)).toBe(false);
      expect(isValidConnection({ source: null, target: 'nodeA' }, nodes, structuralEdges)).toBe(false);
    });

    it('allows valid new structural connection', () => {
      const newNode: MindMapNode = { id: 'newNode', type: 'basic', position: { x: 0, y: 0 }, data: { label: 'New' } };
      expect(isValidConnection({ source: 'nodeA', target: 'newNode' }, [...nodes, newNode], structuralEdges)).toBe(true);
    });
  });

  describe('getDescendants', () => {
    it('only traverses structural edges and ignores relationship edges', () => {
      const allEdges = [...structuralEdges, relationshipEdge];
      const { descendantNodes, descendantEdges } = getDescendants('nodeB', nodes, allEdges);
      const ids = descendantNodes.map(n => n.id);
      expect(ids).toContain('nodeC');
      expect(ids).toContain('nodeD');
      expect(ids).not.toContain('nodeA');
      expect(ids).not.toContain('root');
      expect(descendantEdges.some(e => e.id === 'e-rel-a-d')).toBe(false);
    });
  });

  describe('computeHasChildrenMap', () => {
    it('computes children map correctly only considering structural edges', () => {
      const allEdges = [...structuralEdges, relationshipEdge];
      const map = computeHasChildrenMap(allEdges);
      expect(map['root']).toBe(true);
      expect(map['nodeB']).toBe(true);
      expect(map['nodeC']).toBe(true);
      // nodeA only has relationship edge to nodeD, no structural children
      expect(map['nodeA']).toBeFalsy();
      expect(map['nodeD']).toBeFalsy();
    });
  });

  describe('computeSubtreeVisibility (Nested Collapse)', () => {
    it('handles nested collapse and expand correctly', () => {
      // Tree: root -> nodeB -> nodeC -> nodeD
      // Initially, collapse nodeC
      const nodesWithCCollapsed = nodes.map(n => 
        n.id === 'nodeC' ? { ...n, data: { ...n.data, collapsed: true } } : n
      );
      const res1 = computeSubtreeVisibility(nodesWithCCollapsed, structuralEdges);
      const nodeD1 = res1.nodes.find(n => n.id === 'nodeD');
      expect(nodeD1?.hidden).toBe(true);

      // Now collapse nodeB as well (parent of C)
      const nodesWithBandCCollapsed = nodesWithCCollapsed.map(n => 
        n.id === 'nodeB' ? { ...n, data: { ...n.data, collapsed: true } } : n
      );
      const res2 = computeSubtreeVisibility(nodesWithBandCCollapsed, structuralEdges);
      expect(res2.nodes.find(n => n.id === 'nodeC')?.hidden).toBe(true);
      expect(res2.nodes.find(n => n.id === 'nodeD')?.hidden).toBe(true);

      // Now expand nodeB (nodeC remains collapsed)
      const nodesWithBExpanded = nodesWithBandCCollapsed.map(n => 
        n.id === 'nodeB' ? { ...n, data: { ...n.data, collapsed: false } } : n
      );
      const res3 = computeSubtreeVisibility(nodesWithBExpanded, structuralEdges);
      // nodeC must be restored to visible
      expect(res3.nodes.find(n => n.id === 'nodeC')?.hidden).toBe(false);
      // nodeD must REMAIN hidden because nodeC is still collapsed!
      expect(res3.nodes.find(n => n.id === 'nodeD')?.hidden).toBe(true);
    });
  });

  describe('findAncestors', () => {
    it('returns ancestor chain up to root along structural edges', () => {
      const ancestors = findAncestors('nodeD', nodes, structuralEdges);
      const ancestorIds = ancestors.map(a => a.id);
      expect(ancestorIds).toEqual(['nodeC', 'nodeB', 'root']);
    });
  });
});
