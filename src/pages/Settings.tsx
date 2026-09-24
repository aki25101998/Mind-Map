import { useAuth } from '../auth/useAuth';
import { useMindMapStore } from '../store/useMindMapStore';
import { logout } from '../auth/authService';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, LogOut, User, Sparkles } from 'lucide-react';

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
      width: '100%', minHeight: '100vh', height: '100vh', background: 'var(--canvas-ambient)',
      overflowY: 'auto', padding: '40px 20px', color: 'var(--text-primary)',
      transition: 'background var(--transition-normal)'
    }}>
      <div style={{
        maxWidth: '620px', margin: '0 auto', background: 'var(--panel-bg)',
        borderRadius: 'var(--radius-2xl)', padding: '36px',
        border: '1.5px solid var(--panel-border)', boxShadow: 'var(--shadow-toolbar)'
      }}>
        
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            borderRadius: 'var(--radius-md)', background: 'transparent',
            color: 'var(--text-secondary)', border: 'none', cursor: 'pointer',
            marginBottom: '28px', fontSize: '14px', fontWeight: '600', marginLeft: '-12px',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--social-bg)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <ArrowLeft size={16} /> Back to Studio
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <Sparkles size={24} color="var(--accent)" />
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>Studio Settings</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1.5px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '16px',
                background: 'var(--accent-soft)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'var(--accent)', border: '1.5px solid rgba(249, 115, 22, 0.2)'
              }}>
                <User size={26} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Logged in User</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{user?.email}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1.5px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>Appearance Theme</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Toggle between Warm Light and Creative Dark canvas.</div>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                borderRadius: 'var(--radius-lg)', background: 'var(--panel-bg)',
                color: 'var(--text-primary)', border: '1.5px solid var(--border-subtle)', cursor: 'pointer',
                fontSize: '14px', fontWeight: '700', boxShadow: 'var(--shadow-sm)',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--social-bg)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--panel-bg)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              {theme === 'dark' ? <><Sun size={17} color="var(--accent)" /> Light Mode</> : <><Moon size={17} color="var(--accent-secondary)" /> Dark Mode</>}
            </button>
          </div>

          <div style={{ paddingTop: '8px' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
                borderRadius: 'var(--radius-lg)', background: 'transparent',
                color: 'var(--node-color-red)', border: '1.5px solid var(--node-color-red)', cursor: 'pointer',
                fontSize: '14px', fontWeight: '700', width: '100%', justifyContent: 'center',
                transition: 'all var(--transition-fast)'
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
