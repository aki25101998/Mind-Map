import React, { useState, useRef, useEffect } from 'react';
import { Lock, ExternalLink, FileText, Plus, Minus, X, Edit3, Check } from 'lucide-react';
import type { NodeData } from '../../types';
import { useMindMapStore } from '../../store/useMindMapStore';

interface NodeDecorationsProps {
  data: NodeData;
  isEditing?: boolean;
  nodeId?: string;
}

export const NodeBadges: React.FC<NodeDecorationsProps> = ({ data, nodeId }) => {
  const [isNoteViewerOpen, setIsNoteViewerOpen] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const updateNodeData = useMindMapStore(state => state.updateNodeData);
  const setSelectedNodes = useMindMapStore(state => state.setSelectedNodes);

  useEffect(() => {
    if (!isNoteViewerOpen) return;
    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsNoteViewerOpen(false);
        setIsEditingNote(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isNoteViewerOpen]);

  return (
    <>
      {data.locked && (
        <span
          title="Node position is locked"
          style={{
            position: 'absolute',
            top: '-7px',
            left: '-7px',
            background: 'var(--panel-bg)',
            borderRadius: '50%',
            padding: '2px',
            border: '1px solid var(--panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 10
          }}
        >
          <Lock size={10} color="var(--node-color-red)" />
        </span>
      )}

      {data.url && (
        <a
          href={String(data.url).startsWith('http') ? String(data.url) : `https://${data.url}`}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open URL: ${data.url}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '-7px',
            right: '-7px',
            background: 'var(--panel-bg)',
            borderRadius: '50%',
            padding: '2px',
            border: '1px solid var(--panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--accent-secondary)',
            zIndex: 10
          }}
        >
          <ExternalLink size={10} />
        </a>
      )}

      {data.note && (
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="nodrag nopan"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (nodeId) {
                setSelectedNodes([nodeId]);
              }
              setNoteDraft(data.note || '');
              setIsNoteViewerOpen(prev => !prev);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Nhấp để xem ghi chú"
            style={{
              position: 'absolute',
              bottom: '-8px',
              right: '-8px',
              background: 'var(--panel-bg)',
              borderRadius: '50%',
              padding: '3px',
              border: '1.5px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              color: 'var(--accent)',
              zIndex: 20,
              cursor: 'pointer',
              transition: 'transform var(--transition-fast)',
              width: '18px',
              height: '18px',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <FileText size={11} />
          </button>

          {isNoteViewerOpen && (
            <div
              ref={popoverRef}
              className="nodrag nopan"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '12px',
                right: '-8px',
                minWidth: '260px',
                maxWidth: '340px',
                background: 'var(--panel-bg)',
                border: '1.5px solid var(--panel-border)',
                borderRadius: 'var(--radius-lg, 12px)',
                boxShadow: 'var(--shadow-xl, 0 12px 30px rgba(0,0,0,0.35))',
                padding: '12px 14px',
                zIndex: 1000,
                cursor: 'default',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                pointerEvents: 'auto',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <FileText size={14} color="var(--accent)" /> Ghi chú (Note)
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNoteViewerOpen(false);
                    setIsEditingNote(false);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-sm)'
                  }}
                  title="Đóng"
                >
                  <X size={14} />
                </button>
              </div>

              {!isEditingNote ? (
                <>
                  <div style={{
                    fontSize: '12px',
                    lineHeight: '1.5',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    background: 'var(--social-bg)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {data.note}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    {nodeId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateNodeData(nodeId, { note: undefined });
                          setIsNoteViewerOpen(false);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--node-color-red, #ef4444)',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '4px 8px',
                          cursor: 'pointer',
                          borderRadius: 'var(--radius-sm)'
                        }}
                        title="Xóa ghi chú này"
                      >
                        Xóa
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoteDraft(data.note || '');
                        setIsEditingNote(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={12} /> Sửa
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <textarea
                    autoFocus
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingNote(false);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        padding: '4px 8px',
                        cursor: 'pointer'
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const trimmed = noteDraft.trim();
                        if (nodeId) {
                          updateNodeData(nodeId, { note: trimmed || undefined });
                        }
                        setIsEditingNote(false);
                        if (!trimmed) {
                          setIsNoteViewerOpen(false);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Check size={12} /> Lưu
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export const NodeTags: React.FC<NodeDecorationsProps> = ({ data, isEditing }) => {
  if (isEditing || !data.tags || data.tags.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        justifyContent: (data.textAlign as 'left' | 'center' | 'right') === 'left' ? 'flex-start' : (data.textAlign as 'left' | 'center' | 'right') === 'right' ? 'flex-end' : 'center',
        marginTop: '6px'
      }}
    >
      {data.tags.map((tag) => (
        <span
          key={tag}
          style={{
            fontSize: '10px',
            lineHeight: '1.2',
            padding: '1px 6px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--accent-secondary-soft)',
            color: 'var(--accent-secondary)',
            fontWeight: '600',
            letterSpacing: '0.02em',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            userSelect: 'none'
          }}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
};

export interface NodeCollapseButtonProps {
  id: string;
  hasChildren: boolean;
  isEditing?: boolean;
  collapsed?: boolean;
  layoutSide?: 'left' | 'right' | 'center';
  onToggle: (id: string) => void;
}

export const NodeCollapseButton: React.FC<NodeCollapseButtonProps> = ({
  id,
  hasChildren,
  isEditing,
  collapsed,
  layoutSide,
  onToggle,
}) => {
  if (!hasChildren || isEditing) return null;

  const isLeft = layoutSide === 'left';

  return (
    <button
      type="button"
      className={`nodrag nopan node-collapse-btn ${isLeft ? 'is-left' : 'is-right'}`}
      aria-label={collapsed ? 'Expand branch' : 'Collapse branch'}
      title={collapsed ? 'Expand branch' : 'Collapse branch'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(id);
      }}
    >
      {collapsed ? <Plus size={11} strokeWidth={2.5} /> : <Minus size={11} strokeWidth={2.5} />}
    </button>
  );
};
