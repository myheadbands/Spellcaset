import React from 'react';
import { motion } from 'framer-motion';
import { useDrag } from './DragContext.jsx';
import { ELEMENTS } from '../../engine/elements.js';
import { getSpellIconStyle } from '../../engine/spellIcons.js';
import { useGameStore } from '../../stores/gameStore.js';
import { SpellTooltip } from '../ui/SpellTooltip.jsx';

export default function WorkspaceChip({ chipKey, id, x, y }) {
  const { startDrag } = useDrag();
  const spell = ELEMENTS[id] ?? ELEMENTS.fusion;
  const phase = useGameStore(s => s.phase);
  const iconStyle = getSpellIconStyle(id);

  const handlePointerDown = (e) => {
    if (phase !== 'combat') return;
    startDrag(e, { id, source: 'workspace', sourceKey: chipKey });
  };

  return (
    <SpellTooltip spellId={id}>
      <motion.button
        className={`chip workspace-chip spell-${spell.spellType}`}
        style={{ position: 'absolute', left: x, top: y }}
        onPointerDown={handlePointerDown}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        title={`${spell.name} (${spell.spellType})`}
      >
        {iconStyle && <span className="chip-icon" style={iconStyle} aria-hidden />}
        <span className="chip-label">{spell.name}</span>
      </motion.button>
    </SpellTooltip>
  );
}
