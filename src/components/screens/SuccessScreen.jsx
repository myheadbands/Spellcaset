import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore.js';
import { ELEMENTS } from '../../engine/elements.js';

export default function SuccessScreen() {
  const battleLog = useGameStore((s) => s.battleLog);
  const latestSuccessUnlock = useGameStore((s) => s.latestSuccessUnlock);
  const healAndAdvance = useGameStore((s) => s.healAndAdvance);
  const skipAndAdvance = useGameStore((s) => s.skipAndAdvance);
  const player = useGameStore((s) => s.player);

  const unlockName = latestSuccessUnlock ? (ELEMENTS[latestSuccessUnlock]?.name ?? latestSuccessUnlock) : null;

  return (
    <motion.div
      className="screen active success-screen"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        Level Cleared
      </motion.h1>

      {unlockName && (
        <motion.div
          className="unlock-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
        >
          New Element: {unlockName}
        </motion.div>
      )}

      <motion.p
        className="success-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {battleLog}
      </motion.p>

      <div className="success-hp">HP: {player.hp}/{player.maxHp}</div>

      <motion.div
        className="menu-actions"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <button className="btn-primary" onClick={healAndAdvance}>
          Heal +25 HP
        </button>
        <button className="btn-secondary" onClick={skipAndAdvance}>
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}
