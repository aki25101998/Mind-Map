import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../auth/authService';
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
    navigate('/');
  }

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
      navigate('/');
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

        <div style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none' }}>Log In</Link>
        </div>
      </div>
    </div>
  );
};
