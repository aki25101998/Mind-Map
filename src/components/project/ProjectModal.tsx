import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FolderPlus, Pencil, X, Check } from 'lucide-react';
import type { Project } from '../../types';

export interface ProjectModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  project?: Project | null;
  onSave: (data: { name: string; color: string; description?: string }) => Promise<void> | void;
  onClose: () => void;
}

const PRESET_COLORS = [
  { label: 'Sunset Orange', color: '#f97316' },
  { label: 'Emerald Green', color: '#10b981' },
  { label: 'Sky Blue', color: '#0284c7' },
  { label: 'Royal Violet', color: '#8b5cf6' },
  { label: 'Rose Pink', color: '#f43f5e' },
  { label: 'Warm Amber', color: '#f59e0b' },
  { label: 'Electric Cyan', color: '#06b6d4' },
  { label: 'Indigo', color: '#6366f1' },
];

interface ProjectModalFormProps {
  mode: 'create' | 'edit';
  initialName: string;
  initialColor: string;
  initialDescription: string;
  onSave: (data: { name: string; color: string; description?: string }) => Promise<void> | void;
  onClose: () => void;
}

const ProjectModalForm: React.FC<ProjectModalFormProps> = ({
  mode,
  initialName,
  initialColor,
  initialDescription,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [description, setDescription] = useState(initialDescription);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: trimmed,
        color,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCreate = mode === 'create';

  return (
    <div
      className="project-modal-card"
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'var(--panel-bg)',
        borderRadius: 'var(--radius-2xl)',
        width: '100%',
        maxWidth: '460px',
        padding: '26px 28px',
        border: '1.5px solid var(--panel-border)',
        boxShadow: 'var(--shadow-toolbar)',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `${color}22`,
              border: `1.5px solid ${color}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              flexShrink: 0,
            }}
          >
            {isCreate ? <FolderPlus size={20} /> : <Pencil size={20} />}
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              {isCreate ? 'Tạo Project Mới' : 'Chỉnh Sửa Project'}
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isCreate ? 'Gom nhóm các sơ đồ tư duy liên quan' : 'Cập nhật tên và màu sắc đại diện'}
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
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
            Tên Project <span style={{ color: 'var(--node-color-red)' }}>*</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Marketing Q4, Khóa học AI, Kế hoạch 2026..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--canvas-bg)',
              border: '1.5px solid var(--panel-border)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color var(--transition-fast)',
            }}
            onFocus={(e) => (e.target.style.borderColor = color)}
            onBlur={(e) => (e.target.style.borderColor = 'var(--panel-border)')}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Màu sắc nhận diện
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {PRESET_COLORS.map((item) => {
              const isSelected = color.toLowerCase() === item.color.toLowerCase();
              return (
                <button
                  key={item.color}
                  type="button"
                  onClick={() => setColor(item.color)}
                  style={{
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: item.color,
                    border: isSelected ? '2.5px solid #ffffff' : '1px solid transparent',
                    boxShadow: isSelected ? `0 0 0 2px ${item.color}, var(--shadow-sm)` : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    transition: 'transform var(--transition-fast)',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  }}
                  title={item.label}
                >
                  {isSelected && <Check size={16} strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
            Mô tả ngắn <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(tùy chọn)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ghi chú mục tiêu hoặc phạm vi của dự án..."
            rows={2}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--canvas-bg)',
              border: '1.5px solid var(--panel-border)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: '1.5px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            style={{
              padding: '9px 22px',
              borderRadius: 'var(--radius-md)',
              background: color,
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '700',
              cursor: isSubmitting || !name.trim() ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || !name.trim() ? 0.6 : 1,
              boxShadow: `0 4px 14px ${color}55`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {isSubmitting ? 'Đang lưu...' : isCreate ? 'Tạo Project' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  mode,
  project,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  const initialName = mode === 'edit' && project ? project.name || '' : '';
  const initialColor = mode === 'edit' && project ? project.color || '#f97316' : '#f97316';
  const initialDescription = mode === 'edit' && project ? project.description || '' : '';

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
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
      <ProjectModalForm
        key={mode === 'edit' && project ? project.id : 'create'}
        mode={mode}
        initialName={initialName}
        initialColor={initialColor}
        initialDescription={initialDescription}
        onSave={onSave}
        onClose={onClose}
      />
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
