import { PlayerPanel } from './PlayerPanel.jsx';
import { ArenaPanel } from './ArenaPanel.jsx';
import { EnemyPanel } from './EnemyPanel.jsx';

export function BattleHeader() {
  return (
    <header className="battle-header">
      <PlayerPanel />
      <ArenaPanel />
      <EnemyPanel />
    </header>
  );
}
