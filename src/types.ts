import type { Node, Edge, Viewport } from '@xyflow/react';

export type MindMapNodeType = 'main' | 'basic' | 'rounded' | 'ellipse' | 'text';

export interface NodeData extends Record<string, unknown> {
  label: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textColor?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: string | number;
  shape?: 'rectangle' | 'rounded' | 'ellipse' | 'text';
  collapsed?: boolean;
  tags?: string[];
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
  opacity?: number;
  dashed?: boolean;
  relationship?: boolean;
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
  shareEnabled?: boolean;
  shareId?: string;
}

export interface ShareConfig {
  id: string; // shareId
  mindMapId: string;
  ownerId: string;
  enabled: boolean;
  permission: 'view';
  createdAt: number;
  updatedAt: number;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  createdAt?: number;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
}

export type CloudMindMap = MindMapDocument;

export type LocalMindMapDocument = MindMapDocument & { uid?: string };

export interface PersistenceResult {
  success: boolean;
  error?: Error;
}
