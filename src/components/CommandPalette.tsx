import { useEffect, useState, useRef, useCallback } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { useShallow } from 'zustand/react/shallow';
import { useReactFlow } from '@xyflow/react';
import type { MindMapNode } from '../types';
import { Search, MapPin } from 'lucide-react';

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const { setSelectedNodes, setEditingNodeId } = useMindMapStore(useShallow(state => ({
    setSelectedNodes: state.setSelectedNodes,
    setEditingNodeId: state.setEditingNodeId
  })));
  
  const nodes = useMindMapStore(state => state.nodes);
  
  const { setCenter } = useReactFlow();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter nodes based on search query
  const filteredNodes = nodes.filter(node => {
    if (node.hidden) return false;
    const labelMatch = node.data.label.toLowerCase().includes(query.toLowerCase());
    const tagsMatch = node.data.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
    return labelMatch || tagsMatch;
  });

  const handleOpen = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelectNode = useCallback((node: MindMapNode) => {
    handleClose();
    setSelectedNodes([node.id]);
    setEditingNodeId(node.id);
    setCenter(node.position.x + 100, node.position.y + 30, { duration: 800, zoom: 1.5 });
  }, [handleClose, setSelectedNodes, setEditingNodeId, setCenter]);

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpen]);

  // Handle keyboard navigation inside the palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredNodes.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredNodes.length > 0 && selectedIndex >= 0) {
          handleSelectNode(filteredNodes[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredNodes, selectedIndex, handleClose, handleSelectNode]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);



  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(2px)', zIndex: 1000
        }}
      />
      <div style={{
        position: 'fixed', top: '20vh', left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '600px', background: 'var(--panel-bg)',
        borderRadius: '12px', border: '1px solid var(--panel-border)',
        boxShadow: 'var(--shadow)', zIndex: 1001, display: 'flex', flexDirection: 'column',
        maxHeight: '60vh', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--panel-border)' }}>
          <Search size={20} color="var(--text-secondary)" style={{ marginRight: '12px' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search nodes by title or tags... (Esc to close)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              flex: 1, background: 'transparent', border: 'none', 
              color: 'var(--text-primary)', fontSize: '16px', outline: 'none'
            }}
          />
        </div>
        
        <div ref={listRef} style={{ overflowY: 'auto', padding: '8px' }}>
          {filteredNodes.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No nodes found for "{query}"
            </div>
          ) : (
            filteredNodes.map((node, index) => (
              <div
                key={node.id}
                onClick={() => handleSelectNode(node)}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  borderRadius: '8px', cursor: 'pointer',
                  background: index === selectedIndex ? 'var(--node-border-default)' : 'transparent',
                  color: 'var(--text-primary)'
                }}
              >
                <MapPin size={16} color="var(--accent)" />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: index === selectedIndex ? 'bold' : 'normal' }}>
                    {node.data.label}
                  </div>
                  {node.data.tags && node.data.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {node.data.tags.map(tag => (
                        <span key={tag} style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--node-bg-default)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {node.type}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
