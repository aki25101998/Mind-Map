import React, { useEffect, useState } from 'react';
import type { MindMapDocument, Project } from '../types';
import { useMindMapStore } from '../store/useMindMapStore';
import { 
  loadAllDocuments, 
  removeDocument, 
  syncDocument, 
  loadAllProjects, 
  syncProject, 
  removeProject 
} from '../persistence/persistenceService';
import { getAllDocuments as getLocalLegacyDocuments } from '../persistence/idb';
import { useAuth } from '../auth/useAuth';
import { MigrationPrompt } from '../components/auth/MigrationPrompt';
import { v4 as uuidv4 } from 'uuid';
import { 
  FileText, 
  Trash2, 
  Sun, 
  Moon, 
  Settings, 
  Lightbulb, 
  FolderDown, 
  Sparkles, 
  Layers, 
  Clock, 
  FolderSymlink, 
  ArrowLeft, 
  Pencil, 
  Plus, 
  Folder,
  Menu
} from 'lucide-react';
import { validateDocument } from '../utils/validation';
import { ConfirmModal } from '../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import { ReactFlow } from '@xyflow/react';
import { useIsMobile } from '../hooks/useIsMobile';
import { templates } from '../templates/definitions';
import { cloneTemplate } from '../templates/templateUtils';
import { MainNode } from '../canvas/nodes/MainNode';
import { BasicNode } from '../canvas/nodes/BasicNode';
import { RoundedNode } from '../canvas/nodes/RoundedNode';
import { TextNode } from '../canvas/nodes/TextNode';
import { CustomMindMapEdge } from '../canvas/edges/MindMapEdge';
import { ProjectSidebar } from '../components/project/ProjectSidebar';
import { ProjectModal } from '../components/project/ProjectModal';
import { MoveToProjectModal } from '../components/project/MoveToProjectModal';
import { DeleteProjectModal } from '../components/project/DeleteProjectModal';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all'); // 'all' | 'uncategorized' | projectId
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  
  // Modals state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<'create' | 'edit'>('create');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [moveTargetDoc, setMoveTargetDoc] = useState<MindMapDocument | null>(null);

  const isMobile = useIsMobile(768);
  
  const { user } = useAuth();
  const [legacyDocs, setLegacyDocs] = useState<MindMapDocument[]>([]);
  const [showMigration, setShowMigration] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const previewTemplate = styledTemplates.find(t => t.id === previewTemplateId);

  const loadRecentDocs = () => {
    loadAllDocuments().then(docs => {
      setDocuments(docs.sort((a, b) => b.updatedAt - a.updatedAt));
    });
  };

  const loadProjects = () => {
    loadAllProjects().then(projs => {
      setProjects(projs);
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

    loadAllProjects().then(projs => {
      if (mounted) {
        setProjects(projs);
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
    
    // Auto-assign project if inside a specific project
    const assignedProjectId = (activeFilter !== 'all' && activeFilter !== 'uncategorized') 
      ? activeFilter 
      : undefined;

    const doc: MindMapDocument = {
      id: newDocId,
      title: templateId === 'blank' ? 'Untitled Mind Map' : `New ${template.name}`,
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
      templateId: template.id,
      projectId: assignedProjectId,
      createdAt: now,
      updatedAt: now
    };

    await syncDocument(doc);
    navigate(`/mindmaps/${newDocId}`);
  };

  const handleOpenDoc = (doc: MindMapDocument) => {
    navigate(`/mindmaps/${doc.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, doc: MindMapDocument) => {
    e.stopPropagation();
    setDeleteTarget({ id: doc.id, title: doc.title || 'Untitled Mind Map' });
  };

  const handleMoveClick = (e: React.MouseEvent, doc: MindMapDocument) => {
    e.stopPropagation();
    setMoveTargetDoc(doc);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await removeDocument(deleteTarget.id);
      loadRecentDocs();
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
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
        
        const assignedProjectId = (activeFilter !== 'all' && activeFilter !== 'uncategorized')
          ? activeFilter
          : validDoc.projectId || undefined;

        const importedDoc: MindMapDocument = {
          id: newId,
          title: validDoc.title,
          nodes: validDoc.nodes,
          edges: validDoc.edges,
          viewport: validDoc.viewport,
          templateId: validDoc.templateId || 'blank',
          projectId: assignedProjectId,
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

  // Project Handlers
  const handleOpenCreateProject = () => {
    setProjectModalMode('create');
    setEditingProject(null);
    setShowProjectModal(true);
  };

  const handleSaveProject = async (data: { name: string; color: string; description?: string }) => {
    const now = Date.now();
    if (projectModalMode === 'create') {
      const newId = uuidv4();
      const newProj: Project = {
        id: newId,
        name: data.name,
        color: data.color,
        description: data.description,
        createdAt: now,
        updatedAt: now
      };
      await syncProject(newProj);
      loadProjects();
      setActiveFilter(newId);
    } else if (projectModalMode === 'edit' && editingProject) {
      const updatedProj: Project = {
        ...editingProject,
        name: data.name,
        color: data.color,
        description: data.description,
        updatedAt: now
      };
      await syncProject(updatedProj);
      loadProjects();
    }
  };

  const handleConfirmDeleteProject = async (deleteContainedMaps: boolean) => {
    if (!projectToDelete) return;
    try {
      await removeProject(projectToDelete.id, deleteContainedMaps);
      if (activeFilter === projectToDelete.id) {
        setActiveFilter('all');
      }
      loadProjects();
      loadRecentDocs();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleConfirmMoveDoc = async (targetProjectId: string | undefined) => {
    if (!moveTargetDoc) return;
    try {
      const updatedDoc: MindMapDocument = {
        ...moveTargetDoc,
        projectId: targetProjectId,
        updatedAt: Date.now()
      };
      await syncDocument(updatedDoc);
      loadRecentDocs();
    } catch (err) {
      console.error('Failed to move mind map:', err);
    }
  };

  // Filtered documents
  const currentProject = projects.find(p => p.id === activeFilter);
  const displayedDocuments = activeFilter === 'all' 
    ? documents 
    : activeFilter === 'uncategorized'
      ? documents.filter(d => !d.projectId)
      : documents.filter(d => d.projectId === activeFilter);

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      maxWidth: '100%',
      height: '100vh',
      minHeight: '100vh',
      background: 'var(--canvas-ambient)',
      overflow: 'hidden'
    }}>
      {/* Collapsible Left Sidebar */}
      <ProjectSidebar
        projects={projects}
        documents={documents}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        onNewProject={handleOpenCreateProject}
        onEditProject={(proj) => {
          setProjectModalMode('edit');
          setEditingProject(proj);
          setShowProjectModal(true);
        }}
        onDeleteProject={(proj) => {
          setProjectToDelete(proj);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobile={isMobile}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
      />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        minWidth: 0,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingTop: isMobile ? 'max(calc(var(--safe-top, 0px) + 14px), 48px)' : '32px',
        paddingLeft: isMobile ? 'max(var(--safe-left, 0px), 16px)' : '32px',
        paddingRight: isMobile ? 'max(var(--safe-right, 0px), 16px)' : '32px',
        paddingBottom: isMobile ? 'max(calc(var(--safe-bottom, 0px) + 40px), 60px)' : '60px',
        color: 'var(--text-primary)',
        transition: 'background var(--transition-normal), color var(--transition-normal)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          
          {/* Top Header Row with Menu Toggle, User Pill & Controls (ChatGPT-style single row) */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            marginBottom: isMobile ? '20px' : '24px',
            flexWrap: 'nowrap',
            width: '100%'
          }}>
            {/* Left: Hamburger menu toggle button (ChatGPT-style circular button) */}
            <button
              type="button"
              onClick={() => {
                if (isMobile) {
                  setIsOpenMobileSidebar(true);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--panel-bg)',
                color: 'var(--text-primary)',
                border: '1.5px solid var(--panel-border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
                flexShrink: 0,
                transition: 'all var(--transition-fast)'
              }}
              title="Menu Projects & Sơ đồ"
            >
              <Menu size={20} />
            </button>

            {/* Center: User Workspace Pill (Single line, text-overflow ellipsis) */}
            {user ? (
              <div style={{ minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--accent-soft)',
                  border: '1.5px solid rgba(249, 115, 22, 0.25)',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--accent)',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, boxShadow: '0 0 6px var(--accent)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isMobile ? user.email : <>Workspace of <strong>{user.email}</strong></>}
                  </span>
                </span>
              </div>
            ) : <div style={{ flex: 1 }} />}

            {/* Right: Theme & Settings Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
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
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={19} color="var(--accent)" /> : <Moon size={19} color="var(--accent-secondary)" />}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/settings')}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
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
                title="Settings"
              >
                <Settings size={19} />
              </button>
            </div>
          </div>



          {/* VIEW 1: ALL MIND MAPS (Default Dashboard View - Preserves 100% of Recent Maps & Templates) */}
          {activeFilter === 'all' && (
            <>
              {/* Dashboard Title & Creative Tagline */}
              <h1 style={{
                marginBottom: '8px',
                fontSize: isMobile ? '28px' : '36px',
                fontWeight: '800',
                letterSpacing: '-0.03em',
                marginTop: '12px',
                color: 'var(--text-primary)'
              }}>
                Your Creative Studio
              </h1>
              <p style={{
                marginBottom: isMobile ? '24px' : '30px',
                fontSize: isMobile ? '14px' : '16px',
                color: 'var(--text-secondary)',
                fontWeight: '500',
                lineHeight: 1.4
              }}>
                Unleash your mind. Organize ideas with colors, connections and flow.
              </p>
              
              {/* Main Action Buttons */}
              <div style={{ display: 'flex', gap: '14px', marginBottom: '40px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handleSelectTemplate('blank')}
                  style={{ 
                    padding: '13px 24px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--gradient-primary)', 
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '14px',
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
                  <Lightbulb size={19} />
                  Start with Blank Canvas
                </button>
                
                <label style={{ 
                  padding: '13px 22px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--panel-bg)', 
                  color: 'var(--text-primary)',
                  border: '2px solid var(--accent-secondary-border)',
                  fontSize: '14px',
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

              {/* Recent Mind Maps Section (Preserved 100%) */}
              {displayedDocuments.length > 0 ? (
                <div style={{ marginBottom: '48px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <Sparkles size={20} color="var(--accent)" />
                    <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', margin: 0 }}>Recent Maps</h2>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '6px', fontWeight: '600' }}>({displayedDocuments.length})</span>
                  </div>

                  {/* Horizontal Project Filter Chips for Quick 1-tap switching */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    overflowX: 'auto',
                    padding: '0 2px 16px 2px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    flexShrink: 0
                  }}>
                    {/* Tất cả (Currently Active in this view) */}
                    <button
                      type="button"
                      onClick={() => setActiveFilter('all')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--accent-soft)',
                        border: '1.5px solid rgba(249, 115, 22, 0.4)',
                        color: 'var(--accent)',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <span>Tất cả</span>
                      <span style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: 'rgba(249, 115, 22, 0.2)',
                        color: 'var(--accent)'
                      }}>
                        {documents.length}
                      </span>
                    </button>

                    {/* Chưa phân loại */}
                    <button
                      type="button"
                      onClick={() => setActiveFilter('uncategorized')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--panel-bg)',
                        border: '1.5px solid var(--panel-border)',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <span>Chưa phân loại</span>
                      <span style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: 'var(--social-bg)',
                        color: 'var(--text-muted)'
                      }}>
                        {documents.filter(d => !d.projectId).length}
                      </span>
                    </button>

                    {/* Project pills */}
                    {projects.map((proj) => {
                      const count = documents.filter(d => d.projectId === proj.id).length;
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => setActiveFilter(proj.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-pill)',
                            background: 'var(--panel-bg)',
                            border: '1.5px solid var(--panel-border)',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: proj.color, flexShrink: 0 }} />
                          <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {proj.name}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: 'var(--social-bg)',
                            color: 'var(--text-muted)'
                          }}>
                            {count}
                          </span>
                        </button>
                      );
                    })}

                    {/* Add Project Pill */}
                    <button
                      type="button"
                      onClick={handleOpenCreateProject}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'transparent',
                        border: '1.5px dashed var(--accent)',
                        color: 'var(--accent)',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        transition: 'all var(--transition-fast)'
                      }}
                      title="Tạo Project mới"
                    >
                      <Plus size={13} />
                      <span>Tạo mới</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                    {displayedDocuments.map((doc, idx) => {
                      const nodeCount = doc.nodes?.length || 0;
                      const docProject = projects.find(p => p.id === doc.projectId);
                      const accentColor = docProject ? docProject.color : (idx % 2 === 0 ? 'var(--node-color-orange)' : 'var(--accent-secondary)');
                      
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
                              background: docProject ? `${docProject.color}22` : (idx % 2 === 0 ? 'var(--accent-soft)' : 'var(--accent-secondary-soft)'),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: accentColor
                            }}>
                              <FileText size={18} />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {docProject && (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-pill)',
                                  background: `${docProject.color}1c`,
                                  color: docProject.color,
                                  border: `1px solid ${docProject.color}44`,
                                  maxWidth: '100px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }} title={`Project: ${docProject.name}`}>
                                  {docProject.name}
                                </span>
                              )}

                              <button 
                                onClick={(e) => handleMoveClick(e, doc)} 
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
                                  e.currentTarget.style.background = 'var(--accent-soft)';
                                  e.currentTarget.style.color = 'var(--accent)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = 'var(--text-muted)';
                                }}
                                title="Chuyển sang Project khác"
                              >
                                <FolderSymlink size={16} />
                              </button>

                              <button 
                                onClick={(e) => handleDeleteClick(e, doc)} 
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

              {/* Available Templates Grid (Preserved 100%) */}
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
            </>
          )}

          {/* VIEW 2: SPECIFIC PROJECT VIEW OR UNCATEGORIZED VIEW */}
          {activeFilter !== 'all' && (
            <div>
              {/* Return to All Maps button */}
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  padding: 0
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <ArrowLeft size={16} /> Quay lại Tất cả Mind Maps
              </button>

              {/* Project Banner Header */}
              <div style={{
                background: 'var(--panel-bg)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                border: '1.5px solid var(--panel-border)',
                marginBottom: '28px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: currentProject ? `${currentProject.color}22` : 'var(--accent-secondary-soft)',
                      color: currentProject ? currentProject.color : 'var(--accent-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {currentProject ? <Folder size={24} /> : <Layers size={24} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h1 style={{ margin: 0, fontSize: isMobile ? '22px' : '28px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {currentProject ? currentProject.name : 'Chưa Phân Loại'}
                        </h1>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-pill)',
                          background: currentProject ? `${currentProject.color}1c` : 'var(--social-bg)',
                          color: currentProject ? currentProject.color : 'var(--text-secondary)'
                        }}>
                          {displayedDocuments.length} sơ đồ
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {currentProject?.description || (currentProject ? 'Danh sách các sơ đồ thuộc dự án này' : 'Các sơ đồ tự do chưa được phân loại vào dự án')}
                      </p>
                    </div>
                  </div>

                  {/* Actions for this project */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {currentProject && (
                      <button
                        type="button"
                        onClick={() => {
                          setProjectModalMode('edit');
                          setEditingProject(currentProject);
                          setShowProjectModal(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'transparent',
                          border: '1.5px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Pencil size={15} /> Chỉnh sửa
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={() => handleSelectTemplate('blank')}
                      style={{ 
                        padding: '10px 20px',
                        borderRadius: 'var(--radius-md)',
                        background: currentProject ? currentProject.color : 'var(--gradient-primary)', 
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <Plus size={16} /> Mind Map Mới
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid of maps inside this project */}
              {displayedDocuments.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                  {displayedDocuments.map((doc) => {
                    const nodeCount = doc.nodes?.length || 0;
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
                          e.currentTarget.style.borderColor = currentProject ? currentProject.color : 'var(--accent)';
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
                            background: currentProject ? `${currentProject.color}22` : 'var(--accent-secondary-soft)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: currentProject ? currentProject.color : 'var(--accent-secondary)'
                          }}>
                            <FileText size={18} />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button 
                              onClick={(e) => handleMoveClick(e, doc)} 
                              style={{
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                padding: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Chuyển sang Project khác"
                            >
                              <FolderSymlink size={16} />
                            </button>

                            <button 
                              onClick={(e) => handleDeleteClick(e, doc)} 
                              style={{
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                padding: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Delete Mind Map"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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
              ) : (
                <div style={{
                  padding: '50px 30px',
                  textAlign: 'center',
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-2xl)',
                  background: 'var(--panel-bg)'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: currentProject ? `${currentProject.color}22` : 'var(--social-bg)',
                    color: currentProject ? currentProject.color : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px auto'
                  }}>
                    <Folder size={28} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Chưa có sơ đồ nào</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0', fontSize: '14px' }}>
                    Tạo sơ đồ đầu tiên cho project này để bắt đầu tổ chức ý tưởng của bạn.
                  </p>
                  <button 
                    onClick={() => handleSelectTemplate('blank')}
                    style={{ 
                      padding: '10px 22px',
                      borderRadius: 'var(--radius-md)',
                      background: currentProject ? currentProject.color : 'var(--gradient-primary)', 
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Plus size={16} /> Tạo Mind Map Mới
                  </button>
                </div>
              )}
            </div>
          )}

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
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: isMobile ? '10px' : '20px'
        }}>
          <div style={{
            background: 'var(--panel-bg)',
            borderRadius: 'var(--radius-2xl)',
            width: '100%',
            maxWidth: '850px',
            height: isMobile ? '92vh' : '82vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '2px solid var(--panel-border)',
            boxShadow: 'var(--shadow-toolbar)'
          }}>
            <div style={{
              padding: isMobile ? '16px' : '24px 28px',
              borderBottom: '1.5px solid var(--panel-border)',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? '12px' : '16px',
              background: 'var(--panel-bg)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: isMobile ? '20px' : '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
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
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {previewTemplate.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
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

      {/* Delete Mind Map Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Mind Map?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All nodes, connections and notes in this map will be permanently removed.`}
        confirmLabel="Delete Map"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />

      {/* Create / Edit Project Modal */}
      <ProjectModal
        isOpen={showProjectModal}
        mode={projectModalMode}
        project={editingProject}
        onSave={handleSaveProject}
        onClose={() => setShowProjectModal(false)}
      />

      {/* Move Mind Map to Project Modal */}
      {moveTargetDoc && (
        <MoveToProjectModal
          isOpen={!!moveTargetDoc}
          mindMapTitle={moveTargetDoc.title || 'Untitled Mind Map'}
          currentProjectId={moveTargetDoc.projectId}
          projects={projects}
          onSelectProject={handleConfirmMoveDoc}
          onClose={() => setMoveTargetDoc(null)}
        />
      )}

      {/* Delete Project Modal */}
      {projectToDelete && (
        <DeleteProjectModal
          isOpen={!!projectToDelete}
          project={projectToDelete}
          containedMapCount={documents.filter(d => d.projectId === projectToDelete.id).length}
          onConfirm={handleConfirmDeleteProject}
          onClose={() => setProjectToDelete(null)}
        />
      )}
    </div>
  );
};
