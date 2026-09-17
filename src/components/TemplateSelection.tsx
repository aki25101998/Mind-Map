import React from 'react';
import { templates } from '../templates/definitions';
import { useMindMapStore } from '../store/useMindMapStore';
import { v4 as uuidv4 } from 'uuid';
import type { MindMapEdge, MindMapNode } from '../types';

export const TemplateSelection = () => {
  const { loadDocument } = useMindMapStore();

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Deep clone and assign new IDs to avoid reference issues
    const newDocId = uuidv4();
    
    // Create an ID map to preserve connections
    const idMap: Record<string, string> = {};
    
    const newNodes: MindMapNode[] = template.defaultNodes.map(n => {
      const newId = uuidv4();
      idMap[n.id] = newId;
      return { ...n, id: newId };
    });

    const newEdges: MindMapEdge[] = template.defaultEdges.map(e => ({
      ...e,
      id: uuidv4(),
      source: idMap[e.source],
      target: idMap[e.target]
    }));

    loadDocument(newDocId, `New ${template.name}`, newNodes, newEdges, { x: 0, y: 0, zoom: 1 });
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--canvas-bg)',
      overflowY: 'auto', padding: '40px'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Create from template</h1>
      
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px',
        maxWidth: '1200px', margin: '0 auto'
      }}>
        {templates.map(template => (
          <div key={template.id} onClick={() => handleSelectTemplate(template.id)} style={{
            background: 'var(--panel-bg)', borderRadius: '12px', padding: '24px',
            cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--panel-border)'
          }}>
            <div style={{ 
              height: '120px', background: 'var(--canvas-bg)', borderRadius: '8px', 
              marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px dashed var(--node-border-default)'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Preview</span>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{template.name}</h3>
            <div style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: '8px' }}>{template.category}</div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{template.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
