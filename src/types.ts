import type { Node, Edge } from '@xyflow/react';

export type NodeType = 'main' | 'basic' | 'rounded' | 'text';

export interface NodeData {
  label: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: string | number;
  icon?: string;
  emoji?: string;
  note?: string;
  url?: string;
}

export type MindMapNode = Node<NodeData, NodeType>;

export interface MindMapEdge extends Edge {
  type?: 'smooth' | 'straight' | 'orthogonal';
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  layoutType: 'two-way' | 'one-way' | 'tree' | 'free' | 'brace' | 'org' | 'radial';
  defaultNodes: MindMapNode[];
  defaultEdges: MindMapEdge[];
}

export interface MindMapDocument {
  id: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  viewport: { x: number; y: number; zoom: number };
  templateId?: string;
  createdAt: number;
  updatedAt: number;
}
