import React from 'react';
import { syncDocument } from '../../persistence/persistenceService';
import type { MindMapDocument } from '../../types';

interface MigrationPromptProps {
  documents: MindMapDocument[];
  onComplete: () => void;
}

export const MigrationPrompt: React.FC<MigrationPromptProps> = ({ documents, onComplete }) => {
  const [isMigrating, setIsMigrating] = React.useState(false);

  const handleImport = async () => {
    setIsMigrating(true);
    try {
      await Promise.all(documents.map(doc => syncDocument(doc)));
    } catch (err) {
      console.error('Migration failed', err);
      alert('Some documents failed to migrate.');
    } finally {
      setIsMigrating(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'var(--panel-bg)', borderRadius: 'var(--radius-xl)', width: '90%', maxWidth: '500px',
        padding: 'var(--space-6)', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-toolbar)',
        color: 'var(--text-primary)'
      }}>
        <h2 style={{ margin: '0 0 var(--space-4) 0', fontSize: '20px', fontWeight: '600' }}>
          Local Maps Found
        </h2>
        <p style={{ margin: '0 0 var(--space-6) 0', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          We found {documents.length} map{documents.length > 1 ? 's' : ''} saved locally on this device. Would you like to import them into your account so they are backed up and accessible everywhere?
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleSkip}
            disabled={isMigrating}
            style={{ 
              padding: '10px 18px', borderRadius: 'var(--radius-md)', background: 'transparent', 
              border: '1.5px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer', 
              fontSize: '14px', fontWeight: '600', opacity: isMigrating ? 0.5 : 1
            }}
          >
            Keep Local (Skip)
          </button>
          <button 
            onClick={handleImport}
            disabled={isMigrating}
            style={{ 
              padding: '10px 20px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', 
              border: 'none', color: '#ffffff', fontWeight: '700', cursor: 'pointer', 
              fontSize: '14px', opacity: isMigrating ? 0.7 : 1, boxShadow: 'var(--accent-glow)'
            }}
          >
            {isMigrating ? 'Importing...' : 'Import to My Account'}
          </button>
        </div>
      </div>
    </div>
  );
};
