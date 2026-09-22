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

function App() {
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

export default App;
