import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import type { NodeTypes } from '@xyflow/react';
import { useMindMapStore } from '../store/useMindMapStore';
import { MainNode } from './nodes/MainNode';
import { BasicNode } from './nodes/BasicNode';

const nodeTypes: NodeTypes = {
  main: MainNode,
  basic: BasicNode,
};

export const MindMapCanvas = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useMindMapStore();

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="var(--node-border-default)" />
        <Controls showInteractive={false} position="bottom-right" />
        <MiniMap zoomable pannable nodeColor={(node) => {
          return node.data?.backgroundColor as string || 'var(--node-bg-default)';
        }} />
      </ReactFlow>
    </div>
  );
};
