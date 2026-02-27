import React from 'react';
import { useGameStore } from './stores/gameStore.js';
import ArenaCanvas from './three/ArenaCanvas.jsx';
import MenuScreen from './components/screens/MenuScreen.jsx';
import GameScreen from './components/screens/GameScreen.jsx';
import SuccessScreen from './components/screens/SuccessScreen.jsx';
import GameOverScreen from './components/screens/GameOverScreen.jsx';
import DuelLobbyScreen from './components/screens/DuelLobbyScreen.jsx';
import DuelWinScreen from './components/screens/DuelWinScreen.jsx';
import DuelLoseScreen from './components/screens/DuelLoseScreen.jsx';
import { TransitionCard } from './components/ui/TransitionCard.jsx';
import EncounterIntro from './components/ui/EncounterIntro.jsx';
import FloatingNumbers from './components/ui/FloatingNumbers.jsx';
import { RecipesModal } from './components/ui/RecipesModal.jsx';

export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="app-container">
      <ArenaCanvas />
      <div className="ui-layer">
        {screen === 'menu' && <MenuScreen />}
        {(screen === 'game' || screen === 'duel_game') && <GameScreen />}
        {screen === 'success' && <SuccessScreen />}
        {screen === 'gameover' && <GameOverScreen />}
        {screen === 'duel_lobby' && <DuelLobbyScreen />}
        {screen === 'duel_win' && <DuelWinScreen />}
        {screen === 'duel_lose' && <DuelLoseScreen />}
      </div>
      <TransitionCard />
      <EncounterIntro />
      <FloatingNumbers />
      <RecipesModal />
    </div>
  );
}
