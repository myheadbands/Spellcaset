import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore.js';
import { BattleLog } from './BattleLog.jsx';
import { NarrativeEvent } from './NarrativeEvent.jsx';

export function ArenaPanel() {
  const enemy = useGameStore((s) => s.enemy);
  const turn = useGameStore((s) => s.turn);
  const gameMode = useGameStore((s) => s.gameMode);

  const level = enemy?.level ?? 1;
  const isPlayerTurn = turn === 'player';
  const isDuel = gameMode === 'duel';

  return (
    <div className="arena-panel">
      <span className="arena-mark">&#x2694;&#xFE0F;</span>
      <span className="level-label">{isDuel ? 'Duel 1v1' : `Level ${level}`}</span>
      <span className={`turn-label ${isPlayerTurn ? 'your-turn' : 'enemy-turn'}`}>
        {isPlayerTurn ? 'Your turn' : (isDuel ? "Opponent's turn" : 'Enemy turn')}
      </span>
      <AnimatePresence mode="wait">
        <BattleLog />
      </AnimatePresence>
      <NarrativeEvent />
    </div>
  );
}
