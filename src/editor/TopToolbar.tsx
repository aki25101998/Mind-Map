import { useState, useRef, useEffect } from 'react';
import { useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { useMindMapStore } from '../store/useMindMapStore';
import { exportToJSON, exportToPNG, exportToSVG } from '../utils/exportUtils';
import { Undo, Redo, Download, Share2, Menu, LayoutTemplate, Image, FileJson, ChevronDown } from 'lucide-react';

interface TopToolbarProps {
  onMenuClick?: () => void;
}

export const TopToolbar = ({ onMenuClick }: TopToolbarProps) => {
  const { documentTitle, setTitle, undo, redo, syncStatus, nodes, edges, viewport, documentId, templateId, createdAt, updatedAt, autoLayout } = useMindMapStore();
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
  
  const { getNodes, fitView } = useReactFlow();

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
      position: 'absolute', top: '16px', left: '16px', right: '16px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      zIndex: 'var(--z-toolbar)', pointerEvents: 'none'
    }}>
      <div style={{
        background: 'var(--panel-bg)', padding: '8px 16px', borderRadius: 'var(--panel-radius)',
        border: '1px solid var(--panel-border)', pointerEvents: 'auto',
        boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <button 
          onClick={onMenuClick}
          title="Open Document Sidebar"
          style={{ display: 'flex', alignItems: 'center', background: 'transparent', color: 'var(--text-primary)', padding: 0, cursor: 'pointer', border: 'none' }}
        >
          <Menu size={20} />
        </button>
        <div style={{ width: '1px', height: '20px', background: 'var(--panel-border)' }} />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={undo} style={{ padding: '6px', borderRadius: '6px', background: 'transparent', color: 'var(--text-primary)' }} title="Undo (Ctrl+Z)"><Undo size={18} /></button>
          <button onClick={redo} style={{ padding: '6px', borderRadius: '6px', background: 'transparent', color: 'var(--text-primary)' }} title="Redo (Ctrl+Shift+Z)"><Redo size={18} /></button>
        </div>
        <div style={{ width: '1px', height: '20px', background: 'var(--panel-border)' }} />
        <div 
          onDoubleClick={() => setEditingTitle(true)}
          style={{ fontWeight: '600', minWidth: '150px', cursor: 'text' }}
        >
          {editingTitle ? (
            <input 
              autoFocus
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={e => e.key === 'Enter' && handleTitleSubmit()}
              style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 'inherit', outline: 'none' }}
            />
          ) : (
            documentTitle
          )}
        </div>
      </div>
      
      <div style={{
        background: 'var(--panel-bg)', padding: '8px', borderRadius: 'var(--panel-radius)',
        border: '1px solid var(--panel-border)', pointerEvents: 'auto',
        boxShadow: 'var(--shadow)', display: 'flex', gap: '8px', alignItems: 'center'
      }}>
        <div style={{ fontSize: '12px', color: syncStatus === 'error' || syncStatus === 'offline' ? 'var(--node-color-red)' : 'var(--text-secondary)', marginRight: '8px' }}>
          {syncStatus === 'saving' ? 'Saving...' : syncStatus === 'error' ? 'Sync failed' : syncStatus === 'offline' ? 'Offline' : 'Saved'}
        </div>
        <button 
          onClick={() => {
            autoLayout();
            window.requestAnimationFrame(() => {
              fitView({ duration: 300, padding: 0.2 });
            });
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: 'var(--node-bg-default)', color: 'var(--text-primary)' }}
        >
          <LayoutTemplate size={16} /> Auto Layout
        </button>
        <div style={{ position: 'relative' }} ref={exportMenuRef}>
          <button 
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={isExporting}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
              borderRadius: '6px', background: 'var(--node-bg-default)', color: 'var(--text-primary)',
              opacity: isExporting ? 0.7 : 1, cursor: isExporting ? 'wait' : 'pointer'
            }}
          >
            <Download size={16} /> 
            {isExporting ? 'Exporting...' : 'Export'}
            <ChevronDown size={14} />
          </button>
          
          {isExportMenuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
              borderRadius: '8px', boxShadow: 'var(--shadow)', padding: '8px',
              display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px', zIndex: 1000
            }}>
              <button 
                onClick={() => handleExportImage('png')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', borderRadius: '4px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Image size={16} /> Download PNG
              </button>
              <button 
                onClick={() => handleExportImage('svg')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', borderRadius: '4px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Image size={16} /> Download SVG
              </button>
              <div style={{ height: '1px', background: 'var(--panel-border)', margin: '4px 0' }} />
              <button 
                onClick={handleExportJSON}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', borderRadius: '4px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <FileJson size={16} /> Export JSON (Backup)
              </button>
            </div>
          )}
        </div>
        <button 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: 'var(--accent)', color: '#fff', border: 'none' }}
          disabled title="Future functionality"
        >
          <Share2 size={16} /> Share
        </button>
      </div>
    </div>
  );
};
