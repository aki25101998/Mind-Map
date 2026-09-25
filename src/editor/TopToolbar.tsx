import { useState, useRef, useEffect } from 'react';
import { useReactFlow, getNodesBounds } from '@xyflow/react';
import { useMindMapStore } from '../store/useMindMapStore';
import { useAutoLayout } from '../hooks/useAutoLayout';
import { exportToJSON, exportToPNG, exportToSVG } from '../utils/exportUtils';
import { Undo, Redo, Download, Share2, Menu, LayoutTemplate, Image, FileJson, ChevronDown, Moon, Sun } from 'lucide-react';
import { ShareModal } from './ShareModal';

interface TopToolbarProps {
  onMenuClick?: () => void;
}

export const TopToolbar = ({ onMenuClick }: TopToolbarProps) => {
  const { 
    documentTitle, 
    setTitle, 
    undo, 
    redo, 
    history,
    historyIndex,
    syncStatus, 
    nodes, 
    edges, 
    viewport, 
    documentId, 
    templateId, 
    createdAt, 
    updatedAt, 
    theme, 
    toggleTheme 
  } = useMindMapStore();
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const handleAutoLayout = useAutoLayout();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(documentTitle);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleTitleSubmit = () => {
    setEditingTitle(false);
    if (titleInput.trim()) {
      setTitle(titleInput);
    } else {
      setTitleInput(documentTitle);
    }
  };

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  const { getNodes } = useReactFlow();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportJSON = () => {
    if (!documentId) return;
    exportToJSON({ id: documentId, title: documentTitle, nodes, edges, viewport, templateId, createdAt, updatedAt });
    setIsExportMenuOpen(false);
  };

  const handleExportImage = async (format: 'png' | 'svg') => {
    setIsExporting(true);
    setIsExportMenuOpen(false);
    
    try {
      const nodesData = getNodes();
      if (nodesData.length === 0) return;

      const nodesBounds = getNodesBounds(nodesData);
      
      const padding = 50;
      const width = nodesBounds.width + padding * 2;
      const height = nodesBounds.height + padding * 2;
      
      const imageViewport = {
        x: -nodesBounds.x + padding,
        y: -nodesBounds.y + padding,
        zoom: 1
      };

      if (format === 'png') {
        await exportToPNG(documentTitle, width, height, imageViewport);
      } else {
        await exportToSVG(documentTitle, width, height, imageViewport);
      }
    } catch (error) {
      console.error(`Export to ${format.toUpperCase()} failed:`, error);
    } finally {
      setIsExporting(false);
    }
  };

  const getSyncDotColor = () => {
    if (syncStatus === 'saving') return '#f59e0b';
    if (syncStatus === 'error') return '#ef4444';
    if (syncStatus === 'offline') return '#94a3b8';
    return '#10b981';
  };

  return (
    <div style={{
      position: 'absolute', top: '16px', left: '16px', right: '16px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      zIndex: 'var(--z-toolbar)', pointerEvents: 'none'
    }}>
      {/* Left Dock: Menu, Undo/Redo, Title */}
      <div style={{
        background: 'var(--panel-bg)',
        padding: '6px 14px',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--panel-border)',
        pointerEvents: 'auto',
        boxShadow: 'var(--shadow-toolbar)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all var(--transition-fast)'
      }}>
        <button 
          onClick={onMenuClick}
          title="Open Document Sidebar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            color: 'var(--text-secondary)',
            padding: '6px',
            cursor: 'pointer',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Menu size={18} />
        </button>

        <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            onClick={undo} 
            disabled={!canUndo}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: canUndo ? 'var(--text-secondary)' : 'var(--text-muted)',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              opacity: canUndo ? 1 : 0.35,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)'
            }} 
            title={canUndo ? "Undo (Ctrl+Z)" : "Cannot Undo"}
            onMouseEnter={e => { if (canUndo) { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; } }} 
            onMouseLeave={e => { if (canUndo) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
          >
            <Undo size={16} />
          </button>
          <button 
            onClick={redo} 
            disabled={!canRedo}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: canRedo ? 'var(--text-secondary)' : 'var(--text-muted)',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              opacity: canRedo ? 1 : 0.35,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)'
            }} 
            title={canRedo ? "Redo (Ctrl+Shift+Z)" : "Cannot Redo"}
            onMouseEnter={e => { if (canRedo) { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; } }} 
            onMouseLeave={e => { if (canRedo) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
          >
            <Redo size={16} />
          </button>
        </div>

        <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />

        {/* Editable Title Bubble */}
        <div 
          onDoubleClick={() => setEditingTitle(true)}
          style={{
            fontWeight: '600',
            minWidth: '160px',
            cursor: 'text',
            fontSize: '14px',
            color: 'var(--text-primary)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--social-bg)',
            border: '1px solid transparent',
            transition: 'border-color var(--transition-fast)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-secondary-border)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
          title="Double click to rename"
        >
          {editingTitle ? (
            <input 
              autoFocus
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={e => e.key === 'Enter' && handleTitleSubmit()}
              style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 'inherit', outline: 'none', width: '100%', padding: 0 }}
            />
          ) : (
            documentTitle
          )}
        </div>
      </div>
      
      {/* Right Dock: Status, Theme, Layout, Export, Share */}
      <div style={{
        background: 'var(--panel-bg)',
        padding: '6px 12px',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--panel-border)',
        pointerEvents: 'auto',
        boxShadow: 'var(--shadow-toolbar)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        {/* Sync Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--text-secondary)',
          padding: '4px 8px',
          background: 'var(--social-bg)',
          borderRadius: 'var(--radius-pill)',
          marginRight: '4px'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: getSyncDotColor(),
            boxShadow: `0 0 6px ${getSyncDotColor()}`
          }} />
          {syncStatus === 'saving' ? 'Saving...' : syncStatus === 'error' ? 'Sync failed' : syncStatus === 'offline' ? 'Offline' : 'Saved'}
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '7px',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--social-bg)';
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={15} color="var(--accent)" /> : <Moon size={15} color="var(--accent-secondary)" />}
        </button>

        {/* Auto Layout */}
        <button 
          onClick={handleAutoLayout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--social-bg)';
            e.currentTarget.style.borderColor = 'var(--accent-secondary-border)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <LayoutTemplate size={14} color="var(--accent-secondary)" /> Auto Layout
        </button>

        {/* Export Dropdown */}
        <div style={{ position: 'relative' }} ref={exportMenuRef}>
          <button 
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={isExporting}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px', 
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              opacity: isExporting ? 0.7 : 1,
              cursor: isExporting ? 'wait' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={e => !isExporting && (e.currentTarget.style.background = 'var(--social-bg)')}
            onMouseLeave={e => !isExporting && (e.currentTarget.style.background = 'transparent')}
          >
            <Download size={14} /> 
            {isExporting ? 'Exporting...' : 'Export'}
            <ChevronDown size={14} />
          </button>
          
          {isExportMenuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              background: 'var(--panel-bg)', border: '1.5px solid var(--panel-border)',
              borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-toolbar)', padding: '8px',
              display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '190px', zIndex: 1000
            }}>
              <button 
                onClick={() => handleExportImage('png')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                  background: 'transparent', border: 'none', color: 'var(--text-primary)',
                  cursor: 'pointer', textAlign: 'left', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '500'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Image size={16} color="var(--accent-secondary)" /> Download PNG
              </button>
              <button 
                onClick={() => handleExportImage('svg')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                  background: 'transparent', border: 'none', color: 'var(--text-primary)',
                  cursor: 'pointer', textAlign: 'left', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '500'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Image size={16} color="var(--accent)" /> Download SVG
              </button>
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
              <button 
                onClick={handleExportJSON}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                  background: 'transparent', border: 'none', color: 'var(--text-primary)',
                  cursor: 'pointer', textAlign: 'left', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '500'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <FileJson size={16} color="#10b981" /> Export JSON (Backup)
              </button>
            </div>
          )}
        </div>

        {/* Share Button (Sunset Orange Gradient CTA) */}
        <button 
          onClick={() => setIsShareModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-primary)',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: 'var(--accent-glow)',
            transition: 'transform var(--transition-bounce)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          title="Share Mind Map"
        >
          <Share2 size={14} /> Share
        </button>
      </div>
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
    </div>
  );
};
