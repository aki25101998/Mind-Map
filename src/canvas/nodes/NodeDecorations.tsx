import React from 'react';
import { Lock, ExternalLink, FileText } from 'lucide-react';
import type { NodeData } from '../../types';

interface NodeDecorationsProps {
  data: NodeData;
  isEditing?: boolean;
}

export const NodeBadges: React.FC<NodeDecorationsProps> = ({ data }) => {
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
        <span
          title={`Note: ${data.note}`}
          style={{
            position: 'absolute',
            bottom: '-7px',
            right: '-7px',
            background: 'var(--panel-bg)',
            borderRadius: '50%',
            padding: '2px',
            border: '1px solid var(--panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--accent)',
            zIndex: 10
          }}
        >
          <FileText size={10} />
        </span>
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
