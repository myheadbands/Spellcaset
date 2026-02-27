import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * High-performance drag hook. Ghost position is tracked via ref + direct DOM
 * mutation to avoid React re-renders on every pointermove (60fps).
 * React state only changes on drag start/end.
 */
export function useDragDrop() {
  const [dragPayload, setDragPayload] = useState(null);
  const ghostRef = useRef(null);
  const pointerPos = useRef({ x: 0, y: 0 });
  const rafId = useRef(null);

  const startDrag = useCallback((e, payload) => {
    e.preventDefault();
    pointerPos.current = { x: e.clientX, y: e.clientY };
    setDragPayload({
      id: payload.id,
      source: payload.source,
      sourceKey: payload.sourceKey,
    });
  }, []);

  const endDrag = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setDragPayload(null);
  }, []);

  useEffect(() => {
    if (!dragPayload) return;

    const updateGhost = () => {
      const el = ghostRef.current;
      if (el) {
        el.style.left = `${pointerPos.current.x}px`;
        el.style.top = `${pointerPos.current.y}px`;
      }
    };

    const onMove = (e) => {
      pointerPos.current.x = e.clientX;
      pointerPos.current.y = e.clientY;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(updateGhost);
    };

    const onUp = () => endDrag();

    updateGhost();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [dragPayload, endDrag]);

  return { dragPayload, ghostRef, pointerPos, startDrag, endDrag };
}
