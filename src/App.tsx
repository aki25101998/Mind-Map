import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { Dashboard } from './pages/Dashboard';
import { EditorPage } from './pages/EditorPage';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { isFirebaseConfigured } from './lib/firebase';
import { useAuth } from './auth/useAuth';

function RootRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  return user ? <Navigate to="/mindmaps" replace /> : <Navigate to="/login" replace />;
}

function App() {
  if (!isFirebaseConfigured) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--canvas-bg)', color: 'var(--text-primary)', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--node-color-red)', marginBottom: '16px' }}>Firebase Not Configured</h1>
        <p style={{ maxWidth: '600px', marginBottom: '24px', lineHeight: '1.6' }}>
          The application requires Firebase to function. Please create a <code>.env</code> file in the root directory and provide the necessary environment variables:
        </p>
        <pre style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--panel-border)', textAlign: 'left', overflowX: 'auto', maxWidth: '600px' }}>
          VITE_FIREBASE_API_KEY=your_api_key{'\n'}
          VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain{'\n'}
          VITE_FIREBASE_PROJECT_ID=your_project_id{'\n'}
          VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket{'\n'}
          VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id{'\n'}
          VITE_FIREBASE_APP_ID=your_app_id
        </pre>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      
      {/* Protected Routes */}
      <Route path="/mindmaps" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/mindmaps/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
