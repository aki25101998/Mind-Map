import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Copy, X, Check, Globe } from 'lucide-react';
import { useMindMapStore } from '../store/useMindMapStore';
import { v4 as uuidv4 } from 'uuid';
import { setMindMapShareConfig } from '../persistence/firestore';
import { auth } from '../lib/firebase';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const { documentId, shareEnabled, shareId, sharePermission, setShareConfig } = useMindMapStore();
  const [isCopied, setIsCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const shareUrl = shareId
    ? `${window.location.origin}/share/${shareId}`
    : '';

  const handleToggleShare = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to share.');
      return;
    }
    if (!documentId) return;

    setIsUpdating(true);
    setError(null);
    const newEnabledState = !shareEnabled;
    const shareIdToUse = shareId || uuidv4();
    const permToUse = sharePermission || 'view';

    try {
      await setMindMapShareConfig(documentId, shareIdToUse, newEnabledState, permToUse);
      setShareConfig(newEnabledState, shareIdToUse, permToUse);
    } catch (err: any) {
      console.error('Failed to update share config:', err);
      setError(err.message || 'Failed to update share settings.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePermissionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPerm = e.target.value as 'view' | 'edit';
    if (!documentId) return;

    if (shareEnabled && shareId) {
      setIsUpdating(true);
      setError(null);
      try {
        await setMindMapShareConfig(documentId, shareId, true, newPerm);
        setShareConfig(true, shareId, newPerm);
      } catch (err: any) {
        console.error('Failed to update permission:', err);
        setError(err.message || 'Failed to update share settings.');
      } finally {
        setIsUpdating(false);
      }
    } else {
      setShareConfig(false, shareId, newPerm);
    }
  };

  const handleCopyLink = async () => {
    if (!shareEnabled || !shareId || !shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy link to clipboard.');
    }
  };

  const modalContent = (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)', zIndex: 99999,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '16px', pointerEvents: 'auto'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--panel-bg)', borderRadius: 'var(--radius-2xl)',
          width: '100%', maxWidth: '440px', padding: '28px',
          border: '1.5px solid var(--panel-border)', boxShadow: 'var(--shadow-toolbar)',
          pointerEvents: 'auto', position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '19px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: 'var(--text-primary)' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)'
            }}>
              <Share2 size={18} />
            </div>
            Share Mind Map
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'transparent', border: 'none', cursor: 'pointer', 
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', padding: '6px', borderRadius: 'var(--radius-sm)',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--node-color-red)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.25)', marginBottom: '18px', fontSize: '13px', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <div style={{
          background: 'var(--social-bg)',
          borderRadius: 'var(--radius-xl)',
          padding: '16px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
              <Globe size={16} color="var(--accent-secondary)" /> Public Link Sharing
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={shareEnabled}
              disabled={isUpdating}
              onClick={handleToggleShare}
              style={{
                width: '44px', height: '24px', borderRadius: '12px',
                background: shareEnabled ? 'var(--gradient-primary)' : 'var(--border-subtle)',
                position: 'relative', transition: 'background var(--transition-fast)',
                border: 'none', padding: 0, cursor: isUpdating ? 'wait' : 'pointer',
                outline: 'none',
                boxShadow: shareEnabled ? 'var(--accent-glow)' : 'none'
              }}
            >
              <div style={{
                position: 'absolute', top: '2px', left: shareEnabled ? '22px' : '2px',
                width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                transition: 'left var(--transition-fast)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            {shareEnabled 
              ? 'Anyone with this link can view or edit this mind map depending on your permission setting.' 
              : 'Sharing is disabled. Only you can access this mind map.'}
          </p>
        </div>

        {shareEnabled && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Shareable Link</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={shareUrl}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--panel-border)', background: 'var(--canvas-bg)',
                  color: 'var(--text-primary)', fontSize: '13px', fontWeight: '500', outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={!shareEnabled || !shareId}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 18px', borderRadius: 'var(--radius-lg)',
                  background: 'var(--gradient-primary)', color: '#ffffff',
                  border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                  boxShadow: 'var(--accent-glow)',
                  transition: 'transform var(--transition-bounce)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                {isCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            
            <div style={{ marginTop: '18px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Permission:</span>
              <select
                value={sharePermission || 'view'}
                onChange={handlePermissionChange}
                disabled={isUpdating}
                style={{
                  background: 'var(--canvas-bg)',
                  color: 'var(--text-primary)',
                  border: '1.5px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: isUpdating ? 'wait' : 'pointer',
                  outline: 'none'
                }}
              >
                <option value="view">View only</option>
                <option value="edit">View and edit</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
