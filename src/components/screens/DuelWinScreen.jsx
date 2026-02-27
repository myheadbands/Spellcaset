import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore.js';

export default function DuelWinScreen() {
  const disconnectDuel = useGameStore((s) => s.disconnectDuel);
  const setScreen = useGameStore((s) => s.setScreen);

  const handleMenu = () => {
    disconnectDuel();
    setScreen('menu');
  };

  return (
    <motion.div
      className="screen active success-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.h1
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        Victory!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ color: '#86efac', marginBottom: '1.5rem' }}
      >
        You defeated your opponent.
      </motion.p>
      <div className="menu-actions">
        <button className="btn-primary" onClick={handleMenu}>
          Back to menu
        </button>
      </div>
    </motion.div>
  );
}
