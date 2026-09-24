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
  const { documentId, shareEnabled, shareId, setShareConfig } = useMindMapStore();
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

    try {
      // Update both share config and mindmap atomic-ish (batch in firestore)
      await setMindMapShareConfig(documentId, shareIdToUse, newEnabledState);

      // Update local store only after success
      setShareConfig(newEnabledState, shareIdToUse);
    } catch (err: any) {
      console.error('Failed to update share config:', err);
      setError(err.message || 'Failed to update share settings.');
    } finally {
      setIsUpdating(false);
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
        background: 'rgba(0, 0, 0, 0.5)', zIndex: 99999,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        pointerEvents: 'auto'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--panel-bg)', borderRadius: 'var(--radius-lg)',
          width: '100%', maxWidth: '400px', padding: '24px',
          border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-modal)',
          pointerEvents: 'auto', position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)' }}>
            <Share2 size={20} /> Share Mind Map
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'transparent', border: 'none', cursor: 'pointer', 
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', padding: '4px', borderRadius: '4px' 
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px', background: 'var(--node-color-red)', color: 'white', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', color: 'var(--text-primary)' }}>
              <Globe size={16} /> Public Link Sharing
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={shareEnabled}
              disabled={isUpdating}
              onClick={handleToggleShare}
              style={{
                width: '40px', height: '22px', borderRadius: '11px',
                background: shareEnabled ? 'var(--node-color-green)' : 'var(--border-subtle)',
                position: 'relative', transition: 'background 0.2s',
                border: 'none', padding: 0, cursor: isUpdating ? 'wait' : 'pointer',
                outline: 'none'
              }}
            >
              <div style={{
                position: 'absolute', top: '2px', left: shareEnabled ? '20px' : '2px',
                width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {shareEnabled 
              ? 'Anyone with this link can view this mind map.' 
              : 'Sharing is disabled. Only you can access this mind map.'}
          </p>
        </div>

        {shareEnabled && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: 'var(--text-primary)' }}>Link</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={shareUrl}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--panel-border)', background: 'var(--canvas-bg)',
                  color: 'var(--text-primary)', fontSize: '13px'
                }}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={!shareEnabled || !shareId}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: 'var(--radius-md)',
                  background: 'var(--text-primary)', color: 'var(--panel-bg)',
                  border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                }}
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                {isCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            
            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Permission:</span>
              <span style={{ fontWeight: '500' }}>View only</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
