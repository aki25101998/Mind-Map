import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus cancel button on open for safe defaults
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const iconColor = isDanger ? 'var(--node-color-red, #ef4444)' : 'var(--accent, #f97316)';
  const iconBg = isDanger ? 'rgba(239, 68, 68, 0.12)' : 'var(--accent-soft, rgba(249, 115, 22, 0.1))';
  const confirmBtnBg = isDanger ? '#ef4444' : 'var(--accent, #f97316)';
  const confirmBtnHover = isDanger ? '#dc2626' : 'var(--accent-hover, #ea580c)';

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={isLoading ? undefined : onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
        pointerEvents: 'auto',
      }}
    >
      <div
        className="confirm-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--panel-bg)',
          borderRadius: 'var(--radius-2xl)',
          width: '100%',
          maxWidth: '430px',
          padding: '24px 28px',
          border: '1.5px solid var(--panel-border)',
          boxShadow: 'var(--shadow-toolbar)',
          pointerEvents: 'auto',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: iconColor,
                flexShrink: 0,
              }}
            >
              {isDanger ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <h2
                id="confirm-modal-title"
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  margin: 0,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              opacity: isLoading ? 0.4 : 1,
              transition: 'background var(--transition-fast)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p
          style={{
            fontSize: '14px',
            lineHeight: '1.55',
            color: 'var(--text-secondary)',
            margin: '0 0 24px 0',
          }}
        >
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.background = 'var(--social-bg)';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.background = 'transparent';
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm();
            }}
            disabled={isLoading}
            style={{
              padding: '9px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: confirmBtnBg,
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isDanger ? '0 4px 12px rgba(239, 68, 68, 0.28)' : 'var(--shadow-sm)',
              opacity: isLoading ? 0.7 : 1,
              transition: 'background var(--transition-fast), transform var(--transition-bounce)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = confirmBtnHover;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = confirmBtnBg;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
