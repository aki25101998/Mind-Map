import React, { useEffect, useState } from 'react';
import { templates } from '../templates/definitions';
import { cloneTemplate } from '../templates/templateUtils';
import { useMindMapStore } from '../store/useMindMapStore';
import { getAllDocuments, deleteDocument } from '../persistence/idb';
import { v4 as uuidv4 } from 'uuid';
import { ReactFlow } from '@xyflow/react';
import { MainNode } from '../canvas/nodes/MainNode';
import { BasicNode } from '../canvas/nodes/BasicNode';
import { RoundedNode } from '../canvas/nodes/RoundedNode';
import { TextNode } from '../canvas/nodes/TextNode';
import { CustomMindMapEdge } from '../canvas/edges/MindMapEdge';
import { FileText, Trash2 } from 'lucide-react';
import type { MindMapDocument } from '../types';

const nodeTypes = { main: MainNode, basic: BasicNode, rounded: RoundedNode, text: TextNode };
const edgeTypes = { 'mindmap-edge': CustomMindMapEdge };

export const TemplateSelection = () => {
  const { loadDocument } = useMindMapStore();
  const [documents, setDocuments] = useState<MindMapDocument[]>([]);

  const loadRecentDocs = async () => {
    const docs = await getAllDocuments();
    setDocuments(docs.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  useEffect(() => {
    loadRecentDocs();
  }, []);

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const { nodes, edges } = cloneTemplate(template);
    const newDocId = uuidv4();

    loadDocument(newDocId, `New ${template.name}`, nodes, edges, { x: 0, y: 0, zoom: 1 }, template.id);
  };

  const handleOpenDoc = (doc: MindMapDocument) => {
    loadDocument(doc.id, doc.title, doc.nodes, doc.edges, doc.viewport, doc.templateId);
  };

  const handleDeleteDoc = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteDocument(id);
    loadRecentDocs();
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--canvas-bg)',
      overflowY: 'auto', padding: '40px', color: 'var(--text-primary)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {documents.length > 0 && (
          <div style={{ marginBottom: '60px' }}>
            <h2 style={{ marginBottom: '24px' }}>Recent Maps</h2>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
              {documents.map(doc => (
                <div 
                  key={doc.id} 
                  onClick={() => handleOpenDoc(doc)}
                  style={{
                    minWidth: '200px', background: 'var(--panel-bg)', borderRadius: '12px', padding: '16px',
                    cursor: 'pointer', border: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FileText size={24} color="var(--accent)" />
                    <button onClick={(e) => handleDeleteDoc(e, doc.id)} style={{ background: 'transparent', color: 'var(--node-color-red)', padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 style={{ marginBottom: '24px' }}>Create from template</h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px'
        }}>
          {templates.map(template => (
            <div key={template.id} onClick={() => handleSelectTemplate(template.id)} style={{
              background: 'var(--panel-bg)', borderRadius: '12px', padding: '24px',
              cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid var(--panel-border)'
            }}>
              <div style={{ 
                height: '160px', background: 'var(--canvas-bg)', borderRadius: '8px', 
                marginBottom: '16px', border: '1px solid var(--node-border-default)',
                overflow: 'hidden', position: 'relative'
              }}>
                {/* Live mini preview */}
                <ReactFlow
                  nodes={template.defaultNodes}
                  edges={template.defaultEdges}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  panOnDrag={false}
                  zoomOnScroll={false}
                  zoomOnPinch={false}
                  zoomOnDoubleClick={false}
                  elementsSelectable={false}
                  proOptions={{ hideAttribution: true }}
                />
                <div style={{ position: 'absolute', inset: 0, zIndex: 10 }} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{template.name}</h3>
              <div style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: '8px', fontWeight: 'bold' }}>{template.category}</div>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{template.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
