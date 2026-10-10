import React, { useState } from 'react';
import { 
  Folder, 
  Layers, 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  X,
  FolderOpen
} from 'lucide-react';
import type { Project, MindMapDocument } from '../../types';

export interface ProjectSidebarProps {
  projects: Project[];
  documents: MindMapDocument[];
  activeFilter: string; // 'all' | 'uncategorized' | projectId
  onSelectFilter: (filterId: string) => void;
  onNewProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  documents,
  activeFilter,
  onSelectFilter,
  onNewProject,
  onEditProject,
  onDeleteProject,
  isCollapsed,
  onToggleCollapse,
  isMobile,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [activeMenuProjectId, setActiveMenuProjectId] = useState<string | null>(null);

  // Calculate counts
  const totalCount = documents.length;
  const uncategorizedCount = documents.filter((d) => !d.projectId).length;

  const getProjectMapCount = (projId: string) => {
    return documents.filter((d) => d.projectId === projId).length;
  };

  const handleSelect = (filterId: string) => {
    onSelectFilter(filterId);
    if (isMobile) {
      onCloseMobile();
    }
  };

  const handleMenuClick = (e: React.MouseEvent, projId: string) => {
    e.stopPropagation();
    setActiveMenuProjectId(activeMenuProjectId === projId ? null : projId);
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleWindowClick = () => {
      setActiveMenuProjectId(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  const sidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--panel-bg)',
        borderRight: isMobile ? 'none' : '1px solid var(--panel-border)',
        width: isMobile ? '280px' : isCollapsed ? '68px' : '260px',
        maxWidth: isMobile ? '85vw' : '100%',
        transition: 'width var(--transition-normal), transform var(--transition-normal)',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          padding: isCollapsed && !isMobile ? '16px 8px' : '18px 16px',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          justifyContent: isCollapsed && !isMobile ? 'center' : 'space-between',
          alignItems: 'center',
          minHeight: '60px',
          boxSizing: 'border-box',
        }}
      >
        {(!isCollapsed || isMobile) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <FolderOpen size={20} color="var(--accent)" />
            <span style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              Projects
            </span>
          </div>
        )}

        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'}
            style={{
              background: 'var(--social-bg)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Navigation Section */}
      <div style={{ padding: isCollapsed && !isMobile ? '12px 6px' : '14px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* All Mind Maps */}
        <button
          type="button"
          onClick={() => handleSelect('all')}
          title="Tất cả Mind Maps"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed && !isMobile ? 'center' : 'space-between',
            padding: isCollapsed && !isMobile ? '10px 0' : '9px 12px',
            borderRadius: 'var(--radius-md)',
            background: activeFilter === 'all' ? 'var(--accent-soft)' : 'transparent',
            border: activeFilter === 'all' ? '1px solid rgba(249, 115, 22, 0.25)' : '1px solid transparent',
            color: activeFilter === 'all' ? 'var(--accent)' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeFilter === 'all' ? '700' : '500',
            transition: 'all var(--transition-fast)',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            if (activeFilter !== 'all') e.currentTarget.style.background = 'var(--social-bg)';
          }}
          onMouseLeave={(e) => {
            if (activeFilter !== 'all') e.currentTarget.style.background = 'transparent';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <Folder size={17} color={activeFilter === 'all' ? 'var(--accent)' : 'var(--text-secondary)'} />
            {(!isCollapsed || isMobile) && (
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Tất cả Mind Maps
              </span>
            )}
          </div>
          {(!isCollapsed || isMobile) && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '2px 7px',
                borderRadius: '10px',
                background: activeFilter === 'all' ? 'rgba(249, 115, 22, 0.2)' : 'var(--social-bg)',
                color: activeFilter === 'all' ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {totalCount}
            </span>
          )}
        </button>

        {/* Uncategorized */}
        <button
          type="button"
          onClick={() => handleSelect('uncategorized')}
          title="Chưa phân loại"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed && !isMobile ? 'center' : 'space-between',
            padding: isCollapsed && !isMobile ? '10px 0' : '9px 12px',
            borderRadius: 'var(--radius-md)',
            background: activeFilter === 'uncategorized' ? 'var(--accent-secondary-soft)' : 'transparent',
            border: activeFilter === 'uncategorized' ? '1px solid var(--accent-secondary-border)' : '1px solid transparent',
            color: activeFilter === 'uncategorized' ? 'var(--accent-secondary)' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeFilter === 'uncategorized' ? '700' : '500',
            transition: 'all var(--transition-fast)',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            if (activeFilter !== 'uncategorized') e.currentTarget.style.background = 'var(--social-bg)';
          }}
          onMouseLeave={(e) => {
            if (activeFilter !== 'uncategorized') e.currentTarget.style.background = 'transparent';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <Layers size={17} color={activeFilter === 'uncategorized' ? 'var(--accent-secondary)' : 'var(--text-secondary)'} />
            {(!isCollapsed || isMobile) && (
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Chưa phân loại
              </span>
            )}
          </div>
          {(!isCollapsed || isMobile) && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '2px 7px',
                borderRadius: '10px',
                background: activeFilter === 'uncategorized' ? 'var(--accent-secondary-soft)' : 'var(--social-bg)',
                color: activeFilter === 'uncategorized' ? 'var(--accent-secondary)' : 'var(--text-muted)',
              }}
            >
              {uncategorizedCount}
            </span>
          )}
        </button>
      </div>

      <div style={{ height: '1px', background: 'var(--panel-border)', margin: '0 12px' }} />

      {/* Projects List Section */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isCollapsed && !isMobile ? '12px 6px' : '14px 12px' }}>
        {(!isCollapsed || isMobile) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              padding: '0 4px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontWeight: '700',
                letterSpacing: '0.05em',
              }}
            >
              Danh sách Projects
            </span>
            <button
              type="button"
              onClick={onNewProject}
              title="Tạo Project mới"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {projects.map((proj) => {
            const count = getProjectMapCount(proj.id);
            const isActive = activeFilter === proj.id;
            const isMenuOpen = activeMenuProjectId === proj.id;

            return (
              <div
                key={proj.id}
                style={{ position: 'relative' }}
              >
                <div
                  onClick={() => handleSelect(proj.id)}
                  title={proj.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed && !isMobile ? 'center' : 'space-between',
                    padding: isCollapsed && !isMobile ? '10px 0' : '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? `${proj.color}1a` : 'transparent',
                    border: isActive ? `1.5px solid ${proj.color}55` : '1.5px solid transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--social-bg)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <span
                      style={{
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        background: proj.color,
                        flexShrink: 0,
                        boxShadow: `0 0 6px ${proj.color}88`,
                      }}
                    />
                    {(!isCollapsed || isMobile) && (
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: isActive ? '700' : '500',
                          color: isActive ? proj.color : 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '130px',
                        }}
                      >
                        {proj.name}
                      </span>
                    )}
                  </div>

                  {(!isCollapsed || isMobile) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          background: 'var(--social-bg)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleMenuClick(e, proj.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          padding: '2px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '4px',
                        }}
                        title="Tùy chọn Project"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Dropdown Menu */}
                {isMenuOpen && (!isCollapsed || isMobile) && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '36px',
                      background: 'var(--panel-bg)',
                      border: '1.5px solid var(--panel-border)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-toolbar)',
                      padding: '6px',
                      zIndex: 100,
                      width: '140px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuProjectId(null);
                        onEditProject(proj);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--social-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Pencil size={13} />
                      <span>Đổi tên & màu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuProjectId(null);
                        onDeleteProject(proj);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--node-color-red)',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Trash2 size={13} />
                      <span>Xóa project</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Create Project Button at Bottom */}
        {(!isCollapsed || isMobile) && (
          <button
            type="button"
            onClick={onNewProject}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: '1.5px dashed var(--border-subtle)',
              color: 'var(--accent)',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.background = 'var(--accent-soft)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Plus size={15} />
            <span>Tạo Project Mới</span>
          </button>
        )}
      </div>
    </div>
  );

  // If Mobile, wrap in Drawer Modal overlay
  if (isMobile) {
    if (!isOpenMobile) return null;

    return (
      <div
        onClick={onCloseMobile}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(3px)',
          zIndex: 9999,
          display: 'flex',
        }}
      >
        <div onClick={(e) => e.stopPropagation()} style={{ height: '100%' }}>
          {sidebarContent}
        </div>
      </div>
    );
  }

  return sidebarContent;
};
