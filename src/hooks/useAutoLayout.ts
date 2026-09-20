import { useCallback } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

export const useAutoLayout = () => {
  const autoLayout = useMindMapStore(state => state.autoLayout);

  const performAutoLayout = useCallback(() => {
    autoLayout();
  }, [autoLayout]);

  return performAutoLayout;
};
