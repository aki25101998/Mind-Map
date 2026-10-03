import React, { useState, useRef } from 'react';
import { 
  Type, Square, Circle, SquareAsterisk, Palette, Copy, Trash2, Plus, ArrowRight, ALargeSmall, Minus,
  Lock, Unlock, Bold, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Check, X,
  FileText, Tag
} from 'lucide-react';
import { useMindMapStore } from '../store/useMindMapStore';
import { useShallow } from 'zustand/react/shallow';

let persistedPosition: { x: number; y: number } | null = null;

interface FloatingToolbarProps {
  nodeId: string;
}

export const FloatingToolbar = ({ nodeId }: FloatingToolbarProps) => {
  const { 
    updateNodeData,
    updateNodeType,
    duplicateSelected, 
    deleteSelected, 
    createChildNode, 
    createSiblingNode,
    updateOutgoingEdges
  } = useMindMapStore(useShallow(state => ({
    updateNodeData: state.updateNodeData,
    updateNodeType: state.updateNodeType,
    duplicateSelected: state.duplicateSelected,
    deleteSelected: state.deleteSelected,
    createChildNode: state.createChildNode,
    createSiblingNode: state.createSiblingNode,
    updateOutgoingEdges: state.updateOutgoingEdges
  })));

  const node = useMindMapStore(state => state.nodes.find(n => n.id === nodeId));

  const [position, setPosition] = useState<{ x: number, y: number }>(() => {
    if (persistedPosition) return persistedPosition;
    return { x: window.innerWidth / 2, y: 100 };
  });

  const [isUrlOpen, setIsUrlOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  const [isTagOpen, setIsTagOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const toolbarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  if (!node) return null;

  const isMain = node.type === 'main';
  const isLocked = !!node.data?.locked;
  const isBold = node.data?.fontWeight === 'bold' || node.data?.fontWeight === 700;
  const textAlign = (node.data?.textAlign as 'left' | 'center' | 'right') || 'center';

  const handleColorChange = (color: string) => {
    updateNodeData(nodeId, { backgroundColor: color });
  };

  const handleShapeChange = (shape: 'rectangle' | 'rounded' | 'ellipse' | 'text') => {
    const typeMap = { rectangle: 'basic', rounded: 'rounded', ellipse: 'ellipse', text: 'text' } as const;
    updateNodeType(nodeId, typeMap[shape] || 'basic');
    updateNodeData(nodeId, { shape });
  };

  const handleFontSizeChange = (size: number) => {
    updateNodeData(nodeId, { fontSize: size });
  };

  const toggleBold = () => {
    updateNodeData(nodeId, { fontWeight: isBold ? 500 : 'bold' });
  };

  const handleAlign = (align: 'left' | 'center' | 'right') => {
    updateNodeData(nodeId, { textAlign: align });
  };

  const toggleLock = () => {
    updateNodeData(nodeId, { locked: !isLocked });
  };

  const toggleDashedEdge = () => {
    const isCurrentlyDashed = node?.data?.dashedEdges ?? false;
    updateNodeData(nodeId, { dashedEdges: !isCurrentlyDashed });
    updateOutgoingEdges(nodeId, { dashed: !isCurrentlyDashed });
  };

  const handleOpenUrl = () => {
    setUrlInput(node.data?.url || '');
    setIsUrlOpen(!isUrlOpen);
    setIsNoteOpen(false);
    setIsTagOpen(false);
  };

  const handleSaveUrl = () => {
    updateNodeData(nodeId, { url: urlInput.trim() || undefined });
    setIsUrlOpen(false);
  };

  const handleOpenNote = () => {
    setNoteInput((node.data?.note as string) || '');
    setIsNoteOpen(!isNoteOpen);
    setIsUrlOpen(false);
    setIsTagOpen(false);
  };

  const handleSaveNote = () => {
    updateNodeData(nodeId, { note: noteInput.trim() || undefined });
    setIsNoteOpen(false);
  };

  const handleDeleteNote = () => {
    updateNodeData(nodeId, { note: undefined });
    setNoteInput('');
    setIsNoteOpen(false);
  };

  const handleOpenTag = () => {
    setTagInput('');
    setIsTagOpen(!isTagOpen);
    setIsUrlOpen(false);
    setIsNoteOpen(false);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#+/, '');
    if (!trimmed) return;
    const currentTags = (node.data?.tags as string[]) || [];
    if (!currentTags.includes(trimmed)) {
      updateNodeData(nodeId, { tags: [...currentTags, trimmed] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = (node.data?.tags as string[]) || [];
    const nextTags = currentTags.filter(t => t !== tagToRemove);
    updateNodeData(nodeId, { tags: nextTags.length > 0 ? nextTags : undefined });
  };

  const buttonStyle: React.CSSProperties = {
    padding: '7px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition-fast)',
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    if (toolbarRef.current) {
      toolbarRef.current.setPointerCapture(e.pointerId);
    }
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const newPos = {
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    };
    setPosition(newPos);
    persistedPosition = newPos;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    if (toolbarRef.current) {
      toolbarRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const vibrantSwatches = [
    '#f97316', '#06b6d4', '#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'
  ];

  return (
    <div 
      ref={toolbarRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate(calc(${position.x}px - 50%), ${position.y}px)`,
        background: 'var(--panel-bg)',
        border: '1.5px solid var(--panel-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '6px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        boxShadow: 'var(--shadow-toolbar)',
        zIndex: 1000,
        pointerEvents: 'auto',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Colors */}
        <div style={{ display: 'flex', gap: '6px', borderRight: '1.5px solid var(--border-subtle)', paddingRight: '8px', alignItems: 'center' }}>
          <Palette size={15} style={{ color: 'var(--accent)' }} />
          {vibrantSwatches.map(color => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: color,
                border: '2px solid var(--panel-bg)',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'transform var(--transition-fast)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              title="Set color"
            />
          ))}
        </div>

        {/* Shapes */}
        <div style={{ display: 'flex', gap: '3px', borderRight: '1.5px solid var(--border-subtle)', paddingRight: '6px' }}>
          <button 
            style={buttonStyle} 
            onClick={() => handleShapeChange('rectangle')} 
            title="Rectangle"
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Square size={15} />
          </button>
          <button 
            style={buttonStyle} 
            onClick={() => handleShapeChange('rounded')} 
            title="Rounded"
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <SquareAsterisk size={15} />
          </button>
          <button 
            style={buttonStyle} 
            onClick={() => handleShapeChange('ellipse')} 
            title="Ellipse"
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Circle size={15} />
          </button>
          <button 
            style={buttonStyle} 
            onClick={() => handleShapeChange('text')} 
            title="Text"
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Type size={15} />
          </button>
        </div>

        {/* Typography & Formatting */}
        <div style={{ display: 'flex', gap: '3px', borderRight: '1.5px solid var(--border-subtle)', paddingRight: '6px' }}>
          <button 
            style={buttonStyle} 
            onClick={() => handleFontSizeChange(12)} 
            title="Small Text"
          >
            <ALargeSmall size={14} />
          </button>
          <button 
            style={buttonStyle} 
            onClick={() => handleFontSizeChange(14)} 
            title="Medium Text"
          >
            <ALargeSmall size={16} />
          </button>
          <button 
            style={buttonStyle} 
            onClick={() => handleFontSizeChange(18)} 
            title="Large Text"
          >
            <ALargeSmall size={18} />
          </button>
          <button 
            style={{ ...buttonStyle, background: isBold ? 'var(--social-bg)' : 'transparent', color: isBold ? 'var(--accent)' : 'var(--text-secondary)' }} 
            onClick={toggleBold} 
            title="Toggle Bold"
          >
            <Bold size={14} />
          </button>
          <button 
            style={{ ...buttonStyle, color: textAlign === 'left' ? 'var(--accent)' : 'var(--text-secondary)' }} 
            onClick={() => handleAlign('left')} 
            title="Align Left"
          >
            <AlignLeft size={14} />
          </button>
          <button 
            style={{ ...buttonStyle, color: textAlign === 'center' ? 'var(--accent)' : 'var(--text-secondary)' }} 
            onClick={() => handleAlign('center')} 
            title="Align Center"
          >
            <AlignCenter size={14} />
          </button>
          <button 
            style={{ ...buttonStyle, color: textAlign === 'right' ? 'var(--accent)' : 'var(--text-secondary)' }} 
            onClick={() => handleAlign('right')} 
            title="Align Right"
          >
            <AlignRight size={14} />
          </button>
        </div>

        {/* URL, Note, Tags, Outgoing Edge, Lock */}
        <div style={{ display: 'flex', gap: '3px', borderRight: '1.5px solid var(--border-subtle)', paddingRight: '6px' }}>
          <button 
            style={{ ...buttonStyle, background: node.data?.url ? 'var(--accent-secondary-soft)' : 'transparent', color: node.data?.url ? 'var(--accent-secondary)' : 'var(--text-secondary)' }} 
            onClick={handleOpenUrl} 
            title={node.data?.url ? `Link: ${node.data.url}` : "Add Link (URL)"}
          >
            <LinkIcon size={14} />
          </button>
          <button 
            style={{ ...buttonStyle, background: node.data?.note ? 'var(--accent-soft)' : 'transparent', color: node.data?.note ? 'var(--accent)' : 'var(--text-secondary)' }} 
            onClick={handleOpenNote} 
            title={node.data?.note ? `Note: ${node.data.note}` : "Add Note"}
          >
            <FileText size={14} />
          </button>
          <button 
            style={{ ...buttonStyle, background: (node.data?.tags || []).length > 0 ? 'var(--accent-secondary-soft)' : 'transparent', color: (node.data?.tags || []).length > 0 ? 'var(--accent-secondary)' : 'var(--text-secondary)' }} 
            onClick={handleOpenTag} 
            title={(node.data?.tags || []).length > 0 ? `Tags: ${(node.data?.tags || []).join(', ')}` : "Add Tags"}
          >
            <Tag size={14} />
          </button>
          <button 
            style={{ ...buttonStyle, background: node?.data?.dashedEdges ? 'var(--accent-secondary-soft)' : 'transparent', color: node?.data?.dashedEdges ? 'var(--accent-secondary)' : 'var(--text-secondary)' }} 
            onClick={toggleDashedEdge} 
            title="Toggle Dashed Edge"
          >
            <Minus size={15} style={{ strokeDasharray: '3 3' }} />
          </button>
          <button 
            style={{ ...buttonStyle, color: isLocked ? 'var(--node-color-red)' : 'var(--text-secondary)', background: isLocked ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }} 
            onClick={toggleLock} 
            title={isLocked ? "Unlock Node Position" : "Lock Node Position"}
          >
            {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '3px' }}>
          {!isMain && (
            <button 
              style={buttonStyle} 
              onClick={() => createSiblingNode(nodeId)} 
              title="Add Sibling (Enter)"
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <ArrowRight size={15} />
            </button>
          )}
          <button 
            style={buttonStyle} 
            onClick={() => createChildNode(nodeId)} 
            title="Add Child (Tab)"
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Plus size={15} />
          </button>
          <button 
            style={buttonStyle} 
            onClick={duplicateSelected} 
            title="Duplicate (Ctrl+D)"
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--social-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Copy size={15} />
          </button>
          {!isMain && (
            <button 
              style={{ ...buttonStyle, color: 'var(--node-color-red)' }} 
              onClick={deleteSelected} 
              title="Delete"
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* URL Popover Input */}
      {isUrlOpen && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          background: 'var(--social-bg)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          marginTop: '2px'
        }}>
          <LinkIcon size={14} color="var(--accent-secondary)" />
          <input 
            type="url"
            autoFocus
            placeholder="https://example.com"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveUrl();
              if (e.key === 'Escape') setIsUrlOpen(false);
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              color: 'var(--text-primary)'
            }}
          />
          <button 
            onClick={handleSaveUrl}
            style={{ ...buttonStyle, padding: '4px', color: 'var(--accent)' }}
            title="Save URL"
          >
            <Check size={14} />
          </button>
          <button 
            onClick={() => setIsUrlOpen(false)}
            style={{ ...buttonStyle, padding: '4px' }}
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Note Popover Panel */}
      {isNoteOpen && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '10px 12px',
          background: 'var(--panel-bg)',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--panel-border)',
          boxShadow: 'var(--shadow-md)',
          marginTop: '4px',
          minWidth: '280px',
          maxWidth: '380px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
              <FileText size={14} color="var(--accent)" /> Node Note
            </div>
            <button onClick={() => setIsNoteOpen(false)} style={{ ...buttonStyle, padding: '2px' }}>
              <X size={13} />
            </button>
          </div>
          <textarea
            autoFocus
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Add note, thoughts, or details for this node..."
            rows={3}
            style={{
              width: '100%',
              background: 'var(--social-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              padding: '6px 8px',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            {node.data?.note && (
              <button
                onClick={handleDeleteNote}
                style={{ ...buttonStyle, color: 'var(--node-color-red)', fontSize: '11px', fontWeight: '600', padding: '4px 8px' }}
                title="Remove note"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleSaveNote}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius-sm)', padding: '5px 12px',
                fontSize: '11px', fontWeight: '700', cursor: 'pointer'
              }}
            >
              <Check size={12} /> Save Note
            </button>
          </div>
        </div>
      )}

      {/* Tags Popover Panel */}
      {isTagOpen && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '10px 12px',
          background: 'var(--panel-bg)',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--panel-border)',
          boxShadow: 'var(--shadow-md)',
          marginTop: '4px',
          minWidth: '280px',
          maxWidth: '380px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
              <Tag size={14} color="var(--accent-secondary)" /> Manage Tags
            </div>
            <button onClick={() => setIsTagOpen(false)} style={{ ...buttonStyle, padding: '2px' }}>
              <X size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', minHeight: '22px' }}>
            {(node.data?.tags || []).length > 0 ? (
              (node.data?.tags || []).map(tag => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: '600', color: 'var(--accent-secondary)',
                    background: 'var(--accent-secondary-soft)', border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: 'var(--radius-pill)', padding: '2px 8px'
                  }}
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    title={`Remove #${tag}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No tags attached yet</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              autoFocus
              placeholder="Tag name (e.g. urgent, plan)..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag();
                if (e.key === 'Escape') setIsTagOpen(false);
              }}
              style={{
                flex: 1,
                background: 'var(--social-bg)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                padding: '5px 8px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleAddTag}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'var(--accent-secondary)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius-sm)', padding: '5px 12px',
                fontSize: '11px', fontWeight: '700', cursor: 'pointer'
              }}
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
