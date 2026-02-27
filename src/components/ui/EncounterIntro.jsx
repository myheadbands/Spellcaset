import { useGameStore } from '../../stores/gameStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import { getEnemyPortrait } from '../../engine/portraits.js';

export default function EncounterIntro() {
  const phase = useGameStore((s) => s.phase);
  const enemy = useGameStore((s) => s.enemy);

  const visible = phase === 'encounterIntro' && enemy;
  const { name, level, isBoss, introLine, bossLine } = enemy || {};
  const introText = enemy ? (isBoss ? (bossLine || introLine) : introLine) : '';
  const portraitSrc = enemy ? getEnemyPortrait(level) : '';

  return (
    <AnimatePresence>
      {visible && (
      <motion.div
        key="encounter-intro"
        className="encounter-intro"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, rgba(40, 20, 60, 0.95) 0%, rgba(7, 10, 20, 0.98) 70%)',
          pointerEvents: 'none',
        }}
      >
        <div className="encounter-intro-content">
          <motion.div
            className={`encounter-intro-portrait ${isBoss ? 'encounter-intro-portrait--boss' : ''}`}
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18, duration: 0.4 }}
            style={{
              width: isBoss ? 140 : 120,
              height: isBoss ? 140 : 120,
              borderRadius: '50%',
              overflow: 'hidden',
              border: isBoss ? '3px solid var(--accent-gold)' : '2px solid rgba(139, 92, 246, 0.6)',
              boxShadow: isBoss
                ? '0 0 24px rgba(245, 158, 11, 0.5), inset 0 0 20px rgba(245, 158, 11, 0.2)'
                : '0 0 20px rgba(139, 92, 246, 0.4)',
              flexShrink: 0,
            }}
          >
            <img
              src={portraitSrc}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </motion.div>

          <motion.span
            className="encounter-intro-level"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            Level {level}
          </motion.span>

          {isBoss && (
            <motion.span
              className="encounter-intro-badge"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              Boss Encounter
            </motion.span>
          )}

          <motion.h2
            className={`encounter-intro-name ${isBoss ? 'encounter-intro-name--boss' : ''}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {name}
          </motion.h2>

          {introText && (
            <motion.p
              className="encounter-intro-line"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              {introText}
            </motion.p>
          )}
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
