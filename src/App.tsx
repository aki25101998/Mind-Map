import { MindMapCanvas } from './canvas/MindMapCanvas';
import { useMindMapStore } from './store/useMindMapStore';
import { TemplateSelection } from './components/TemplateSelection';
import { TopToolbar } from './editor/TopToolbar';
import { BottomToolbar } from './editor/BottomToolbar';
import { useAutosave } from './hooks/useAutosave';

function App() {
  const { documentId } = useMindMapStore();
  
  // Initialize autosave
  useAutosave();

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
