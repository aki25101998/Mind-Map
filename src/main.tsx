import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { isFirebaseConfigured } from './lib/firebase'
import './index.css'
import App from './App.tsx'

function ConfigError() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: '#fff', textAlign: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '500px', background: '#1a1a1a', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
        <h1 style={{ color: '#ef4444', marginBottom: '16px', fontSize: '24px', fontWeight: 'bold' }}>Firebase Configuration Missing</h1>
        <p style={{ color: '#a3a3a3', lineHeight: 1.5 }}>
          The application cannot start because the Firebase configuration is missing. 
          Please add your Firebase credentials to the <code>.env</code> file (copy from <code>.env.example</code>) and restart the application.
        </p>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isFirebaseConfigured ? (
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    ) : (
      <ConfigError />
    )}
  </StrictMode>,
)
