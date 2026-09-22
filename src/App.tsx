import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { Dashboard } from './pages/Dashboard';
import { TemplateSelectionPage } from './pages/TemplateSelectionPage';
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
  // If firebase is not configured, we might want to bypass auth for local development
  // but for production this should enforce auth.
  
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      
      {/* Protected Routes */}
      <Route path="/mindmaps" element={
        isFirebaseConfigured ? <ProtectedRoute><Dashboard /></ProtectedRoute> : <Dashboard />
      } />
      
      <Route path="/mindmaps/new" element={
        isFirebaseConfigured ? <ProtectedRoute><TemplateSelectionPage /></ProtectedRoute> : <TemplateSelectionPage />
      } />
      
      <Route path="/mindmaps/:id" element={
        isFirebaseConfigured ? <ProtectedRoute><EditorPage /></ProtectedRoute> : <EditorPage />
      } />
      
      <Route path="/settings" element={
        isFirebaseConfigured ? <ProtectedRoute><Settings /></ProtectedRoute> : <Settings />
      } />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
