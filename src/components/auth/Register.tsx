import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, loginWithGoogle } from '../../auth/authService';
import { useAuth } from '../../auth/useAuth';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate('/mindmaps');
  }

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate('/mindmaps');
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('An error occurred during Google sign-in.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password);
      navigate('/mindmaps');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already in use.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please try again.');
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', 
      background: 'var(--canvas-bg)', color: 'var(--text-primary)'
    }}>
      <div style={{
        background: 'var(--panel-bg)', padding: 'var(--space-8)', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '400px', border: '1px solid var(--panel-border)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h1 style={{ marginBottom: 'var(--space-6)', fontSize: '24px', fontWeight: '700', textAlign: 'center' }}>Register</h1>
        
        {error && (
          <div style={{
            background: 'var(--social-bg)', color: 'var(--node-color-red)', padding: 'var(--space-3)', 
            borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: '14px', textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '14px', fontWeight: '500' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                background: 'var(--canvas-bg)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', fontSize: '15px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '14px', fontWeight: '500' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                background: 'var(--canvas-bg)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', fontSize: '15px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '14px', fontWeight: '500' }}>Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                background: 'var(--canvas-bg)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', fontSize: '15px'
              }}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              padding: '12px', borderRadius: 'var(--radius-lg)', background: 'var(--text-primary)',
              color: 'var(--canvas-bg)', border: 'none', fontSize: '15px', fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
              marginTop: 'var(--space-2)'
            }}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--space-6) 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ padding: '0 var(--space-4)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          style={{
            width: '100%', padding: '12px', borderRadius: 'var(--radius-lg)', background: 'var(--canvas-bg)',
            color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontSize: '15px', fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = 'var(--social-bg)')}
          onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = 'var(--canvas-bg)')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.71 17.58V20.35H19.27C21.36 18.43 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
            <path d="M12 23C14.97 23 17.46 22.02 19.27 20.35L15.71 17.58C14.73 18.24 13.48 18.64 12 18.64C9.13 18.64 6.7 16.7 5.84 14.1H2.18V16.94C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
            <path d="M5.84 14.1C5.62 13.44 5.5 12.74 5.5 12C5.5 11.26 5.62 10.56 5.84 9.9V7.06H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.94L5.84 14.1Z" fill="#FBBC05"/>
            <path d="M12 5.38C13.62 5.38 15.06 5.93 16.2 7.02L19.35 3.87C17.46 2.11 14.97 1 12 1C7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.7 7.3 9.13 5.38 12 5.38Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none' }}>Log In</Link>
        </div>
      </div>
    </div>
  );
};
