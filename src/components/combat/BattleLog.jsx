import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore.js';

export function BattleLog() {
  const battleLog = useGameStore((s) => s.battleLog);

  return (
    <motion.div
      className="battle-log"
      key={battleLog}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {battleLog}
    </motion.div>
  );
}
