import React, { createContext, useContext } from 'react';
import { useDragDrop } from '../../hooks/useDragDrop.js';

const DragCtx = createContext(null);
export const useDrag = () => useContext(DragCtx);

export function DragProvider({ children }) {
  const drag = useDragDrop();
  return <DragCtx.Provider value={drag}>{children}</DragCtx.Provider>;
}
