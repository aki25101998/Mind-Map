import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow, 
  Background,
  Controls,
  MiniMap, 
  useReactFlow, 
  SelectionMode,
  ConnectionMode,
  useNodesState,
  useNodesInitialized,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type HandleType
} from '@xyflow/react';
import type { NodeTypes, EdgeTypes } from '@xyflow/react';
import { useMindMapStore } from '../store/useMindMapStore';
import { useShallow } from 'zustand/react/shallow';
import { MainNode } from './nodes/MainNode';
import { BasicNode } from './nodes/BasicNode';
import { RoundedNode } from './nodes/RoundedNode';
import { EllipseNode } from './nodes/EllipseNode';
import { TextNode } from './nodes/TextNode';
import { FloatingToolbar } from './FloatingToolbar';
import { EdgeFloatingToolbar } from './edges/EdgeFloatingToolbar';
import { CustomMindMapEdge } from './edges/MindMapEdge';
import { ContextMenu } from '../editor/ContextMenu';
import { CommandPalette } from '../components/CommandPalette';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { MindMapNode, MindMapEdge } from '../types';
import { isValidConnection } from '../utils/graphUtils';
import { useIsMobile } from '../hooks/useIsMobile';

const nodeTypes: NodeTypes = {
  main: MainNode,
  basic: BasicNode,
  rounded: RoundedNode,
  ellipse: EllipseNode,
  text: TextNode,
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
    onReconnectEdge,
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
    setIsDragging,
    setEditingNodeId,
    editingNodeId,
    setContextMenu,
    updateNodePositions,
    theme,
    isReadOnly
  } = useMindMapStore(useShallow(state => ({
    nodes: state.nodes,
    edges: state.edges,
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect,
    onReconnectEdge: state.onReconnectEdge,
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
    setIsDragging: state.setIsDragging,
    setEditingNodeId: state.setEditingNodeId,
    editingNodeId: state.editingNodeId,
    setContextMenu: state.setContextMenu,
    updateNodePositions: state.updateNodePositions,
    theme: state.theme,
    isReadOnly: state.isReadOnly
  })));
  
  const isDraggingRef = useRef(false);
  
  const { setViewport: rfSetViewport, screenToFlowPosition, fitView, setCenter } = useReactFlow();
  
  const [localNodes, setLocalNodes, onLocalNodesChange] = useNodesState(nodes || []);
  
  // Sync local nodes with Zustand nodes when NOT dragging while preserving measurements
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalNodes(currentLocalNodes => {
        const measuredMap = new Map<string, { measured?: { width?: number; height?: number } }>();
        currentLocalNodes.forEach(n => {
          if (n.measured) {
            measuredMap.set(n.id, { measured: n.measured });
          }
        });

        return (nodes || []).map(node => {
          const prevMeasurement = measuredMap.get(node.id);
          if (!prevMeasurement) return node;
          return {
            ...node,
            measured: node.measured || prevMeasurement.measured,
          };
        });
      });
    }
  }, [nodes, setLocalNodes]);

  const handleNodesChange = useCallback((changes: NodeChange<Node>[]) => {
    // Guard against temporary measurement changes for the node currently being edited
    const filteredChanges = editingNodeId 
      ? changes.filter(c => !(c.type === 'dimensions' && c.id === editingNodeId))
      : changes;

    if (filteredChanges.length > 0) {
      onLocalNodesChange(filteredChanges as unknown as NodeChange<MindMapNode>[]);
    }
    
    // Forward selection and dimensions changes to Zustand for persistence / UI sync / layout calculations
    const forwardChanges = filteredChanges.filter(c => c.type === 'select' || c.type === 'dimensions');
    if (forwardChanges.length > 0) {
      onNodesChange(forwardChanges as unknown as NodeChange<MindMapNode>[]);
    }
  }, [onLocalNodesChange, onNodesChange, editingNodeId]);

  const initialized = useRef(false);
  const nodesInitialized = useNodesInitialized();

  // Restore viewport or auto-fit on document load once nodes are initialized
  useEffect(() => {
    if (initialized.current || !nodesInitialized) return;
    initialized.current = true;

    const initialViewport = useMindMapStore.getState().viewport;
    
    if (initialViewport && (initialViewport.x !== 0 || initialViewport.y !== 0 || initialViewport.zoom !== 1)) {
      rfSetViewport(initialViewport);
    } else {
      fitView({ padding: 0.2 });
    }
  }, [rfSetViewport, fitView, nodesInitialized]);

  // Keyboard shortcuts
  useEffect(() => {
    if (isReadOnly) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input, textarea, select, or contenteditable element
      const target = e.target as HTMLElement | null;
      const isInteractive = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        Boolean(target.closest?.('[contenteditable="true"]'))
      );

      if (isInteractive || editingNodeId) {
        if (e.key === 'Escape') {
          setEditingNodeId(null);
        }
        return;
      }

      const key = e.key.toLowerCase();

      if (e.key === 'Tab') {
        if (selectedNodeIds.length === 1) {
          e.preventDefault();
          createChildNode(selectedNodeIds[0]);
        }
      } else if (e.key === 'Enter') {
        if (selectedNodeIds.length === 1) {
          const selectedNode = nodes.find(n => n.id === selectedNodeIds[0]);
          if (selectedNode && selectedNode.type !== 'main') {
            e.preventDefault();
            createSiblingNode(selectedNodeIds[0]);
          }
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && key === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && key === 'c') {
        copySelected();
      } else if ((e.ctrlKey || e.metaKey) && key === 'v') {
        pasteFromClipboard();
      } else if ((e.ctrlKey || e.metaKey) && key === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if ((e.ctrlKey || e.metaKey) && key === 'a') {
        e.preventDefault();
        setSelectedNodes(nodes.map(n => n.id));
      } else if (e.key === 'F2' || e.key === ' ') {
        if (selectedNodeIds.length === 1) {
          e.preventDefault();
          setEditingNodeId(selectedNodeIds[0]);
        }
      } else if (key === 'f') {
        if (selectedNodeIds.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const node = nodes.find(n => n.id === selectedNodeIds[0]);
          if (node) {
            setCenter(node.position.x + 100, node.position.y + 30, { duration: 600 });
          }
        }
      } else if (e.key === 'Escape') {
        setSelectedNodes([]);
        setEditingNodeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, nodes, createChildNode, createSiblingNode, deleteSelected, undo, redo, copySelected, pasteFromClipboard, duplicateSelected, setSelectedNodes, setEditingNodeId, setCenter, isReadOnly, editingNodeId]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isReadOnly) return;
    const target = e.target as HTMLElement;
    if (target.classList.contains('react-flow__pane')) {
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newId = uuidv4();
      const isFirstNode = nodes.length === 0;
      addNode({
        id: newId,
        type: isFirstNode ? 'main' : 'basic',
        position,
        data: { label: isFirstNode ? 'Main Idea' : 'New Topic' },
        selected: true
      });
      setSelectedNodes([newId]);
      setEditingNodeId(newId);
    }
  }, [screenToFlowPosition, addNode, setSelectedNodes, setEditingNodeId, isReadOnly, nodes.length]);

  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent, node: { id: string }) => {
      e.preventDefault();
      if (isReadOnly) return;
      setContextMenu({ x: e.clientX, y: e.clientY, target: 'node', id: node.id });
    },
    [setContextMenu, isReadOnly]
  );

  const onPaneContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      e.preventDefault();
      if (isReadOnly) return;
      setContextMenu({ x: e.clientX, y: e.clientY, target: 'canvas' });
    },
    [setContextMenu, isReadOnly]
  );

  const onNodeDragStart = useCallback((_e: React.MouseEvent | MouseEvent | TouchEvent, _node: Node, _draggedNodes: Node[]) => {
    setIsDragging(true);
    isDraggingRef.current = true;
  }, [setIsDragging]);

  const onNodeDragStop = useCallback((_e: React.MouseEvent | MouseEvent | TouchEvent, _node: Node, draggedNodes: Node[]) => {
    setIsDragging(false);
    isDraggingRef.current = false;
    
    // Only update non-locked nodes
    const validDragged = draggedNodes.filter(n => !(n.data as any)?.locked);
    if (validDragged.length > 0) {
      updateNodePositions(validDragged);
    }
  }, [updateNodePositions, setIsDragging]);

  const onMoveEnd = useCallback((_: any, vp: any) => {
    setViewport(vp);
  }, [setViewport]);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, [setContextMenu]);

  const reconnectingEdgeIdRef = useRef<string | null>(null);
  const reconnectingEdgeRef = useRef<Edge | null>(null);
  const reconnectedSuccessfullyRef = useRef<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnectStart = useCallback((_event: React.MouseEvent | React.TouchEvent, edge: Edge) => {
    reconnectingEdgeIdRef.current = edge.id;
    reconnectingEdgeRef.current = edge;
    reconnectedSuccessfullyRef.current = false;
    setIsReconnecting(true);
  }, []);

  const handleReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    reconnectedSuccessfullyRef.current = true;
    onReconnectEdge(oldEdge as MindMapEdge, newConnection);
  }, [onReconnectEdge]);

  const handleReconnectEnd = useCallback((
    event: MouseEvent | TouchEvent,
    edge: Edge,
    handleType: HandleType
  ) => {
    // If not reconnected yet through standard handle drop, check if dropped on a node card surface
    if (!reconnectedSuccessfullyRef.current) {
      const oldEdge = reconnectingEdgeRef.current || edge;
      const clientX = 'clientX' in event ? event.clientX : (event as TouchEvent).changedTouches?.[0]?.clientX;
      const clientY = 'clientY' in event ? event.clientY : (event as TouchEvent).changedTouches?.[0]?.clientY;

      if (clientX !== undefined && clientY !== undefined && oldEdge) {
        const elements = document.elementsFromPoint(clientX, clientY);
        const nodeEl = elements.find(el => el.classList.contains('react-flow__node'));
        if (nodeEl) {
          const targetNodeId = nodeEl.getAttribute('data-id');
          if (targetNodeId) {
            const rect = nodeEl.getBoundingClientRect();
            const relX = (clientX - rect.left) / (rect.width || 1);
            const relY = (clientY - rect.top) / (rect.height || 1);

            let closestSide: 'top' | 'right' | 'bottom' | 'left' = 'right';
            const dTop = relY;
            const dBottom = 1 - relY;
            const dLeft = relX;
            const dRight = 1 - relX;
            const minD = Math.min(dTop, dBottom, dLeft, dRight);
            if (minD === dTop) closestSide = 'top';
            else if (minD === dBottom) closestSide = 'bottom';
            else if (minD === dLeft) closestSide = 'left';
            else closestSide = 'right';

            // In React Flow EdgeUpdateAnchors:
            // handleType passed is oppositeHandle.type:
            // 'source' means source was fixed, TARGET was moved
            // 'target' means target was fixed, SOURCE was moved
            const isMovingTarget = handleType === 'source';
            const newConnection: Connection = isMovingTarget
              ? {
                  source: oldEdge.source,
                  target: targetNodeId,
                  sourceHandle: oldEdge.sourceHandle ?? null,
                  targetHandle: closestSide,
                }
              : {
                  source: targetNodeId,
                  target: oldEdge.target,
                  sourceHandle: `${closestSide}-src`,
                  targetHandle: oldEdge.targetHandle ?? null,
                };

            if (isValidConnection(newConnection, nodes, edges, {
              ignoredEdgeId: oldEdge.id,
              allowReparenting: true
            })) {
              onReconnectEdge(oldEdge as MindMapEdge, newConnection);
              reconnectedSuccessfullyRef.current = true;
            }
          }
        }
      }
    }

    reconnectingEdgeIdRef.current = null;
    reconnectingEdgeRef.current = null;
    setIsReconnecting(false);
  }, [nodes, edges, onReconnectEdge]);

  const isValidConnectionHandler = useCallback((connection: any) => {
    return isValidConnection(connection, nodes, edges, {
      ignoredEdgeId: reconnectingEdgeIdRef.current || undefined,
      allowReparenting: true
    });
  }, [nodes, edges]);

  const isMobile = useIsMobile(768);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isReadOnly || e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = setTimeout(() => {
      if (touchStartPosRef.current) {
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const nodeEl = target?.closest('.react-flow__node');
        const nodeId = nodeEl?.getAttribute('data-id');

        if (nodeId) {
          setContextMenu({ x: touch.clientX, y: touch.clientY, target: 'node', id: nodeId });
        } else {
          setContextMenu({ x: touch.clientX, y: touch.clientY, target: 'canvas' });
        }

        if ('vibrate' in navigator) {
          try { navigator.vibrate(40); } catch {
            // Ignore vibration error on unsupported platforms
          }
        }
      }
    }, 550);
  }, [isReadOnly, setContextMenu]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  }, []);

  const selectedEdge = edges.find(e => e.selected);

  const displayNodes = useMemo(() => {
    return localNodes.map(n => ({
      ...n,
      draggable: !isReadOnly && !(n.data as any)?.locked
    }));
  }, [localNodes, isReadOnly]);

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <ReactFlow
        className={isReconnecting ? 'canvas-connecting' : undefined}
        nodes={displayNodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        edgesReconnectable={!isReadOnly}
        onReconnect={handleReconnect}
        onReconnectStart={handleReconnectStart}
        onReconnectEnd={handleReconnectEnd}
        reconnectRadius={8}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={isValidConnectionHandler}
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
        colorMode={theme}
        panOnDrag={true}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag={!isReadOnly && !isMobile}
        snapToGrid={false}
        snapGrid={SNAP_GRID}
        proOptions={PRO_OPTIONS}
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={true}
      >
        <Background gap={15} size={1} color="var(--node-border-default)" />
        {!isMobile && (
          <Controls showInteractive={false} position="bottom-right" />
        )}
        {!isMobile && (
          <MiniMap zoomable pannable nodeColor={(node) => {
            return node.data?.backgroundColor as string || 'var(--node-bg-default)';
          }} />
        )}
        {!isReadOnly && <ContextMenu />}
        {!isReadOnly && <CommandPalette />}
        
        {!isReadOnly && selectedNodeIds.length === 1 && !editingNodeId && (
          <FloatingToolbar key={selectedNodeIds[0]} nodeId={selectedNodeIds[0]} />
        )}

        {!isReadOnly && selectedNodeIds.length === 0 && selectedEdge && (
          <EdgeFloatingToolbar edgeId={selectedEdge.id} />
        )}

        {!isReadOnly && nodes.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'none'
          }}>
            <button
              onClick={() => {
                const newId = uuidv4();
                addNode({
                  id: newId,
                  type: 'main',
                  position: { x: 0, y: 0 },
                  data: { label: 'Main Idea' },
                  selected: true
                });
                setSelectedNodes([newId]);
                setEditingNodeId(newId);
              }}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                background: 'var(--accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Plus size={16} /> Thêm bảng thông tin (Main Idea)
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', userSelect: 'none' }}>
              hoặc nhấp đúp chuột vào bất kỳ đâu trên bảng
            </span>
          </div>
        )}
      </ReactFlow>
    </div>
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
