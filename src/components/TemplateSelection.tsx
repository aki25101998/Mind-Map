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
import { FileText, Trash2, Sun, Moon } from 'lucide-react';
import { validateDocument } from '../utils/validation';

const nodeTypes = { main: MainNode, basic: BasicNode, rounded: RoundedNode, text: TextNode };
const edgeTypes = { 'mindmap-edge': CustomMindMapEdge };

const styledTemplates = templates.map(t => {
  const cloned = cloneTemplate(t, true);
  return {
    ...t,
    previewNodes: cloned.nodes,
    previewEdges: cloned.edges
  };
});

export const TemplateSelection = () => {
  const { loadDocument, theme, toggleTheme } = useMindMapStore();
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

  const previewTemplate = styledTemplates.find(t => t.id === previewTemplateId);

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
      width: '100%', maxWidth: '100%', height: '100vh', background: 'var(--canvas-bg)',
      overflowY: 'auto', overflowX: 'hidden', padding: '40px', color: 'var(--text-primary)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        
        <div style={{ position: 'absolute', top: '0', right: '0', marginTop: '4px' }}>
          <button
            onClick={toggleTheme}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--panel-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--panel-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--panel-bg)'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <h1 style={{ marginBottom: 'var(--space-2)', fontSize: '36px', fontWeight: '700', letterSpacing: '-0.02em' }}>Your Workspace</h1>
        <p style={{ marginBottom: 'var(--space-10)', fontSize: '18px', color: 'var(--text-secondary)' }}>Turn ideas into structure.</p>
        
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-12)' }}>
          <button 
            onClick={() => handleSelectTemplate('blank')}
            style={{ 
              padding: 'var(--space-4) var(--space-6)', borderRadius: 'var(--radius-lg)', background: 'var(--text-primary)', 
              color: 'var(--canvas-bg)', border: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              transition: 'opacity var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            + New Mind Map
          </button>
          
          <label style={{ 
            padding: 'var(--space-4) var(--space-6)', borderRadius: 'var(--radius-lg)', background: 'var(--panel-bg)', 
            color: 'var(--text-primary)', border: '1px solid var(--panel-border)', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background var(--transition-fast)'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--panel-bg)'}
          >
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
          <div style={{ marginBottom: 'var(--space-12)' }}>
            <h2 style={{ marginBottom: 'var(--space-6)', fontSize: '20px', fontWeight: '600' }}>Recent Maps</h2>
            <div style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', paddingBottom: 'var(--space-4)', maxWidth: '100%' }}>
              {documents.map(doc => (
                <div 
                  key={doc.id} 
                  onClick={() => handleOpenDoc(doc)}
                  style={{
                    minWidth: '240px', background: 'var(--panel-bg)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
                    cursor: 'pointer', border: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
                    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FileText size={20} color="var(--text-muted)" />
                    <button onClick={(e) => handleDeleteDoc(e, doc.id)} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--node-color-red)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Updated {new Date(doc.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 style={{ marginBottom: 'var(--space-6)', fontSize: '20px', fontWeight: '600' }}>Create from Template</h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 'var(--space-6)'
        }}>
          {styledTemplates.filter(t => t.id !== 'blank').map(template => (
            <div key={template.id} onClick={() => setPreviewTemplateId(template.id)} style={{
              background: 'var(--panel-bg)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
              cursor: 'pointer', transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)', border: '1px solid var(--panel-border)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ 
                height: '180px', background: 'var(--canvas-bg)', borderRadius: 'var(--radius-md)', 
                marginBottom: 'var(--space-4)', border: '1px solid var(--border-subtle)',
                overflow: 'hidden', position: 'relative'
              }}>
                {/* Live mini preview */}
                <ReactFlow
                  nodes={template.previewNodes}
                  edges={template.previewEdges}
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
              <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: '16px', fontWeight: '600' }}>{template.name}</h3>
              <div style={{ display: 'inline-block', fontSize: '11px', color: 'var(--text-primary)', background: 'var(--social-bg)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', marginBottom: 'var(--space-2)', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{template.category}</div>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{template.description}</p>
            </div>
          ))}
        </div>
      </div>

      {previewTemplate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--panel-bg)', borderRadius: 'var(--radius-xl)', width: '90%', maxWidth: '800px',
            height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-toolbar)'
          }}>
            <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 var(--space-2) 0', fontSize: '24px', fontWeight: '600' }}>{previewTemplate.name}</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px' }}>{previewTemplate.description}</p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button 
                  onClick={() => setPreviewTemplateId(null)} 
                  style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSelectTemplate(previewTemplate.id)} 
                  style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'var(--text-primary)', border: 'none', color: 'var(--canvas-bg)', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Use Template
                </button>
              </div>
            </div>
            <div style={{ flex: 1, background: 'var(--canvas-bg)', position: 'relative' }}>
              <ReactFlow
                nodes={previewTemplate.previewNodes}
                edges={previewTemplate.previewEdges}
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
