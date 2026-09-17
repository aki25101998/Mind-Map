import type { Template, MindMapNode, MindMapEdge } from '../types';

export const templates: Template[] = [
  {
    id: 'two-way',
    name: 'Two-way Mind Map',
    category: 'Mind Map',
    description: 'A classic mind map extending horizontally from the center.',
    layoutType: 'two-way',
    defaultNodes: [
      { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Main Idea' } },
      { id: 'left-1', type: 'basic', position: { x: -200, y: -50 }, data: { label: 'Left Topic 1', backgroundColor: 'var(--node-color-purple)' } },
      { id: 'left-2', type: 'basic', position: { x: -200, y: 50 }, data: { label: 'Left Topic 2', backgroundColor: 'var(--node-color-red)' } },
      { id: 'right-1', type: 'basic', position: { x: 200, y: -50 }, data: { label: 'Right Topic 1', backgroundColor: 'var(--node-color-blue)' } },
      { id: 'right-2', type: 'basic', position: { x: 200, y: 50 }, data: { label: 'Right Topic 2', backgroundColor: 'var(--node-color-green)' } },
    ],
    defaultEdges: [
      { id: 'e-r-l1', source: 'root', target: 'left-1', type: 'default', animated: true },
      { id: 'e-r-l2', source: 'root', target: 'left-2', type: 'default', animated: true },
      { id: 'e-r-r1', source: 'root', target: 'right-1', type: 'default', animated: true },
      { id: 'e-r-r2', source: 'root', target: 'right-2', type: 'default', animated: true },
    ]
  },
  {
    id: 'tree',
    name: 'Tree Chart',
    category: 'Hierarchy',
    description: 'A top-down hierarchical tree.',
    layoutType: 'tree',
    defaultNodes: [
      { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } },
      { id: 'a', type: 'rounded', position: { x: -100, y: 100 }, data: { label: 'Branch A', backgroundColor: 'var(--node-color-blue)' } },
      { id: 'b', type: 'rounded', position: { x: 100, y: 100 }, data: { label: 'Branch B', backgroundColor: 'var(--node-color-green)' } },
    ],
    defaultEdges: [
      { id: 'e-r-a', source: 'root', target: 'a', type: 'smoothstep' },
      { id: 'e-r-b', source: 'root', target: 'b', type: 'smoothstep' },
    ]
  },
  {
    id: 'free',
    name: 'Free Layout',
    category: 'Mind Map',
    description: 'Start with a central node and add nodes freely.',
    layoutType: 'free',
    defaultNodes: [
      { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Central Concept' } },
    ],
    defaultEdges: []
  }
];
