import type { Template } from '../types';

export const templates: Template[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    category: 'Mind Map',
    description: 'Start from scratch with a single central node.',
    layoutType: 'free',
    defaultNodes: [
      { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Main Idea' } },
    ],
    defaultEdges: []
  },
  {
    id: 'two-way',
    name: 'Two-way Mind Map',
    category: 'Mind Map',
    description: 'A classic mind map extending horizontally from the center.',
    layoutType: 'two-way',
    stylePreset: {
      rootStyle: { backgroundColor: 'var(--node-color-orange)', color: '#fff' },
      branchStyles: [
        { backgroundColor: 'var(--node-color-purple)', color: '#fff' },
        { backgroundColor: 'var(--node-color-red)', color: '#fff' },
        { backgroundColor: 'var(--node-color-blue)', color: '#fff' },
        { backgroundColor: 'var(--node-color-green)', color: '#fff' }
      ],
      edgeStyle: { edgeStyle: 'curved' }
    },
    defaultNodes: [
      { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Main Idea', layoutSide: 'center' } },
      { id: 'left-1', type: 'basic', position: { x: -300, y: -80 }, data: { label: 'Left Topic 1', layoutSide: 'left' } },
      { id: 'left-2', type: 'basic', position: { x: -300, y: 80 }, data: { label: 'Left Topic 2', layoutSide: 'left' } },
      { id: 'right-1', type: 'basic', position: { x: 300, y: -80 }, data: { label: 'Right Topic 1', layoutSide: 'right' } },
      { id: 'right-2', type: 'basic', position: { x: 300, y: 80 }, data: { label: 'Right Topic 2', layoutSide: 'right' } },
    ],
    defaultEdges: [
      { id: 'e-r-l1', source: 'root', target: 'left-1', type: 'mindmap-edge' },
      { id: 'e-r-l2', source: 'root', target: 'left-2', type: 'mindmap-edge' },
      { id: 'e-r-r1', source: 'root', target: 'right-1', type: 'mindmap-edge' },
      { id: 'e-r-r2', source: 'root', target: 'right-2', type: 'mindmap-edge' },
    ]
  },
  {
    id: 'one-way',
    name: 'One-way Mind Map',
    category: 'Mind Map',
    description: 'A mind map extending in a single direction.',
    layoutType: 'one-way',
    stylePreset: {
      rootStyle: { backgroundColor: 'var(--node-color-blue)', color: '#fff' },
      branchStyles: [
        { backgroundColor: 'var(--node-color-cyan)' },
        { backgroundColor: 'var(--node-color-teal)' }
      ],
      edgeStyle: { edgeStyle: 'curved' }
    },
    defaultNodes: [
      { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Main' } },
      { id: 'b1', type: 'basic', position: { x: 300, y: -80 }, data: { label: 'Branch 1' } },
      { id: 'b1-1', type: 'basic', position: { x: 600, y: -120 }, data: { label: 'Topic 1', backgroundColor: 'var(--node-bg-default)' } },
      { id: 'b1-2', type: 'basic', position: { x: 600, y: -40 }, data: { label: 'Topic 2', backgroundColor: 'var(--node-bg-default)' } },
      { id: 'b2', type: 'basic', position: { x: 300, y: 80 }, data: { label: 'Branch 2' } },
      { id: 'b2-1', type: 'basic', position: { x: 600, y: 40 }, data: { label: 'Topic 3', backgroundColor: 'var(--node-bg-default)' } },
      { id: 'b2-2', type: 'basic', position: { x: 600, y: 120 }, data: { label: 'Topic 4', backgroundColor: 'var(--node-bg-default)' } },
    ],
    defaultEdges: [
      { id: 'e1', source: 'root', target: 'b1', type: 'mindmap-edge' },
      { id: 'e2', source: 'b1', target: 'b1-1', type: 'mindmap-edge' },
      { id: 'e3', source: 'b1', target: 'b1-2', type: 'mindmap-edge' },
      { id: 'e4', source: 'root', target: 'b2', type: 'mindmap-edge' },
      { id: 'e5', source: 'b2', target: 'b2-1', type: 'mindmap-edge' },
      { id: 'e6', source: 'b2', target: 'b2-2', type: 'mindmap-edge' },
    ]
  },
  {
    id: 'free',
    name: 'Free Layout',
    category: 'Mind Map',
    description: 'Central node with freely placed surrounding nodes.',
    layoutType: 'free',
    defaultNodes: [
      { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Central', backgroundColor: 'var(--node-color-red)', color: '#fff' } },
      { id: 'n1', type: 'rounded', position: { x: 200, y: -150 }, data: { label: 'Idea 1' } },
      { id: 'n2', type: 'rounded', position: { x: 250, y: 100 }, data: { label: 'Idea 2' } },
      { id: 'n3', type: 'rounded', position: { x: -200, y: 150 }, data: { label: 'Idea 3' } },
      { id: 'n4', type: 'rounded', position: { x: -250, y: -100 }, data: { label: 'Idea 4' } },
    ],
    defaultEdges: [
      { id: 'e1', source: 'root', target: 'n1', type: 'mindmap-edge', data: { edgeStyle: 'straight' } },
      { id: 'e2', source: 'root', target: 'n2', type: 'mindmap-edge', data: { edgeStyle: 'straight' } },
      { id: 'e3', source: 'root', target: 'n3', type: 'mindmap-edge', data: { edgeStyle: 'straight' } },
      { id: 'e4', source: 'root', target: 'n4', type: 'mindmap-edge', data: { edgeStyle: 'straight' } },
    ]
  },
  {
    id: 'brace',
    name: 'Brace Map',
    category: 'Hierarchy',
    description: 'Part-to-whole relationships.',
    layoutType: 'brace',
    stylePreset: {
      rootStyle: { backgroundColor: 'var(--node-color-teal)', color: '#fff' },
      edgeStyle: { edgeStyle: 'orthogonal' }
    },
    defaultNodes: [
      { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Whole' } },
      { id: 'p1', type: 'basic', position: { x: 200, y: -100 }, data: { label: 'Part 1' } },
      { id: 'p1-1', type: 'text', position: { x: 400, y: -140 }, data: { label: 'Sub 1' } },
      { id: 'p1-2', type: 'text', position: { x: 400, y: -60 }, data: { label: 'Sub 2' } },
      { id: 'p2', type: 'basic', position: { x: 200, y: 100 }, data: { label: 'Part 2' } },
      { id: 'p2-1', type: 'text', position: { x: 400, y: 60 }, data: { label: 'Sub 3' } },
      { id: 'p2-2', type: 'text', position: { x: 400, y: 140 }, data: { label: 'Sub 4' } },
    ],
    defaultEdges: [
      { id: 'e1', source: 'root', target: 'p1', type: 'mindmap-edge' },
      { id: 'e2', source: 'p1', target: 'p1-1', type: 'mindmap-edge' },
      { id: 'e3', source: 'p1', target: 'p1-2', type: 'mindmap-edge' },
      { id: 'e4', source: 'root', target: 'p2', type: 'mindmap-edge' },
      { id: 'e5', source: 'p2', target: 'p2-1', type: 'mindmap-edge' },
      { id: 'e6', source: 'p2', target: 'p2-2', type: 'mindmap-edge' },
    ]
  },
  {
    id: 'org',
    name: 'Organization Chart',
    category: 'Organization',
    description: 'Top-down structural chart.',
    layoutType: 'org',
    stylePreset: {
      rootStyle: { backgroundColor: 'var(--node-color-blue)', color: '#fff' },
      branchStyles: [
        { backgroundColor: 'var(--node-color-cyan)' }
      ],
      edgeStyle: { edgeStyle: 'orthogonal' }
    },
    defaultNodes: [
      { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'CEO' } },
      { id: 'm1', type: 'rounded', position: { x: -200, y: 120 }, data: { label: 'Manager A' } },
      { id: 'm2', type: 'rounded', position: { x: 200, y: 120 }, data: { label: 'Manager B' } },
      { id: 'e1', type: 'basic', position: { x: -300, y: 240 }, data: { label: 'Employee 1' } },
      { id: 'e2', type: 'basic', position: { x: -100, y: 240 }, data: { label: 'Employee 2' } },
      { id: 'e3', type: 'basic', position: { x: 100, y: 240 }, data: { label: 'Employee 3' } },
      { id: 'e4', type: 'basic', position: { x: 300, y: 240 }, data: { label: 'Employee 4' } },
    ],
    defaultEdges: [
      { id: 'ee1', source: 'root', target: 'm1', type: 'mindmap-edge' },
      { id: 'ee2', source: 'root', target: 'm2', type: 'mindmap-edge' },
      { id: 'ee3', source: 'm1', target: 'e1', type: 'mindmap-edge' },
      { id: 'ee4', source: 'm1', target: 'e2', type: 'mindmap-edge' },
      { id: 'ee5', source: 'm2', target: 'e3', type: 'mindmap-edge' },
      { id: 'ee6', source: 'm2', target: 'e4', type: 'mindmap-edge' },
    ]
  },
  {
    id: 'tree',
    name: 'Tree Chart',
    category: 'Hierarchy',
    description: 'A top-down hierarchical tree.',
    layoutType: 'tree',
    stylePreset: {
      rootStyle: { backgroundColor: 'var(--node-color-purple)', color: '#fff' },
      branchStyles: [
        { backgroundColor: 'var(--node-color-blue)', color: '#fff' },
        { backgroundColor: 'var(--node-color-green)', color: '#fff' }
      ],
      edgeStyle: { edgeStyle: 'curved' }
    },
    defaultNodes: [
      { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Root' } },
      { id: 'a', type: 'rounded', position: { x: -150, y: 120 }, data: { label: 'A' } },
      { id: 'b', type: 'rounded', position: { x: 150, y: 120 }, data: { label: 'B' } },
      { id: 'a1', type: 'basic', position: { x: -250, y: 240 }, data: { label: 'A1', backgroundColor: 'var(--node-bg-default)', color: 'var(--text-color)' } },
      { id: 'a2', type: 'basic', position: { x: -50, y: 240 }, data: { label: 'A2', backgroundColor: 'var(--node-bg-default)', color: 'var(--text-color)' } },
      { id: 'b1', type: 'basic', position: { x: 150, y: 240 }, data: { label: 'B1', backgroundColor: 'var(--node-bg-default)', color: 'var(--text-color)' } },
    ],
    defaultEdges: [
      { id: 'e-r-a', source: 'root', target: 'a', type: 'mindmap-edge' },
      { id: 'e-r-b', source: 'root', target: 'b', type: 'mindmap-edge' },
      { id: 'e-a-1', source: 'a', target: 'a1', type: 'mindmap-edge' },
      { id: 'e-a-2', source: 'a', target: 'a2', type: 'mindmap-edge' },
      { id: 'e-b-1', source: 'b', target: 'b1', type: 'mindmap-edge' },
    ]
  },
  {
    id: 'flow',
    name: 'Flow / Process',
    category: 'Process',
    description: 'A sequential process map.',
    layoutType: 'flow',
    stylePreset: {
      edgeStyle: { edgeStyle: 'straight', arrowEnd: true }
    },
    defaultNodes: [
      { id: 'start', type: 'rounded', position: { x: 0, y: 0 }, data: { label: 'Start', backgroundColor: 'var(--node-color-green)', color: '#fff' } },
      { id: 's1', type: 'basic', position: { x: 200, y: 0 }, data: { label: 'Step 1' } },
      { id: 's2', type: 'basic', position: { x: 400, y: 0 }, data: { label: 'Step 2' } },
      { id: 'd1', type: 'main', position: { x: 600, y: 0 }, data: { label: 'Decision', backgroundColor: 'var(--node-color-yellow)', color: '#000' } },
      { id: 'end', type: 'rounded', position: { x: 800, y: 0 }, data: { label: 'End', backgroundColor: 'var(--node-color-red)', color: '#fff' } },
    ],
    defaultEdges: [
      { id: 'e1', source: 'start', target: 's1', type: 'mindmap-edge' },
      { id: 'e2', source: 's1', target: 's2', type: 'mindmap-edge' },
      { id: 'e3', source: 's2', target: 'd1', type: 'mindmap-edge' },
      { id: 'e4', source: 'd1', target: 'end', type: 'mindmap-edge' },
    ]
  },
  {
    id: 'radial',
    name: 'Radial Brainstorm',
    category: 'Brainstorm',
    description: 'Central idea with surrounding related concepts.',
    layoutType: 'radial',
    stylePreset: {
      rootStyle: { backgroundColor: 'var(--node-color-orange)', color: '#fff' },
      edgeStyle: { edgeStyle: 'straight' }
    },
    defaultNodes: [
      { id: 'root', type: 'main', position: { x: 0, y: 0 }, data: { label: 'Main Idea' } },
      { id: 'n1', type: 'text', position: { x: 0, y: -200 }, data: { label: 'Idea 1' } },
      { id: 'n2', type: 'text', position: { x: 200, y: 0 }, data: { label: 'Idea 2' } },
      { id: 'n3', type: 'text', position: { x: 0, y: 200 }, data: { label: 'Idea 3' } },
      { id: 'n4', type: 'text', position: { x: -200, y: 0 }, data: { label: 'Idea 4' } },
      { id: 'n5', type: 'text', position: { x: -140, y: -140 }, data: { label: 'Idea 5' } },
      { id: 'n6', type: 'text', position: { x: 140, y: 140 }, data: { label: 'Idea 6' } },
    ],
    defaultEdges: [
      { id: 'e1', source: 'root', target: 'n1', type: 'mindmap-edge' },
      { id: 'e2', source: 'root', target: 'n2', type: 'mindmap-edge' },
      { id: 'e3', source: 'root', target: 'n3', type: 'mindmap-edge' },
      { id: 'e4', source: 'root', target: 'n4', type: 'mindmap-edge' },
      { id: 'e5', source: 'root', target: 'n5', type: 'mindmap-edge' },
      { id: 'e6', source: 'root', target: 'n6', type: 'mindmap-edge' },
    ]
  }
];
