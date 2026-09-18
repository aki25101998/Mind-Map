import React, { useEffect, useState } from 'react';
import type { MindMapDocument } from '../types';
import { templates } from '../templates/definitions';
import { cloneTemplate } from '../templates/templateUtils';


import { useMindMapStore } from '../store/useMindMapStore';
import { getAllDocuments, deleteDocument, saveDocument } from '../persistence/idb';
import { v4 as uuidv4 } from 'uuid';
import { ReactFlow } from '@xyflow/react';
import { MainNode } from '../canvas/nodes/MainNode';
import { BasicNode } from '../canvas/nodes/BasicNode';
import { RoundedNode } from '../canvas/nodes/RoundedNode';
import { TextNode } from '../canvas/nodes/TextNode';
import { CustomMindMapEdge } from '../canvas/edges/MindMapEdge';
import { FileText, Trash2 } from 'lucide-react';
import { validateDocument } from '../utils/validation';

const nodeTypes = { main: MainNode, basic: BasicNode, rounded: RoundedNode, text: TextNode };
const edgeTypes = { 'mindmap-edge': CustomMindMapEdge };

export const TemplateSelection = () => {
  const { loadDocument } = useMindMapStore();
  const [documents, setDocuments] = useState<MindMapDocument[]>([]);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const loadRecentDocs = () => {
    getAllDocuments().then(docs => {
      setDocuments(docs.sort((a, b) => b.updatedAt - a.updatedAt));
    });
  };

  useEffect(() => {
    let mounted = true;
    getAllDocuments().then(docs => {
      if (mounted) {
        setDocuments(docs.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleSelectTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const { nodes, edges } = cloneTemplate(template);
    const newDocId = uuidv4();
    const now = Date.now();
    
    const doc: MindMapDocument = {
      id: newDocId,
      title: templateId === 'blank' ? 'Untitled Mind Map' : `New ${template.name}`,
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
      templateId: template.id,
      createdAt: now,
      updatedAt: now
    };

    await saveDocument(doc);
    loadDocument(doc.id, doc.title, doc.nodes, doc.edges, doc.viewport, doc.templateId || 'blank', doc.createdAt, doc.updatedAt);
  };

  const handleOpenDoc = (doc: MindMapDocument) => {
    try {
      const validDoc = validateDocument(doc);
      loadDocument(validDoc.id, validDoc.title, validDoc.nodes, validDoc.edges, validDoc.viewport, validDoc.templateId || 'blank', validDoc.createdAt, validDoc.updatedAt);
    } catch (err) {
      console.error('Failed to load document:', err);
      alert('This document is corrupted and cannot be loaded.');
    }
  };

  const handleDeleteDoc = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteDocument(id);
    loadRecentDocs();
  };

  const previewTemplate = templates.find(t => t.id === previewTemplateId);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const validDoc = validateDocument(json);
        // Create a new ID to avoid overwriting existing
        const newId = uuidv4();
        
        const importedDoc: MindMapDocument = {
          id: newId,
          title: validDoc.title,
          nodes: validDoc.nodes,
          edges: validDoc.edges,
          viewport: validDoc.viewport,
          templateId: validDoc.templateId || 'blank',
          createdAt: validDoc.createdAt,
          updatedAt: Date.now()
        };
        
        await saveDocument(importedDoc);
        loadDocument(importedDoc.id, importedDoc.title, importedDoc.nodes, importedDoc.edges, importedDoc.viewport, importedDoc.templateId || 'blank', importedDoc.createdAt, importedDoc.updatedAt);
      } catch (err) {
        console.error('Failed to import document:', err);
        alert('Invalid Mind Map file: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--canvas-bg)',
      overflowY: 'auto', padding: '40px', color: 'var(--text-primary)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <h1 style={{ marginBottom: '40px', fontSize: '32px' }}>My Mind Maps</h1>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
          <button 
            onClick={() => handleSelectTemplate('blank')}
            style={{ 
              padding: '16px 24px', borderRadius: '12px', background: 'var(--accent)', 
              color: '#fff', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' 
            }}
          >
            + Blank Canvas
          </button>
          
          <label style={{ 
            padding: '16px 24px', borderRadius: '12px', background: 'var(--panel-bg)', 
            color: 'var(--text-primary)', border: '1px solid var(--panel-border)', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            Import Mind Map
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImport} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>

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
                    <button onClick={(e) => handleDeleteDoc(e, doc.id)} style={{ background: 'transparent', color: 'var(--node-color-red)', padding: '4px', border: 'none', cursor: 'pointer' }}>
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

        <h2 style={{ marginBottom: '24px' }}>Create from Template</h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px'
        }}>
          {templates.filter(t => t.id !== 'blank').map(template => (
            <div key={template.id} onClick={() => setPreviewTemplateId(template.id)} style={{
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

      {previewTemplate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--panel-bg)', borderRadius: '16px', width: '90vw', maxWidth: '800px',
            height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow)'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0' }}>{previewTemplate.name}</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{previewTemplate.description}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setPreviewTemplateId(null)} 
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--panel-border)', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSelectTemplate(previewTemplate.id)} 
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent)', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Use Template
                </button>
              </div>
            </div>
            <div style={{ flex: 1, background: 'var(--canvas-bg)', position: 'relative' }}>
              <ReactFlow
                nodes={previewTemplate.defaultNodes}
                edges={previewTemplate.defaultEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                panOnDrag={true}
                zoomOnScroll={true}
                elementsSelectable={false}
                proOptions={{ hideAttribution: true }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
