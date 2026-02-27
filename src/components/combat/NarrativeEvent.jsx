import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore.js';

export function NarrativeEvent() {
  const narrativeEvent = useGameStore((s) => s.narrativeEvent);
  const attackLifeEnergy = useGameStore((s) => s.attackLifeEnergy);
  const ignoreEvent = useGameStore((s) => s.ignoreEvent);

  return (
    <AnimatePresence>
      {narrativeEvent && (
        <motion.div
          className="narrative-event"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <p className="narrative-text">{narrativeEvent}</p>
          <div className="narrative-actions">
            <button type="button" className="btn-primary" onClick={attackLifeEnergy}>
              Strike Life Energy
            </button>
            <button type="button" className="btn-secondary" onClick={ignoreEvent}>
              Hold Formation
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
