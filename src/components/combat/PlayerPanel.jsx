import { useGameStore } from '../../stores/gameStore.js';
import { HpBar } from '../ui/HpBar.jsx';
import { StatusPill } from '../ui/StatusPill.jsx';
import { AnimatePresence, motion } from 'framer-motion';

export function PlayerPanel() {
  const player = useGameStore((s) => s.player);
  const spellEvent = useGameStore((s) => s.spellEvent);
  const { hp, maxHp, buffs, debuffs } = player;

  const buffEntries = Object.entries(buffs ?? {}).filter(([, t]) => t > 0);
  const debuffEntries = Object.entries(debuffs ?? {}).filter(([, t]) => t > 0);

  const wasHit = spellEvent?.direction === 'toPlayer' && spellEvent?.type === 'damage';
  const wasHealed = spellEvent?.direction === 'toPlayer' && (spellEvent?.type === 'heal' || spellEvent?.type === 'buff');

  return (
    <motion.div
      className="player-panel"
      animate={wasHit ? { x: [0, -6, 6, -4, 4, 0] } : wasHealed ? { boxShadow: ['0 0 0px rgba(68,255,136,0)', '0 0 20px rgba(68,255,136,0.4)', '0 0 0px rgba(68,255,136,0)'] } : {}}
      transition={{ duration: 0.35 }}
      key={spellEvent?.timestamp || 'idle'}
    >
      <div className="portrait-frame">
        <img src="/img/wizard-portrait.png" alt="Wizard" className="portrait-img" draggable={false} />
      </div>
      <h3 className="panel-title">Wizard</h3>
      <HpBar current={hp} max={maxHp} />
      <span className="hp-text">{hp}/{maxHp}</span>
      <div className="status-pills">
        <AnimatePresence mode="popLayout">
          {buffEntries.map(([name, turns]) => (
            <StatusPill key={`buff-${name}`} name={name} turns={turns} type="buff" />
          ))}
          {debuffEntries.map(([name, turns]) => (
            <StatusPill key={`debuff-${name}`} name={name} turns={turns} type="debuff" />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
