import { useState, useRef, useEffect } from 'react';
import { useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { useMindMapStore } from '../store/useMindMapStore';
import { useAutoLayout } from '../hooks/useAutoLayout';
import { exportToJSON, exportToPNG, exportToSVG } from '../utils/exportUtils';
import { Undo, Redo, Download, Share2, Menu, LayoutTemplate, Image, FileJson, ChevronDown, Moon, Sun } from 'lucide-react';

interface TopToolbarProps {
  onMenuClick?: () => void;
}

export const TopToolbar = ({ onMenuClick }: TopToolbarProps) => {
  const { documentTitle, setTitle, undo, redo, syncStatus, nodes, edges, viewport, documentId, templateId, createdAt, updatedAt, theme, toggleTheme } = useMindMapStore();
  const handleAutoLayout = useAutoLayout();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(documentTitle);

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
      
      // Add padding
      const padding = 50;
      const width = nodesBounds.width + padding * 2;
      const height = nodesBounds.height + padding * 2;

      const transform = getViewportForBounds(
        nodesBounds,
        width,
        height,
        0.5,
        2,
        0
      );

      // Default background color based on theme
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim() || '#ffffff';

      if (format === 'png') {
        await exportToPNG(documentTitle, width, height, transform, bgColor);
      } else {
        await exportToSVG(documentTitle, width, height, transform, bgColor);
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export image.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{
      position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)', right: 'var(--space-4)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      zIndex: 'var(--z-toolbar)', pointerEvents: 'none'
    }}>
      <div style={{
        background: 'var(--panel-bg)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--panel-radius)',
        border: '1px solid var(--panel-border)', pointerEvents: 'auto',
        boxShadow: 'var(--shadow-toolbar)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)'
      }}>
        <button 
          onClick={onMenuClick}
          title="Open Document Sidebar"
          style={{ display: 'flex', alignItems: 'center', background: 'transparent', color: 'var(--text-secondary)', padding: 'var(--space-1)', cursor: 'pointer', border: 'none', borderRadius: 'var(--radius-sm)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Menu size={18} />
        </button>
        <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />
        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
          <button onClick={undo} style={{ padding: 'var(--space-1)', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', border: 'none' }} title="Undo (Ctrl+Z)" onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}><Undo size={16} /></button>
          <button onClick={redo} style={{ padding: 'var(--space-1)', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', border: 'none' }} title="Redo (Ctrl+Shift+Z)" onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}><Redo size={16} /></button>
        </div>
        <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />
        <div 
          onDoubleClick={() => setEditingTitle(true)}
          style={{ fontWeight: '500', minWidth: '150px', cursor: 'text', fontSize: '14px', color: 'var(--text-primary)' }}
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
      
      <div style={{
        background: 'var(--panel-bg)', padding: 'var(--space-2)', borderRadius: 'var(--panel-radius)',
        border: '1px solid var(--panel-border)', pointerEvents: 'auto',
        boxShadow: 'var(--shadow-toolbar)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '500', color: syncStatus === 'error' || syncStatus === 'offline' ? 'var(--node-color-red)' : 'var(--text-muted)', marginRight: 'var(--space-2)', paddingLeft: 'var(--space-2)' }}>
          {syncStatus === 'saving' ? 'Saving...' : syncStatus === 'error' ? 'Sync failed' : syncStatus === 'offline' ? 'Offline' : 'Saved'}
        </div>
        <button 
          onClick={toggleTheme}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button 
          onClick={handleAutoLayout}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LayoutTemplate size={14} /> Auto Layout
        </button>
        <div style={{ position: 'relative' }} ref={exportMenuRef}>
          <button 
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={isExporting}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
              borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)',
              opacity: isExporting ? 0.7 : 1, cursor: isExporting ? 'wait' : 'pointer', fontSize: '13px', fontWeight: '500'
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
              background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
              borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-toolbar)', padding: '8px',
              display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px', zIndex: 1000
            }}>
              <button 
                onClick={() => handleExportImage('png')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Image size={16} /> Download PNG
              </button>
              <button 
                onClick={() => handleExportImage('svg')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Image size={16} /> Download SVG
              </button>
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
              <button 
                onClick={handleExportJSON}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <FileJson size={16} /> Export JSON (Backup)
              </button>
            </div>
          )}
        </div>
        <button 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--radius-md)', background: 'var(--text-primary)', color: 'var(--panel-bg)', border: 'none', fontSize: '13px', fontWeight: '600' }}
          disabled title="Future functionality"
        >
          <Share2 size={14} /> Share
        </button>
      </div>
    </div>
  );
};
