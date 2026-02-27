import { useGameStore } from '../../stores/gameStore.js';
import { HpBar } from '../ui/HpBar.jsx';
import { StatusPill } from '../ui/StatusPill.jsx';
import { AnimatePresence, motion } from 'framer-motion';
import { getEnemyPortrait } from '../../engine/portraits.js';

export function EnemyPanel() {
  const enemy = useGameStore((s) => s.enemy);
  const spellEvent = useGameStore((s) => s.spellEvent);
  if (!enemy) return null;

  const { name, currentHp, hp, buffs, debuffs, isBoss, level } = enemy;
  const buffEntries = Object.entries(buffs ?? {}).filter(([, t]) => t > 0);
  const debuffEntries = Object.entries(debuffs ?? {}).filter(([, t]) => t > 0);

  const wasHit = spellEvent?.direction === 'toEnemy' && spellEvent?.type === 'damage';
  const wasHealed = spellEvent?.direction === 'toEnemy' && (spellEvent?.type === 'heal' || spellEvent?.type === 'buff');
  const portrait = getEnemyPortrait(level);

  return (
    <motion.div
      className={`enemy-panel${isBoss ? ' boss' : ''}`}
      animate={wasHit ? { x: [0, 6, -6, 4, -4, 0] } : wasHealed ? { boxShadow: ['0 0 0px rgba(68,255,136,0)', '0 0 20px rgba(68,255,136,0.4)', '0 0 0px rgba(68,255,136,0)'] } : {}}
      transition={{ duration: 0.35 }}
      key={spellEvent?.timestamp || 'idle'}
    >
      <div className={`portrait-frame${isBoss ? ' boss-frame' : ''}`}>
        <img src={portrait} alt={name} className="portrait-img" draggable={false} />
      </div>
      <h3 className="panel-title">{name}</h3>
      {isBoss && <span className="boss-badge">BOSS</span>}
      <HpBar current={currentHp} max={hp} />
      <span className="hp-text">{currentHp}/{hp}</span>
      <div className="status-pills">
        <AnimatePresence mode="popLayout">
          {buffEntries.map(([n, turns]) => (
            <StatusPill key={`buff-${n}`} name={n} turns={turns} type="buff" />
          ))}
          {debuffEntries.map(([n, turns]) => (
            <StatusPill key={`debuff-${n}`} name={n} turns={turns} type="debuff" />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
