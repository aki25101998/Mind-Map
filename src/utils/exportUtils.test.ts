import { describe, it, expect } from 'vitest';
import { generateMarkdownOutline } from './exportUtils';
import type { MindMapDocument } from '../types';

describe('exportUtils - generateMarkdownOutline', () => {
  it('handles empty document', () => {
    const doc: MindMapDocument = {
      id: 'doc-1',
      title: 'Empty Map',
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: 1000,
      updatedAt: 1000
    };

    const md = generateMarkdownOutline(doc);
    expect(md).toContain('# Empty Map');
    expect(md).toContain('*(Empty mind map)*');
  });

  it('generates hierarchy with branches, notes, tags, and URLs', () => {
    const doc: MindMapDocument = {
      id: 'doc-2',
      title: 'Project Roadmap',
      nodes: [
        { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Project Launch' } },
        { 
          id: 'branch-1', 
          type: 'basic', 
          position: { x: 200, y: -50 }, 
          data: { label: 'Frontend', tags: ['ui', 'react'], url: 'https://react.dev' } 
        },
        { 
          id: 'sub-1', 
          type: 'basic', 
          position: { x: 400, y: -50 }, 
          data: { label: 'Canvas Editor', note: 'Ensure autosave works\nAlso check offline fallback' } 
        },
        { 
          id: 'branch-2', 
          type: 'basic', 
          position: { x: 200, y: 50 }, 
          data: { label: 'Backend' } 
        }
      ],
      edges: [
        { id: 'e1', source: 'root', target: 'branch-1', type: 'mindmap-edge' },
        { id: 'e2', source: 'branch-1', target: 'sub-1', type: 'mindmap-edge' },
        { id: 'e3', source: 'root', target: 'branch-2', type: 'mindmap-edge' },
        // Relationship edge should be ignored in hierarchy outline
        { id: 'e-rel', source: 'sub-1', target: 'branch-2', type: 'mindmap-edge', data: { relationship: true } }
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: 1000,
      updatedAt: 1000
    };

    const md = generateMarkdownOutline(doc);
    
    // Check root header
    expect(md).toContain('# Project Launch');

    // Check level 1 headers
    expect(md).toContain('## [Frontend](https://react.dev) #ui #react');
    expect(md).toContain('## Backend');

    // Check level 2 nested list item
    expect(md).toContain('- Canvas Editor');

    // Check note blockquote
    expect(md).toContain('> Ensure autosave works');
    expect(md).toContain('> Also check offline fallback');
  });

  it('handles disconnected floating nodes gracefully', () => {
    const doc: MindMapDocument = {
      id: 'doc-3',
      title: 'Brainstorm Map',
      nodes: [
        { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Main Focus' } },
        { id: 'child-1', type: 'basic', position: { x: 100, y: 0 }, data: { label: 'Child Focus' } },
        { id: 'floating-1', type: 'basic', position: { x: 500, y: 500 }, data: { label: 'Random Thought' } }
      ],
      edges: [
        { id: 'e1', source: 'root', target: 'child-1', type: 'mindmap-edge' }
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: 1000,
      updatedAt: 1000
    };

    const md = generateMarkdownOutline(doc);
    expect(md).toContain('# Main Focus');
    expect(md).toContain('## Child Focus');
    expect(md).toContain('## Additional Topics');
    expect(md).toContain('Random Thought');
  });
});
