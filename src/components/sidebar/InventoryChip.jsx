import React from 'react';
import { useDrag } from '../workspace/DragContext.jsx';
import { ELEMENTS } from '../../engine/elements.js';
import { getSpellIconStyle } from '../../engine/spellIcons.js';
import { useGameStore } from '../../stores/gameStore.js';
import { SpellTooltip } from '../ui/SpellTooltip.jsx';

export default function InventoryChip({ id, muted }) {
  const { startDrag } = useDrag();
  const spell = ELEMENTS[id] ?? ELEMENTS.fusion;
  const phase = useGameStore(s => s.phase);
  const turn = useGameStore(s => s.turn);
  const iconStyle = getSpellIconStyle(id);

  const handlePointerDown = (e) => {
    if (muted) return;
    if (phase !== 'combat') return;
    if (turn !== 'player') return;
    startDrag(e, { id, source: 'inventory', sourceKey: id });
  };

  return (
    <SpellTooltip spellId={id}>
      <button
        className={`chip inventory-chip spell-${spell.spellType}${muted ? ' muted' : ''}`}
        onPointerDown={handlePointerDown}
        title={muted ? 'Seen from enemy. Discover by crafting.' : `${spell.name} (${spell.spellType})`}
      >
        {iconStyle && <span className="chip-icon" style={iconStyle} aria-hidden />}
        <span className="chip-label">{spell.name}</span>
      </button>
    </SpellTooltip>
  );
}
