import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore.js';

export default function GameOverScreen() {
  const resetRun = useGameStore((s) => s.resetRun);
  const startLevel = useGameStore((s) => s.startLevel);
  const setScreen = useGameStore((s) => s.setScreen);

  const handleRetry = () => {
    resetRun();
    startLevel();
  };

  const handleMainMenu = () => {
    resetRun();
    setScreen('menu');
  };

  return (
    <motion.div
      className="screen active gameover-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        You Were Defeated
      </motion.h1>
      <motion.p
        className="gameover-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        The tower still stands. Return stronger.
      </motion.p>
      <motion.div
        className="menu-actions"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button className="btn-primary" onClick={handleRetry}>
          Retry
        </button>
        <button className="btn-secondary" onClick={handleMainMenu}>
          Main Menu
        </button>
      </motion.div>
    </motion.div>
  );
}
