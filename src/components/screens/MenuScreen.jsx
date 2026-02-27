import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore.js';
import { BASE_ELEMENTS, ELEMENTS } from '../../engine/elements.js';

export default function MenuScreen() {
  const [joinCode, setJoinCode] = useState('');
  const selectedStartElement = useGameStore((s) => s.selectedStartElement);
  const setStartElement = useGameStore((s) => s.setStartElement);
  const resetRun = useGameStore((s) => s.resetRun);
  const startLevel = useGameStore((s) => s.startLevel);
  const setRecipesModalOpen = useGameStore((s) => s.setRecipesModalOpen);
  const createDuelRoom = useGameStore((s) => s.createDuelRoom);
  const joinDuelRoom = useGameStore((s) => s.joinDuelRoom);
  const duelBattleLog = useGameStore((s) => s.duelBattleLog);

  const handlePlay = () => {
    resetRun();
    useGameStore.getState().setGameMode('campaign');
    startLevel();
  };

  const handleCreateDuel = () => {
    useGameStore.getState().setGameMode('duel');
    createDuelRoom();
  };

  const handleJoinDuel = () => {
    useGameStore.getState().setGameMode('duel');
    joinDuelRoom(joinCode.trim().toUpperCase());
  };

  return (
    <motion.div
      className="screen active menu-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.img
        src="/img/game-logo.png"
        alt="Spellcaset"
        className="menu-logo"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
        draggable={false}
      />

      <motion.p
        className="menu-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        Combine elements, craft arcane spells, and rise through the tower.
      </motion.p>

      <motion.div
        className="menu-pills"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <span className="menu-pill">Turn Based</span>
        <span className="menu-pill">Element Fusion</span>
        <span className="menu-pill">Boss Progression</span>
      </motion.div>

      {/* Campaign */}
      <motion.div
        className="menu-element-select"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <label htmlFor="start-element">Campaign — Choose your element</label>
        <div className="element-options">
          {BASE_ELEMENTS.map((id) => (
            <button
              key={id}
              className={`element-option spell-${ELEMENTS[id]?.spellType || 'damage'}${selectedStartElement === id ? ' selected' : ''}`}
              onClick={() => setStartElement(id)}
            >
              {ELEMENTS[id]?.name ?? id}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="menu-actions"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, duration: 0.4 }}
      >
        <button className="btn-primary btn-play" onClick={handlePlay}>
          Begin Journey
        </button>
        <button className="btn-secondary" onClick={() => setRecipesModalOpen(true)}>
          Recipes
        </button>
      </motion.div>

      {/* Duel 1v1 */}
      <motion.div
        style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      >
        <h3 className="menu-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Duel — Challenge a friend 1v1</h3>
        <p style={{ color: '#a098b0', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Share a code to join the same match and fight with spells.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="btn-primary" onClick={handleCreateDuel} style={{ width: '100%' }}>
            Create match
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '1rem',
                letterSpacing: 3,
                textAlign: 'center',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
              }}
            />
            <button className="btn-secondary" onClick={handleJoinDuel}>
              Join
            </button>
          </div>
          {duelBattleLog && (
            <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem' }}>{duelBattleLog}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
