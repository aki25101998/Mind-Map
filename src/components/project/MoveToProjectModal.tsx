import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FolderSymlink, Check, X, Folder, Layers } from 'lucide-react';
import type { Project } from '../../types';

export interface MoveToProjectModalProps {
  isOpen: boolean;
  mindMapTitle: string;
  currentProjectId?: string;
  projects: Project[];
  onSelectProject: (projectId: string | undefined) => Promise<void> | void;
  onClose: () => void;
}

export const MoveToProjectModal: React.FC<MoveToProjectModalProps> = ({
  isOpen,
  mindMapTitle,
  currentProjectId,
  projects,
  onSelectProject,
  onClose,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(currentProjectId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onSelectProject(selectedProjectId);
      onClose();
    } catch (err) {
      console.error('Failed to move mind map:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      onClick={isSubmitting ? undefined : onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
      }}
    >
      <div
        className="move-project-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--panel-bg)',
          borderRadius: 'var(--radius-2xl)',
          width: '100%',
          maxWidth: '440px',
          padding: '24px 26px',
          border: '1.5px solid var(--panel-border)',
          boxShadow: 'var(--shadow-toolbar)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'var(--accent-secondary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-secondary)',
              }}
            >
              <FolderSymlink size={19} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Chuyển sang Project
              </h2>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  maxWidth: '280px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Sơ đồ: <strong>{mindMapTitle}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Project Selection List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', marginBottom: '20px' }}>
          {/* Option: Unassigned / Chưa phân loại */}
          <div
            onClick={() => setSelectedProjectId(undefined)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              background: selectedProjectId === undefined ? 'var(--accent-soft)' : 'var(--canvas-bg)',
              border: selectedProjectId === undefined ? '1.5px solid var(--accent)' : '1px solid var(--border-subtle)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={18} color="var(--text-secondary)" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Chưa phân loại (Unassigned)
              </span>
            </div>
            {selectedProjectId === undefined && <Check size={16} color="var(--accent)" strokeWidth={3} />}
          </div>

          {/* User Projects */}
          {projects.map((proj) => {
            const isSelected = selectedProjectId === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  background: isSelected ? `${proj.color}18` : 'var(--canvas-bg)',
                  border: isSelected ? `1.5px solid ${proj.color}` : '1px solid var(--border-subtle)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Folder size={18} color={proj.color} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {proj.name}
                  </span>
                </div>
                {isSelected && <Check size={16} color={proj.color} strokeWidth={3} />}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '9px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: '1.5px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            style={{
              padding: '9px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-primary)',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: 'var(--accent-glow)',
            }}
          >
            {isSubmitting ? 'Đang chuyển...' : 'Xác Nhận Chuyển'}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
