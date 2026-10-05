import { describe, it, expect } from 'vitest';
import { sanitizeDocumentForPersistence, removeUndefined } from './sanitize';
import type { MindMapDocument } from '../types';

describe('sanitizeDocumentForPersistence', () => {
  it('removes undefined values recursively from objects and arrays', () => {
    const input = {
      a: 'hello',
      b: undefined,
      c: {
        nested: 'world',
        emptyVal: undefined,
        arr: [1, undefined, { deepUndefined: undefined, deepValid: 42 }]
      }
    };

    const cleaned = removeUndefined(input);
    expect(cleaned).toEqual({
      a: 'hello',
      c: {
        nested: 'world',
        arr: [1, { deepValid: 42 }]
      }
    });
    expect('b' in cleaned).toBe(false);
    expect('emptyVal' in (cleaned as any).c).toBe(false);
  });

  it('strips ephemeral properties from nodes (selected, dragging, resizing, measured)', () => {
    const rawDoc: MindMapDocument = {
      id: 'doc-1',
      title: 'Test Map',
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: 1000,
      updatedAt: 2000,
      nodes: [
        {
          id: 'n1',
          type: 'basic',
          position: { x: 10, y: 20 },
          selected: true,
          dragging: true,
          resizing: false,
          measured: { width: 120, height: 40 },
          data: {
            label: 'Node 1',
            url: undefined,
            note: undefined,
            tags: undefined
          }
        } as any
      ],
      edges: [
        {
          id: 'e1',
          source: 'n1',
          target: 'n2',
          selected: true,
          data: {
            edgeStyle: 'curved',
            customAttr: undefined
          }
        } as any
      ]
    };

    const sanitized = sanitizeDocumentForPersistence(rawDoc);

    const node = sanitized.nodes[0] as any;
    expect(node.selected).toBeUndefined();
    expect(node.dragging).toBeUndefined();
    expect(node.resizing).toBeUndefined();
    expect(node.measured).toBeUndefined();
    expect(node.id).toBe('n1');
    expect(node.data.label).toBe('Node 1');
    expect('url' in node.data).toBe(false);
    expect('note' in node.data).toBe(false);
    expect('tags' in node.data).toBe(false);

    const edge = sanitized.edges[0] as any;
    expect(edge.selected).toBeUndefined();
    expect(edge.id).toBe('e1');
    expect('customAttr' in edge.data).toBe(false);
  });

  it('handles optional top-level document fields with undefined or null', () => {
    const docWithUndefined: any = {
      id: 'doc-2',
      title: 'Doc With Undefined Fields',
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: 1000,
      updatedAt: 2000,
      templateId: undefined,
      shareId: undefined,
      shareEnabled: undefined,
      nodes: [],
      edges: []
    };

    const sanitized = sanitizeDocumentForPersistence(docWithUndefined);
    expect('templateId' in sanitized).toBe(false);
    expect('shareId' in sanitized).toBe(false);
    expect('shareEnabled' in sanitized).toBe(false);
  });
});
