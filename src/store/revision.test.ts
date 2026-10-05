import { describe, it, expect, beforeEach } from 'vitest';
import { useMindMapStore } from './useMindMapStore';

describe('Document Revision Tracking', () => {
  beforeEach(() => {
    useMindMapStore.getState().closeDocument();
    useMindMapStore.getState().loadDocument(
      'doc-test-1',
      'Initial Title',
      [
        {
          id: 'root-1',
          type: 'main',
          position: { x: 0, y: 0 },
          data: { label: 'Root' }
        }
      ],
      [],
      { x: 0, y: 0, zoom: 1 },
      'blank',
      1000,
      1000
    );
  });

  it('initializes revision to 0 on loadDocument', () => {
    expect(useMindMapStore.getState().revision).toBe(0);
  });

  it('increments revision on setTitle and setShareConfig', () => {
    useMindMapStore.getState().setTitle('New Title');
    expect(useMindMapStore.getState().revision).toBe(1);

    useMindMapStore.getState().setShareConfig(true, 'share-1', 'edit');
    expect(useMindMapStore.getState().revision).toBe(2);
  });

  it('increments revision past 50 operations where historyIndex freezes at 49', () => {
    const store = useMindMapStore.getState();

    // Perform 60 node modifications
    for (let i = 1; i <= 60; i++) {
      store.updateNodeData('root-1', { label: `Root label update ${i}` });
    }

    const finalState = useMindMapStore.getState();
    // History is capped at 50, so historyIndex is 49
    expect(finalState.history.length).toBe(50);
    expect(finalState.historyIndex).toBe(49);

    // But revision continues to increment, ensuring autosave never stops tracking changes!
    expect(finalState.revision).toBe(60);
  });

  it('increments revision on undo and redo', () => {
    useMindMapStore.getState().updateNodeData('root-1', { label: 'Step 1' });
    expect(useMindMapStore.getState().revision).toBe(1);

    useMindMapStore.getState().undo();
    expect(useMindMapStore.getState().revision).toBe(2);

    useMindMapStore.getState().redo();
    expect(useMindMapStore.getState().revision).toBe(3);
  });

});
