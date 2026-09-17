import type { Node, Edge, Viewport } from '@xyflow/react';

export type MindMapNodeType = 'main' | 'basic' | 'rounded' | 'text';

export interface NodeData extends Record<string, unknown> {
  label: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string | number;
  icon?: string;
  emoji?: string;
  note?: string;
  url?: string;
  layoutSide?: 'left' | 'right' | 'center';
}

export type MindMapNode = Node<NodeData, MindMapNodeType>;

export type MindMapEdgeStyle = 'curved' | 'straight' | 'orthogonal';

export interface EdgeData extends Record<string, unknown> {
  edgeStyle?: MindMapEdgeStyle;
  arrowStart?: boolean;
  arrowEnd?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
}

export type MindMapEdge = Edge<EdgeData> & {
  type?: 'mindmap-edge';
};

export type TemplateCategory = 'Mind Map' | 'Hierarchy' | 'Organization' | 'Process' | 'Brainstorm';

export interface StylePreset {
  rootStyle?: Partial<NodeData>;
  branchStyles?: Partial<NodeData>[];
  edgeStyle?: Partial<EdgeData>;
}

export type LayoutType = 'two-way' | 'one-way' | 'free' | 'brace' | 'org' | 'tree' | 'flow' | 'radial';

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  layoutType: LayoutType;
  stylePreset?: StylePreset;
  defaultNodes: MindMapNode[];
  defaultEdges: MindMapEdge[];
}

export interface MindMapDocument {
  id: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  viewport: Viewport;
  templateId?: string;
  createdAt: number;
  updatedAt: number;
}
