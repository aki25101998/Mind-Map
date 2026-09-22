import { useState } from 'react';
import type { MindMapDocument } from '../types';
import { templates } from '../templates/definitions';
import { cloneTemplate } from '../templates/templateUtils';
import { syncDocument } from '../persistence/persistenceService';
import { v4 as uuidv4 } from 'uuid';
import { ReactFlow } from '@xyflow/react';
import { MainNode } from '../canvas/nodes/MainNode';
import { BasicNode } from '../canvas/nodes/BasicNode';
import { RoundedNode } from '../canvas/nodes/RoundedNode';
import { TextNode } from '../canvas/nodes/TextNode';
import { CustomMindMapEdge } from '../canvas/edges/MindMapEdge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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

export const TemplateSelectionPage = () => {
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const navigate = useNavigate();

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

    await syncDocument(doc);
    navigate(`/mindmaps/${newDocId}`);
  };

  const previewTemplate = styledTemplates.find(t => t.id === previewTemplateId);

  return (
    <div style={{
      width: '100%', maxWidth: '100%', height: '100vh', background: 'var(--canvas-bg)',
      overflowY: 'auto', overflowX: 'hidden', padding: '40px', color: 'var(--text-primary)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        
        <button
          onClick={() => navigate('/mindmaps')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            borderRadius: 'var(--radius-md)', background: 'transparent',
            color: 'var(--text-secondary)', border: 'none', cursor: 'pointer',
            marginBottom: '32px', fontSize: '14px', fontWeight: '500'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--social-bg)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <h1 style={{ marginBottom: 'var(--space-2)', fontSize: '36px', fontWeight: '700', letterSpacing: '-0.02em' }}>Choose a Template</h1>
        <p style={{ marginBottom: 'var(--space-10)', fontSize: '18px', color: 'var(--text-secondary)' }}>Start with a blank canvas or choose a pre-made structure.</p>
        
        <div style={{ marginBottom: 'var(--space-10)' }}>
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
            Start with Blank Canvas
          </button>
        </div>

        <h2 style={{ marginBottom: 'var(--space-6)', fontSize: '20px', fontWeight: '600' }}>Available Templates</h2>
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
