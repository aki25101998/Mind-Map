import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, ShieldCheck } from 'lucide-react';
import type { Project } from '../../types';

export interface DeleteProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  containedMapCount: number;
  onConfirm: (deleteContainedMaps: boolean) => Promise<void> | void;
  onClose: () => void;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  project,
  containedMapCount,
  onConfirm,
  onClose,
}) => {
  const [deleteContainedMaps, setDeleteContainedMaps] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !project) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(deleteContainedMaps);
      onClose();
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      onClick={isDeleting ? undefined : onClose}
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
        className="delete-project-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--panel-bg)',
          borderRadius: 'var(--radius-2xl)',
          width: '100%',
          maxWidth: '460px',
          padding: '24px 28px',
          border: '1.5px solid var(--panel-border)',
          boxShadow: 'var(--shadow-toolbar)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--node-color-red)',
                flexShrink: 0,
              }}
            >
              <Trash2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Xóa Project "{project.name}"?
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Options */}
        {containedMapCount > 0 ? (
          <div style={{ marginBottom: '22px' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              Project này hiện có <strong>{containedMapCount} sơ đồ tư duy</strong> bên trong. Bạn muốn xử lý các sơ đồ này như thế nào?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Option 1: Keep Maps (Recommended) */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-lg)',
                  background: !deleteContainedMaps ? 'var(--accent-soft)' : 'var(--canvas-bg)',
                  border: !deleteContainedMaps ? '1.5px solid var(--accent)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <input
                  type="radio"
                  name="deleteAction"
                  checked={!deleteContainedMaps}
                  onChange={() => setDeleteContainedMaps(false)}
                  style={{ marginTop: '3px', accentColor: 'var(--accent)' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    <ShieldCheck size={16} color="var(--accent)" />
                    Giữ lại các sơ đồ (Khuyên dùng)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Chỉ xóa thư mục Project. {containedMapCount} sơ đồ sẽ được chuyển an toàn về mục "Chưa phân loại".
                  </div>
                </div>
              </label>

              {/* Option 2: Delete All Maps */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-lg)',
                  background: deleteContainedMaps ? 'rgba(239, 68, 68, 0.1)' : 'var(--canvas-bg)',
                  border: deleteContainedMaps ? '1.5px solid var(--node-color-red)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <input
                  type="radio"
                  name="deleteAction"
                  checked={deleteContainedMaps}
                  onChange={() => setDeleteContainedMaps(true)}
                  style={{ marginTop: '3px', accentColor: 'var(--node-color-red)' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: '700', color: 'var(--node-color-red)' }}>
                    <AlertTriangle size={16} />
                    Xóa vĩnh viễn toàn bộ sơ đồ
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Xóa Project cùng toàn bộ {containedMapCount} sơ đồ bên trong khỏi bộ nhớ thiết bị và Cloud.
                  </div>
                </div>
              </label>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
            Bạn có chắc chắn muốn xóa Project này không?
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: '1.5px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            style={{
              padding: '9px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--node-color-red)',
              border: 'none',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.28)',
            }}
          >
            {isDeleting ? 'Đang xóa...' : 'Xác Nhận Xóa'}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
