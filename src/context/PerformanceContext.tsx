// context/PerformanceContext.tsx
import { createContext } from 'react';
import { PerformanceContextType } from '@/types/canvas';

export const PerformanceContext = createContext<PerformanceContextType>({
  viewport: { x: 0, y: 0, width: 0, height: 0 },
  scale: 1,
  isLayoutItemVisible: () => true,
  canvasBounds: { x: 0, y: 0, width: 0, height: 0 },
});