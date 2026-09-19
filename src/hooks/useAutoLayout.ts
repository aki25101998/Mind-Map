import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useMindMapStore } from '../store/useMindMapStore';

export const useAutoLayout = () => {
  const autoLayout = useMindMapStore(state => state.autoLayout);
  const { fitView } = useReactFlow();

  const performAutoLayout = useCallback(() => {
    autoLayout();
    
    // After autoLayout updates Zustand, MindMapCanvas syncs localNodes and ReactFlow re-renders.
    // requestAnimationFrame ensures fitView runs after the next browser paint when positions are updated.
    window.requestAnimationFrame(() => {
      fitView({ duration: 300, padding: 0.2 });
    });
  }, [autoLayout, fitView]);

  return performAutoLayout;
};
