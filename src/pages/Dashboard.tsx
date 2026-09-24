import React, { useEffect, useState } from 'react';
import type { MindMapDocument } from '../types';
import { useMindMapStore } from '../store/useMindMapStore';
import { loadAllDocuments, removeDocument, syncDocument } from '../persistence/persistenceService';
import { getAllDocuments as getLocalLegacyDocuments } from '../persistence/idb';
import { useAuth } from '../auth/useAuth';
import { MigrationPrompt } from '../components/auth/MigrationPrompt';
import { v4 as uuidv4 } from 'uuid';
import { FileText, Trash2, Sun, Moon, Settings, Lightbulb, FolderDown, Sparkles, Layers, Clock } from 'lucide-react';
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

const getCategoryColor = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('mind') || cat.includes('classic')) return { color: 'var(--node-color-orange)', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.25)' };
  if (cat.includes('hier') || cat.includes('org')) return { color: 'var(--node-color-green)', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' };
  if (cat.includes('creat') || cat.includes('brain')) return { color: 'var(--node-color-purple)', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.25)' };
  if (cat.includes('strat') || cat.includes('plan')) return { color: 'var(--node-color-cyan)', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.25)' };
  return { color: 'var(--accent-secondary)', bg: 'var(--accent-secondary-soft)', border: 'var(--accent-secondary-border)' };
};

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
      width: '100%', maxWidth: '100%', minHeight: '100vh', height: '100vh', background: 'var(--canvas-ambient)',
      overflowY: 'auto', overflowX: 'hidden', padding: '40px 24px 60px 24px', color: 'var(--text-primary)',
      transition: 'background var(--transition-normal), color var(--transition-normal)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        
        {/* Top Control Buttons (Theme Toggle & Settings) */}
        <div style={{ position: 'absolute', top: '0', right: '0', display: 'flex', gap: '10px', zIndex: 10 }}>
          <button
            onClick={toggleTheme}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: 'var(--panel-bg)',
              color: 'var(--text-primary)',
              border: '1.5px solid var(--panel-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--panel-border)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={20} color="var(--accent)" /> : <Moon size={20} color="var(--accent-secondary)" />}
          </button>
          
          <button
            onClick={() => navigate('/settings')}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: 'var(--panel-bg)',
              color: 'var(--text-primary)',
              border: '1.5px solid var(--panel-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'var(--accent-secondary)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--panel-border)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
        
        {/* User Pill Status Badge */}
        {user && (
          <div style={{ paddingTop: '8px', marginBottom: '12px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--accent-soft)',
              border: '1.5px solid rgba(249, 115, 22, 0.25)',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--accent)'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></span>
              Workspace of <strong>{user.email}</strong>
            </span>
          </div>
        )}

        {/* Dashboard Title & Creative Tagline */}
        <h1 style={{
          marginBottom: '8px',
          fontSize: '38px',
          fontWeight: '800',
          letterSpacing: '-0.03em',
          marginTop: user ? '8px' : '32px',
          color: 'var(--text-primary)'
        }}>
          Your Creative Studio
        </h1>
        <p style={{
          marginBottom: '32px',
          fontSize: '17px',
          color: 'var(--text-secondary)',
          fontWeight: '500',
          lineHeight: 1.4
        }}>
          Unleash your mind. Organize ideas with colors, connections and flow.
        </p>
        
        {/* Main Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '44px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => handleSelectTemplate('blank')}
            style={{ 
              padding: '14px 26px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--gradient-primary)', 
              color: '#ffffff',
              border: 'none',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: 'var(--accent-glow)',
              transition: 'transform var(--transition-bounce), box-shadow var(--transition-fast)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
          >
            <Lightbulb size={20} />
            Start with Blank Canvas
          </button>
          
          <label style={{ 
            padding: '14px 24px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--panel-bg)', 
            color: 'var(--text-primary)',
            border: '2px solid var(--accent-secondary-border)',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.background = 'var(--social-bg)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'var(--panel-bg)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
          >
            <FolderDown size={18} color="var(--accent-secondary)" />
            Import Mind Map
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImport} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>

        {/* Recent Mind Maps Section */}
        {documents.length > 0 ? (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Sparkles size={20} color="var(--accent)" />
              <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', margin: 0 }}>Recent Maps</h2>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '6px', fontWeight: '600' }}>({documents.length})</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
              {documents.map((doc, idx) => {
                const nodeCount = doc.nodes?.length || 0;
                const accentColor = idx % 2 === 0 ? 'var(--node-color-orange)' : 'var(--accent-secondary)';
                return (
                  <div 
                    key={doc.id} 
                    onClick={() => handleOpenDoc(doc)}
                    style={{
                      background: 'var(--panel-bg)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '20px',
                      cursor: 'pointer',
                      border: '1.5px solid var(--panel-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'transform var(--transition-bounce), box-shadow var(--transition-fast), border-color var(--transition-fast)',
                      position: 'relative'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                      e.currentTarget.style.borderColor = accentColor;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--panel-border)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: idx % 2 === 0 ? 'var(--accent-soft)' : 'var(--accent-secondary-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: accentColor
                      }}>
                        <FileText size={18} />
                      </div>

                      <button 
                        onClick={(e) => handleDeleteDoc(e, doc.id)} 
                        style={{
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          padding: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all var(--transition-fast)'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                          e.currentTarget.style.color = 'var(--node-color-red)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                        title="Delete Mind Map"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h3 style={{
                      margin: 0,
                      fontSize: '17px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: 'var(--text-primary)'
                    }}>
                      {doc.title}
                    </h3>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginTop: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />
                        <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <span style={{
                        background: 'var(--social-bg)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontWeight: '600',
                        fontSize: '11px',
                        color: 'var(--text-primary)'
                      }}>
                        {nodeCount} {nodeCount === 1 ? 'idea' : 'ideas'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{
            padding: '50px 30px',
            textAlign: 'center',
            border: '2px dashed var(--accent-secondary-border)',
            borderRadius: 'var(--radius-2xl)',
            marginBottom: '48px',
            background: 'var(--panel-bg)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <Lightbulb size={32} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Your Canvas is Ready</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
              Create your first mind map above or choose an inspiring template below.
            </p>
          </div>
        )}

        {/* Available Templates Grid */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Layers size={20} color="var(--accent-secondary)" />
            <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', margin: 0 }}>Ready-to-use Templates</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: '22px'
          }}>
            {styledTemplates.filter(t => t.id !== 'blank').map(template => {
              const badgeStyle = getCategoryColor(template.category);
              return (
                <div 
                  key={template.id} 
                  onClick={() => setPreviewTemplateId(template.id)} 
                  style={{
                    background: 'var(--panel-bg)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'transform var(--transition-bounce), box-shadow var(--transition-fast), border-color var(--transition-fast)',
                    border: '1.5px solid var(--panel-border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = 'var(--panel-border)';
                  }}
                >
                  {/* Mini Canvas Sketch Container */}
                  <div style={{ 
                    height: '180px',
                    background: 'var(--canvas-bg)',
                    borderRadius: 'var(--radius-lg)', 
                    marginBottom: '16px',
                    border: '1.5px dashed var(--border-subtle)',
                    overflow: 'hidden',
                    position: 'relative'
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {template.name}
                    </h3>
                    <div style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '11px',
                      color: badgeStyle.color,
                      background: badgeStyle.bg,
                      border: `1px solid ${badgeStyle.border}`,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      fontWeight: '700',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}>
                      {template.category}
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
                    {template.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

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

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'var(--panel-bg)',
            borderRadius: 'var(--radius-2xl)',
            width: '100%',
            maxWidth: '850px',
            height: '82vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '2px solid var(--panel-border)',
            boxShadow: 'var(--shadow-toolbar)'
          }}>
            <div style={{
              padding: '24px 28px',
              borderBottom: '1.5px solid var(--panel-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--panel-bg)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {previewTemplate.name}
                  </h2>
                  <span style={{
                    fontSize: '11px',
                    color: getCategoryColor(previewTemplate.category).color,
                    background: getCategoryColor(previewTemplate.category).bg,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}>
                    {previewTemplate.category}
                  </span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {previewTemplate.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setPreviewTemplateId(null)} 
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    border: '1.5px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSelectTemplate(previewTemplate.id)} 
                  style={{
                    padding: '10px 22px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--gradient-primary)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px',
                    boxShadow: 'var(--accent-glow)',
                    transition: 'transform var(--transition-bounce)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
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
