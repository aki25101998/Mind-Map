import React, { useEffect, useState } from 'react';
import type { MindMapDocument } from '../types';
import { useMindMapStore } from '../store/useMindMapStore';
import { loadAllDocuments, removeDocument, syncDocument } from '../persistence/persistenceService';
import { getAllDocuments as getLocalLegacyDocuments } from '../persistence/idb';
import { useAuth } from '../auth/useAuth';
import { MigrationPrompt } from '../components/auth/MigrationPrompt';
import { v4 as uuidv4 } from 'uuid';
import { FileText, Trash2, Sun, Moon, Settings } from 'lucide-react';
import { validateDocument } from '../utils/validation';
import { useNavigate } from 'react-router-dom';
import { ReactFlow } from '@xyflow/react';
import { templates } from '../templates/definitions';
import { cloneTemplate } from '../templates/templateUtils';
import { MainNode } from '../canvas/nodes/MainNode';
import { BasicNode } from '../canvas/nodes/BasicNode';
import { RoundedNode } from '../canvas/nodes/RoundedNode';
import { TextNode } from '../canvas/nodes/TextNode';
import { CustomMindMapEdge } from '../canvas/edges/MindMapEdge';

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

export const Dashboard = () => {
  const { theme, toggleTheme } = useMindMapStore();
  const [documents, setDocuments] = useState<MindMapDocument[]>([]);
  
  const { user } = useAuth();
  const [legacyDocs, setLegacyDocs] = useState<MindMapDocument[]>([]);
  const [showMigration, setShowMigration] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const navigate = useNavigate();

  const previewTemplate = styledTemplates.find(t => t.id === previewTemplateId);

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

  const loadRecentDocs = () => {
    loadAllDocuments().then(docs => {
      setDocuments(docs.sort((a, b) => b.updatedAt - a.updatedAt));
    });
  };

  useEffect(() => {
    let mounted = true;
    
    // Check for legacy docs
    getLocalLegacyDocuments().then(docs => {
      if (!mounted) return;
      const unowned = docs.filter(d => !(d as any).uid);
      if (unowned.length > 0) {
        setLegacyDocs(unowned);
        setShowMigration(true);
      }
    });

    loadAllDocuments().then(docs => {
      if (mounted) {
        setDocuments(docs.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleOpenDoc = (doc: MindMapDocument) => {
    navigate(`/mindmaps/${doc.id}`);
  };

  const handleDeleteDoc = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await removeDocument(id);
    loadRecentDocs();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const validDoc = validateDocument(json);
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
        
        await syncDocument(importedDoc);
        navigate(`/mindmaps/${importedDoc.id}`);
      } catch (err) {
        console.error('Failed to import document:', err);
        alert('Invalid Mind Map file: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{
      width: '100%', maxWidth: '100%', height: '100vh', background: 'var(--canvas-bg)',
      overflowY: 'auto', overflowX: 'hidden', padding: '40px', color: 'var(--text-primary)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        
        <div style={{ position: 'absolute', top: '0', right: '0', marginTop: '4px', display: 'flex', gap: '8px' }}>
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
          
          <button
            onClick={() => navigate('/settings')}
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
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
        
        {user && (
          <div style={{ paddingTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Logged in as <strong>{user.email}</strong>
          </div>
        )}

        <h1 style={{ marginBottom: 'var(--space-2)', fontSize: '36px', fontWeight: '700', letterSpacing: '-0.02em', marginTop: user ? '8px' : '40px' }}>Your Workspace</h1>
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
            Start with Blank Canvas
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

        <div style={{ marginBottom: 'var(--space-12)' }}>
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

        {documents.length > 0 ? (
          <div style={{ marginBottom: 'var(--space-12)' }}>
            <h2 style={{ marginBottom: 'var(--space-6)', fontSize: '20px', fontWeight: '600' }}>Recent Maps</h2>
            <div style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', paddingBottom: 'var(--space-4)', maxWidth: '100%', flexWrap: 'wrap' }}>
              {documents.map(doc => (
                <div 
                  key={doc.id} 
                  onClick={() => handleOpenDoc(doc)}
                  style={{
                    width: '240px', background: 'var(--panel-bg)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
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
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed var(--panel-border)', borderRadius: 'var(--radius-lg)' }}>
            <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>No Mind Maps Yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Create your first mind map to get started.</p>
          </div>
        )}

      </div>

      {showMigration && (
        <MigrationPrompt 
          documents={legacyDocs} 
          onComplete={() => {
            setShowMigration(false);
            loadRecentDocs();
          }} 
        />
      )}

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
