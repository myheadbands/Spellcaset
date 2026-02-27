import React from 'react';
import { BattleHeader } from '../combat/BattleHeader.jsx';
import { DragProvider } from '../workspace/DragContext.jsx';
import Workspace from '../workspace/Workspace.jsx';
import Sidebar from '../sidebar/Sidebar.jsx';
import { EncounterBanner } from '../ui/EncounterBanner.jsx';

export default function GameScreen() {
  return (
    <div className="screen active" style={{ position: 'relative', overflow: 'hidden' }}>
      <EncounterBanner />
      <BattleHeader />
      <DragProvider>
        <main className="game-layout">
          <Workspace />
          <Sidebar />
        </main>
      </DragProvider>
    </div>
  );
}
