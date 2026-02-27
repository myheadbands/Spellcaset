import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getSpellTooltipText, getSpellTooltipTitle } from '../../engine/spellTooltip.js';

const HOVER_DELAY_MS = 2000;

export function SpellTooltip({ spellId, children, className = '' }) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerEnter = (e) => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      setCoords({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setShow(true);
    }, HOVER_DELAY_MS);
  };

  const handlePointerLeave = () => {
    clearTimer();
    setShow(false);
  };

  useEffect(() => () => clearTimer(), []);

  const title = getSpellTooltipTitle(spellId);
  const detail = getSpellTooltipText(spellId);
  if (!title && !detail) return children;

  const tooltipEl = show && (title || detail) ? (
    <div
      className={`spell-tooltip-panel ${className}`}
      role="tooltip"
      style={{
        position: 'fixed',
        left: coords.x,
        top: coords.y,
        transform: 'translate(-50%, -8px) translateY(-100%)',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <div className="spell-tooltip-title">{title}</div>
      <div className="spell-tooltip-detail">{detail}</div>
    </div>
  ) : null;

  return (
    <span
      ref={containerRef}
      className="spell-tooltip-trigger"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{ display: 'inline-flex' }}
    >
      {children}
      {createPortal(tooltipEl, document.body)}
    </span>
  );
}
