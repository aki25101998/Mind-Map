import { describe, it, expect } from 'vitest';
import { validateDocument } from './validation';
import type { MindMapDocument } from '../types';

describe('validateDocument', () => {
  it('validates a correct document', () => {
    const doc: MindMapDocument = {
      id: 'doc-1',
      title: 'Test Doc',
      nodes: [
        {
          id: 'node-1',
          type: 'main',
          position: { x: 0, y: 0 },
          data: { label: 'Root' },
        }
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const validated = validateDocument(doc);
    expect(validated.id).toBe('doc-1');
    expect(validated.nodes).toHaveLength(1);
  });

  it('throws on missing document id', () => {
    expect(() => validateDocument({ title: 'Test' })).toThrow(/Document ID is missing/);
  });

  it('throws on duplicate node id', () => {
    const doc = {
      id: 'doc-1',
      title: 'Test Doc',
      nodes: [
        { id: 'node-1', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
        { id: 'node-1', type: 'basic', position: { x: 100, y: 100 }, data: { label: 'Node 2' } },
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };
    expect(() => validateDocument(doc)).toThrow(/Duplicate node ID found/);
  });

  it('throws on invalid node type', () => {
    const doc = {
      id: 'doc-1',
      title: 'Test Doc',
      nodes: [
        { id: 'node-1', type: 'invalid_type', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };
    expect(() => validateDocument(doc)).toThrow(/invalid type/);
  });

  it('allows ellipse node type', () => {
    const doc: MindMapDocument = {
      id: 'doc-1',
      title: 'Test Doc',
      nodes: [
        { id: 'node-1', type: 'ellipse', position: { x: 0, y: 0 }, data: { label: 'Ellipse' } },
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(() => validateDocument(doc)).not.toThrow();
  });
});
