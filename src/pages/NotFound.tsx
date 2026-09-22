import { useNavigate } from 'react-router-dom';
import { Map } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', 
      background: 'var(--canvas-bg)', color: 'var(--text-primary)', textAlign: 'center', padding: '20px'
    }}>
      <Map size={64} color="var(--text-muted)" style={{ marginBottom: '24px' }} />
      <h1 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px', letterSpacing: '-0.02em' }}>404</h1>
      <h2 style={{ fontSize: '24px', fontWeight: '500', marginBottom: '16px' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '400px' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button 
        onClick={() => navigate('/mindmaps')}
        style={{ 
          padding: '12px 24px', borderRadius: 'var(--radius-md)', background: 'var(--text-primary)', 
          color: 'var(--canvas-bg)', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600' 
        }}
      >
        Back to Mind Maps
      </button>
    </div>
  );
};
