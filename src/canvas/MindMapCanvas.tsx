import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import {
  ReactFlow, 
  Background,
  Controls,
  MiniMap, 
  useReactFlow, 
  SelectionMode,
  type Node,
  type NodeChange
} from '@xyflow/react';
import type { NodeTypes, EdgeTypes } from '@xyflow/react';
import { useMindMapStore } from '../store/useMindMapStore';
import { useShallow } from 'zustand/react/shallow';
import { MainNode } from './nodes/MainNode';
import { BasicNode } from './nodes/BasicNode';
import { RoundedNode } from './nodes/RoundedNode';
import { TextNode } from './nodes/TextNode';
import { ToolbarNode } from './nodes/ToolbarNode';
import { CustomMindMapEdge } from './edges/MindMapEdge';
import { ContextMenu } from '../editor/ContextMenu';
import { CommandPalette } from '../components/CommandPalette';
import { v4 as uuidv4 } from 'uuid';
import type { MindMapNode } from '../types';

const nodeTypes: NodeTypes = {
  main: MainNode,
  basic: BasicNode,
  rounded: RoundedNode,
  text: TextNode,
  toolbar: ToolbarNode,
};

const edgeTypes: EdgeTypes = {
  'mindmap-edge': CustomMindMapEdge,
};

const DEFAULT_EDGE_OPTIONS = { type: 'mindmap-edge' };
const SNAP_GRID: [number, number] = [15, 15];
const PRO_OPTIONS = { hideAttribution: true };

const CanvasInner = () => {
  const { 
    nodes, 
    edges, 
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
    commitHistory,
    setIsDragging,
    setEditingNodeId,
    editingNodeId,
    setContextMenu
  } = useMindMapStore(useShallow(state => ({
    nodes: state.nodes,
    edges: state.edges,
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect,
    setViewport: state.setViewport,
    setSelectedNodes: state.setSelectedNodes,
    selectedNodeIds: state.selectedNodeIds,
    createChildNode: state.createChildNode,
    createSiblingNode: state.createSiblingNode,
    deleteSelected: state.deleteSelected,
    duplicateSelected: state.duplicateSelected,
    copySelected: state.copySelected,
    pasteFromClipboard: state.pasteFromClipboard,
    undo: state.undo,
    redo: state.redo,
    addNode: state.addNode,
    commitHistory: state.commitHistory,
    setIsDragging: state.setIsDragging,
    setEditingNodeId: state.setEditingNodeId,
    editingNodeId: state.editingNodeId,
    setContextMenu: state.setContextMenu
  })));
  
  const dragInitialPositions = useRef<Record<string, { x: number, y: number }>>({});
  const isDraggingRef = useRef(false);
  
  const [toolbarState, setToolbarState] = useState<{ nodeId: string, position: { x: number, y: number } } | null>(null);

  const { setViewport: rfSetViewport, screenToFlowPosition, fitView } = useReactFlow();

  useEffect(() => {
    if (selectedNodeIds.length === 1 && !editingNodeId) {
      const selectedId = selectedNodeIds[0];
      if (toolbarState?.nodeId !== selectedId) {
        const node = (nodes || []).find(n => n.id === selectedId);
        if (node) {
          setToolbarState({ 
            nodeId: selectedId, 
            position: { x: node.position.x, y: node.position.y - 60 } 
          });
        }
      }
    } else {
      setToolbarState(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeIds, editingNodeId]);

  // Clean toolbar if target node was removed
  useEffect(() => {
    if (toolbarState && !(nodes || []).some(n => n.id === toolbarState.nodeId)) {
      setToolbarState(null);
    }
  }, [nodes, toolbarState]);

  const flowNodes = useMemo(() => {
    const fn: Node[] = [...(nodes || [])] as Node[];
    if (toolbarState) {
      fn.push({
        id: 'floating-toolbar',
        type: 'toolbar',
        position: toolbarState.position,
        data: { targetNodeId: toolbarState.nodeId },
        draggable: true,
        selectable: false,
        zIndex: 1000
      });
    }
    return fn;
  }, [nodes, toolbarState]);

  const handleNodesChange = useCallback((changes: NodeChange<Node>[]) => {
    const toolbarChanges = changes.filter(c => (c as any).id === 'floating-toolbar');
    const otherChanges = changes.filter(c => (c as any).id !== 'floating-toolbar');

    toolbarChanges.forEach(c => {
      if (c.type === 'position' && c.dragging === false) {
        if (c.positionAbsolute) {
          setToolbarState(prev => prev ? { ...prev, position: c.positionAbsolute! } : null);
        } else if (c.position) {
          setToolbarState(prev => prev ? { ...prev, position: c.position! } : null);
        }
      }
    });

    if (otherChanges.length > 0) {
      onNodesChange(otherChanges as NodeChange<MindMapNode>[]);
    }
  }, [onNodesChange]);

  const initialized = useRef(false);

  // Restore viewport or auto-fit on document load
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initialViewport = useMindMapStore.getState().viewport;
    
    if (initialViewport && (initialViewport.x !== 0 || initialViewport.y !== 0 || initialViewport.zoom !== 1)) {
      rfSetViewport(initialViewport);
    } else {
      setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 50);
    }
  }, [rfSetViewport, fitView]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          setEditingNodeId(null);
        }
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
      } else if (e.key === 'F2' || e.key === ' ') {
        if (selectedNodeIds.length === 1) {
          e.preventDefault();
          setEditingNodeId(selectedNodeIds[0]);
        }
      } else if (e.key === 'Escape') {
        setSelectedNodes([]);
        setEditingNodeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, nodes, createChildNode, createSiblingNode, deleteSelected, undo, redo, copySelected, pasteFromClipboard, duplicateSelected, setSelectedNodes, setEditingNodeId]);

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

  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent, node: { id: string }) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, target: 'node', id: node.id });
    },
    [setContextMenu]
  );

  const onPaneContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, target: 'canvas' });
    },
    [setContextMenu]
  );

  const onNodeDragStart = useCallback((_e: React.MouseEvent | MouseEvent | TouchEvent, _node: Node, draggedNodes: Node[]) => {
    setIsDragging(true);
    isDraggingRef.current = true;
    
    const initialPositions: Record<string, { x: number, y: number }> = {};
    draggedNodes.forEach(n => {
      initialPositions[n.id] = { ...n.position };
    });
    
    dragInitialPositions.current = initialPositions;
  }, [setIsDragging]);

  const onNodeDragStop = useCallback((_e: React.MouseEvent | MouseEvent | TouchEvent, _node: Node, draggedNodes: Node[]) => {
    setIsDragging(false);
    isDraggingRef.current = false;
    
    let moved = false;
    for (const n of draggedNodes) {
      if (n.id === 'floating-toolbar') continue;
      
      const initial = dragInitialPositions.current[n.id];
      if (initial && (initial.x !== n.position.x || initial.y !== n.position.y)) {
        moved = true;
        break;
      }
    }

    if (moved) {
      commitHistory();
    }
    
    dragInitialPositions.current = {};
  }, [commitHistory, setIsDragging]);

  const onMoveEnd = useCallback((_: any, vp: any) => {
    setViewport(vp);
  }, [setViewport]);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, [setContextMenu]);

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={edges}
      onNodesChange={handleNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDragStart={onNodeDragStart}
      onNodeDragStop={onNodeDragStop}
      onMoveEnd={onMoveEnd}
      onDoubleClick={handleDoubleClick}
      onNodeContextMenu={onNodeContextMenu}
      onPaneContextMenu={onPaneContextMenu}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      deleteKeyCode={null}
      defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
      minZoom={0.1}
      maxZoom={4}
      colorMode="dark"
      panOnDrag={true}
      panOnScroll={false}
      zoomOnScroll={true}
      zoomOnPinch={true}
      zoomOnDoubleClick={false}
      selectionMode={SelectionMode.Partial}
      selectionOnDrag
      snapToGrid={false}
      snapGrid={SNAP_GRID}
      proOptions={PRO_OPTIONS}
    >
      <Background gap={15} size={1} color="var(--node-border-default)" />
      <Controls showInteractive={false} position="bottom-right" />
      <MiniMap zoomable pannable nodeColor={(node) => {
        return node.data?.backgroundColor as string || 'var(--node-bg-default)';
      }} />
      <ContextMenu />
      <CommandPalette />
    </ReactFlow>
  );
};

export const MindMapCanvas = () => {
  const documentId = useMindMapStore(state => state.documentId);
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {documentId && <CanvasInner key={documentId} />}
    </div>
  );
};
