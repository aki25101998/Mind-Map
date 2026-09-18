import { MindMapCanvas } from './canvas/MindMapCanvas';
import { useMindMapStore } from './store/useMindMapStore';
import { TemplateSelection } from './components/TemplateSelection';
import { TopToolbar } from './editor/TopToolbar';
import { BottomToolbar } from './editor/BottomToolbar';
import { DocumentSidebar } from './components/DocumentSidebar';
import { useAutosave } from './hooks/useAutosave';
import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';

function App() {
  const { documentId } = useMindMapStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Initialize autosave
  useAutosave();

  if (!documentId) {
    return <TemplateSelection />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DocumentSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <ReactFlowProvider>
        <main style={{ flex: 1, position: 'relative' }}>
          <TopToolbar onMenuClick={() => setIsSidebarOpen(true)} />
          <MindMapCanvas />
          <BottomToolbar />
        </main>
      </ReactFlowProvider>
    </div>
  );
}

export default App;
