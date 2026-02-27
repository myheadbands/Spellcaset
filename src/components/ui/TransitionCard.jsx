import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore.js';

export function TransitionCard() {
  const transitionCard = useGameStore((s) => s.transitionCard);

  return (
    <AnimatePresence>
      {transitionCard && (
        <motion.div
          className="transition-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.85)',
          }}
        >
          <h2 className="transition-card-title">{transitionCard.title}</h2>
          <p className="transition-card-text">{transitionCard.text}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
