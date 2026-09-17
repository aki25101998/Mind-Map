import React, { useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useReactFlow, 
  SelectionMode
} from '@xyflow/react';
import type { NodeTypes, EdgeTypes } from '@xyflow/react';
import { useMindMapStore } from '../store/useMindMapStore';
import { MainNode } from './nodes/MainNode';
import { BasicNode } from './nodes/BasicNode';
import { RoundedNode } from './nodes/RoundedNode';
import { TextNode } from './nodes/TextNode';
import { CustomMindMapEdge } from './edges/MindMapEdge';
import { v4 as uuidv4 } from 'uuid';

const nodeTypes: NodeTypes = {
  main: MainNode,
  basic: BasicNode,
  rounded: RoundedNode,
  text: TextNode,
};

const edgeTypes: EdgeTypes = {
  'mindmap-edge': CustomMindMapEdge,
};

const CanvasInner = () => {
  const { 
    nodes, 
    edges, 
    viewport,
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    setViewport,
    setSelectedNodes,
    selectedNodeIds,
    createChildNode,
    createSiblingNode,
    deleteSelected,
    duplicateSelected,
    copySelected,
    pasteFromClipboard,
    undo,
    redo,
    addNode,
    commitHistory
  } = useMindMapStore();
  
  const { setViewport: rfSetViewport, screenToFlowPosition } = useReactFlow();

  // Restore viewport on mount
  useEffect(() => {
    if (viewport) {
      rfSetViewport(viewport);
    }
  }, [viewport, rfSetViewport]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        if (selectedNodeIds.length === 1) createChildNode(selectedNodeIds[0]);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedNodeIds.length === 1) createSiblingNode(selectedNodeIds[0]);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        copySelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        pasteFromClipboard();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedNodes(nodes.map(n => n.id));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, nodes, createChildNode, createSiblingNode, deleteSelected, undo, redo, copySelected, pasteFromClipboard, duplicateSelected, setSelectedNodes]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('react-flow__pane')) {
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode({
        id: uuidv4(),
        type: 'basic',
        position,
        data: { label: 'New Node' },
      });
    }
  }, [screenToFlowPosition, addNode]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDragStop={() => commitHistory()}
      onMove={(_, vp) => setViewport(vp)}
      onDoubleClick={handleDoubleClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={{ type: 'mindmap-edge' }}
      minZoom={0.1}
      maxZoom={4}
      colorMode="dark"
      panOnScroll
      selectionMode={SelectionMode.Partial}
      selectionOnDrag
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} size={1} color="var(--node-border-default)" />
      <Controls showInteractive={false} position="bottom-right" />
      <MiniMap zoomable pannable nodeColor={(node) => {
        return node.data?.backgroundColor as string || 'var(--node-bg-default)';
      }} />
    </ReactFlow>
  );
};

export const MindMapCanvas = () => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <CanvasInner />
    </div>
  );
};
