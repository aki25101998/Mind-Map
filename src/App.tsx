import { MindMapCanvas } from './canvas/MindMapCanvas';
import { useMindMapStore } from './store/useMindMapStore';
import { TemplateSelection } from './components/TemplateSelection';
import { TopToolbar } from './editor/TopToolbar';
import { BottomToolbar } from './editor/BottomToolbar';
import { DocumentSidebar } from './components/DocumentSidebar';
import { useAutosave } from './hooks/useAutosave';
import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Routes, Route } from 'react-router-dom';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { isFirebaseConfigured } from './lib/firebase';

function Workspace() {
  const { documentId, closeDocument } = useMindMapStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Initialize autosave
  useAutosave();

  if (!documentId) {
    return <TemplateSelection />;
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <DocumentSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <ReactFlowProvider>
        <ErrorBoundary documentId={documentId} onReset={closeDocument}>
          <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <TopToolbar onMenuClick={() => setIsSidebarOpen(true)} />
            <MindMapCanvas />
            <BottomToolbar />
          </main>
        </ErrorBoundary>
      </ReactFlowProvider>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        isFirebaseConfigured ? (
          <ProtectedRoute>
            <Workspace />
          </ProtectedRoute>
        ) : (
          <Workspace />
        )
      } />
    </Routes>
  );
}


export default App;
