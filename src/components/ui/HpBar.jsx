import { motion } from 'framer-motion';

export function HpBar({ current, max }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const isLow = pct < 30;

  return (
    <div className="hp-bar">
      <motion.div
        className={`hp-bar-fill ${isLow ? 'low' : ''}`}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}
