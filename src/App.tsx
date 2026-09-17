import React from 'react';
import { MindMapCanvas } from './canvas/MindMapCanvas';
import { useMindMapStore } from './store/useMindMapStore';
import { TemplateSelection } from './components/TemplateSelection';
import { TopToolbar } from './editor/TopToolbar';
import { BottomToolbar } from './editor/BottomToolbar';

function App() {
  const { documentId, loadDocument } = useMindMapStore();

  if (!documentId) {
    return <TemplateSelection />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, position: 'relative' }}>
        <TopToolbar />
        <MindMapCanvas />
        <BottomToolbar />
      </main>
    </div>
  );
}

export default App;
