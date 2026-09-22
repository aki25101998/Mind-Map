import { useAuth } from '../auth/useAuth';
import { useMindMapStore } from '../store/useMindMapStore';
import { logout } from '../auth/authService';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, LogOut, User } from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useMindMapStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{
      width: '100%', height: '100vh', background: 'var(--canvas-bg)',
      overflowY: 'auto', padding: '40px', color: 'var(--text-primary)'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--panel-bg)', borderRadius: 'var(--radius-xl)', padding: '32px', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-md)' }}>
        
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            borderRadius: 'var(--radius-md)', background: 'transparent',
            color: 'var(--text-secondary)', border: 'none', cursor: 'pointer',
            marginBottom: '32px', fontSize: '14px', fontWeight: '500', marginLeft: '-16px'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--social-bg)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '32px' }}>Settings</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--social-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                <User size={24} />
              </div>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Account Email</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{user?.email}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>Appearance</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Toggle between light and dark mode.</div>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                borderRadius: 'var(--radius-md)', background: 'transparent',
                color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer',
                fontSize: '14px', fontWeight: '500'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--social-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {theme === 'dark' ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
            </button>
          </div>

          <div style={{ paddingTop: '8px' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
                borderRadius: 'var(--radius-md)', background: 'transparent',
                color: 'var(--node-color-red)', border: '1px solid var(--node-color-red)', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600', width: '100%', justifyContent: 'center'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--node-color-red)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--node-color-red)'; }}
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
