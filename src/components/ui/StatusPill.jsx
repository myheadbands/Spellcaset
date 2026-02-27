import { motion } from 'framer-motion';
import { STATUS_EMOJI } from '../../engine/elements.js';

export function StatusPill({ name, turns, type = 'buff' }) {
  const emoji = STATUS_EMOJI[name] ?? '❓';

  return (
    <motion.span
      className={`status-pill ${type}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {emoji} {name} {turns > 0 ? `(${turns})` : ''}
    </motion.span>
  );
}
