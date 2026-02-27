import { useGameStore } from '../../stores/gameStore.js';
import { ELEMENTS, SPELL_TYPE_COLORS } from '../../engine/elements.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

export default function FloatingNumbers() {
  const spellEvent = useGameStore((s) => s.spellEvent);
  const [entries, setEntries] = useState([]);
  const lastTimestampRef = useRef(null);
  const idCounterRef = useRef(0);

  useEffect(() => {
    if (!spellEvent || spellEvent.timestamp === lastTimestampRef.current) return;
    lastTimestampRef.current = spellEvent.timestamp;

    const spell = ELEMENTS[spellEvent.spellId] ?? ELEMENTS.fusion;
    const type = spellEvent.type ?? spell.spellType ?? 'damage';

    let displayText;
    let value;

    if (type === 'damage') {
      value = spell.attack ?? 0;
      displayText = `-${value}`;
    } else if (type === 'heal') {
      value = spell.heal ?? 0;
      displayText = `+${value}`;
    } else {
      displayText = spell.name ?? spell.effectId ?? type;
    }

    const key = `fn-${spellEvent.timestamp}-${idCounterRef.current++}`;
    const position = spellEvent.direction === 'toEnemy' ? 'right' : 'left';

    setEntries((prev) => [
      ...prev,
      { key, displayText, type, position },
    ]);
  }, [spellEvent]);

  const handleAnimationComplete = (key) => {
    setEntries((prev) => prev.filter((e) => e.key !== key));
  };

  const baseStyle = {
    position: 'fixed',
    zIndex: 200,
    fontFamily: "'Cinzel', serif",
    fontSize: '1.8rem',
    fontWeight: 700,
    pointerEvents: 'none',
  };

  const positionStyles = {
    right: { right: '20%', top: '25%' },
    left: { left: '20%', top: '25%' },
  };

  return (
    <AnimatePresence>
      {entries.map((entry) => {
        const color = SPELL_TYPE_COLORS[entry.type] ?? SPELL_TYPE_COLORS.damage;
        return (
          <motion.div
            key={entry.key}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            onAnimationComplete={() => handleAnimationComplete(entry.key)}
            style={{
              ...baseStyle,
              ...positionStyles[entry.position],
              color,
              textShadow: `0 0 8px ${color}, 0 0 16px ${color}`,
            }}
          >
            {entry.displayText}
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
