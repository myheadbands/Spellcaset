import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDrag } from './DragContext.jsx';
import { useGameStore } from '../../stores/gameStore.js';
import { ELEMENTS } from '../../engine/elements.js';
import { getSpellIconStyle } from '../../engine/spellIcons.js';
import WorkspaceChip from './WorkspaceChip.jsx';
import CastZone from './CastZone.jsx';

let chipKeyCounter = 0;

export default function Workspace() {
  const [chips, setChips] = useState([]);
  const wsRef = useRef(null);
  const castRef = useRef(null);
  const { dragPayload, ghostRef, pointerPos, endDrag } = useDrag();
  const castPlayerSpell = useGameStore(s => s.castPlayerSpell);
  const sendDuelCast = useGameStore(s => s.sendDuelCast);
  const gameMode = useGameStore(s => s.gameMode);
  const combineInWorkspace = useGameStore(s => s.combineInWorkspace);
  const levelIndex = useGameStore(s => s.levelIndex);

  const handlePointerUp = useCallback((e) => {
    if (!dragPayload) return;

    const castRect = castRef.current?.getBoundingClientRect();
    if (castRect && e.clientX >= castRect.left && e.clientX <= castRect.right &&
        e.clientY >= castRect.top && e.clientY <= castRect.bottom) {
      if (gameMode === 'duel') {
        sendDuelCast(dragPayload.id);
      } else {
        castPlayerSpell(dragPayload.id);
      }
      if (dragPayload.source === 'workspace') {
        setChips(prev => prev.filter(c => c.key !== dragPayload.sourceKey));
      }
      endDrag();
      return;
    }

    const wsRect = wsRef.current?.getBoundingClientRect();
    if (!wsRect) { endDrag(); return; }

    let targetChip = null;
    for (const chip of [...chips].reverse()) {
      const chipLeft = wsRect.left + chip.x;
      const chipTop = wsRect.top + chip.y;
      const chipW = 100, chipH = 36;
      if (e.clientX >= chipLeft && e.clientX <= chipLeft + chipW &&
          e.clientY >= chipTop && e.clientY <= chipTop + chipH) {
        if (chip.key !== dragPayload.sourceKey) {
          targetChip = chip;
          break;
        }
      }
    }

    if (targetChip) {
      const resultId = combineInWorkspace(targetChip.id, dragPayload.id);
      if (resultId) {
        const newKey = ++chipKeyCounter;
        setChips(prev => [
          ...prev.filter(c => c.key !== targetChip.key && c.key !== dragPayload.sourceKey),
          { key: newKey, id: resultId, x: e.clientX - wsRect.left - 50, y: e.clientY - wsRect.top - 18 },
        ]);
      } else {
        setChips(prev => prev.filter(c => c.key !== targetChip.key && c.key !== dragPayload.sourceKey));
        if (wsRef.current) {
          wsRef.current.classList.add('fizzle-shake');
          setTimeout(() => wsRef.current?.classList.remove('fizzle-shake'), 400);
        }
      }
      endDrag();
      return;
    }

    const inWs = e.clientX >= wsRect.left && e.clientX <= wsRect.right &&
                 e.clientY >= wsRect.top && e.clientY <= wsRect.bottom;
    if (inWs) {
      if (dragPayload.source === 'workspace') {
        setChips(prev => prev.map(c =>
          c.key === dragPayload.sourceKey
            ? { ...c, x: e.clientX - wsRect.left - 50, y: e.clientY - wsRect.top - 18 }
            : c
        ));
      } else {
        const newKey = ++chipKeyCounter;
        setChips(prev => [...prev, {
          key: newKey, id: dragPayload.id,
          x: e.clientX - wsRect.left - 50, y: e.clientY - wsRect.top - 18,
        }]);
      }
    }
    endDrag();
  }, [dragPayload, chips, castPlayerSpell, combineInWorkspace, endDrag]);

  useEffect(() => { setChips([]); }, [levelIndex]);

  const spell = dragPayload ? ELEMENTS[dragPayload.id] : null;
  const ghostIconStyle = dragPayload ? getSpellIconStyle(dragPayload.id) : null;

  return (
    <section className="workspace" ref={wsRef} onPointerUp={handlePointerUp}>
      {chips.map(chip => (
        <WorkspaceChip key={chip.key} chipKey={chip.key} id={chip.id} x={chip.x} y={chip.y} />
      ))}
      <CastZone ref={castRef} active={!!dragPayload} />
      {dragPayload && (
        <div
          ref={ghostRef}
          className={`chip drag-ghost spell-${spell?.spellType || 'damage'}`}
        >
          {ghostIconStyle && <span className="chip-icon" style={ghostIconStyle} aria-hidden />}
          <span className="chip-label">{spell?.name ?? dragPayload.id}</span>
        </div>
      )}
    </section>
  );
}
