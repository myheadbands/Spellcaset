import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore.js';

export function EncounterBanner() {
  const encounterBanner = useGameStore((s) => s.encounterBanner);

  if (!encounterBanner) return null;

  const { title, text } = encounterBanner;

  return (
    <motion.div
      className="encounter-banner"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <h3 className="encounter-banner-title">{title}</h3>
      <p className="encounter-banner-text">{text}</p>
    </motion.div>
  );
}
