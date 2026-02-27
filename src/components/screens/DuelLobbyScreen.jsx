import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore.js';
import { BASE_ELEMENTS, ELEMENTS } from '../../engine/elements.js';

export default function DuelLobbyScreen() {
  const duelRoomCode = useGameStore((s) => s.duelRoomCode);
  const duelRole = useGameStore((s) => s.duelRole);
  const duelOpponentJoined = useGameStore((s) => s.duelOpponentJoined);
  const duelConnected = useGameStore((s) => s.duelConnected);
  const duelBattleLog = useGameStore((s) => s.duelBattleLog);
  const sendDuelReady = useGameStore((s) => s.sendDuelReady);
  const disconnectDuel = useGameStore((s) => s.disconnectDuel);
  const selectedStartElement = useGameStore((s) => s.selectedStartElement);
  const setStartElement = useGameStore((s) => s.setStartElement);

  const [elementChosen, setElementChosen] = useState(false);

  const handleCopyCode = () => {
    if (duelRoomCode) navigator.clipboard?.writeText(duelRoomCode);
  };

  const handleLeave = () => {
    disconnectDuel();
    useGameStore.getState().setScreen('menu');
  };

  const handleReady = () => {
    if (!elementChosen) return;
    sendDuelReady(selectedStartElement);
  };

  return (
    <motion.div
      className="screen active menu-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '2rem', maxWidth: 480, margin: '0 auto' }}
    >
      <h2 className="menu-title" style={{ marginBottom: '1rem' }}>
        {duelRole === 'host' ? 'Create match' : 'Join match'}
      </h2>

      {duelRoomCode && duelRole === 'host' && (
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#a098b0', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Share this code with your opponent</p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1.25rem',
              background: 'rgba(139, 92, 246, 0.2)',
              borderRadius: 12,
              border: '1px solid rgba(139, 92, 246, 0.4)',
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: '1.5rem', letterSpacing: 4, fontWeight: 700, color: '#e9d5ff' }}>
              {duelRoomCode}
            </span>
            <button type="button" className="btn-secondary" onClick={handleCopyCode} style={{ padding: '6px 12px' }}>
              Copy
            </button>
          </div>
        </div>
      )}

      {!duelConnected && (
        <p style={{ color: '#a098b0' }}>Connecting…</p>
      )}

      {duelConnected && (
        <>
          {duelRole === 'host' && !duelOpponentJoined && (
            <p style={{ color: '#a098b0', marginBottom: '1rem', textAlign: 'center' }}>Waiting for opponent to join…</p>
          )}
          {(duelOpponentJoined || duelRole === 'guest') && (
            <>
              <p style={{ color: '#86efac', marginBottom: '1rem', textAlign: 'center' }}>
                {duelRole === 'guest' ? 'You joined the match. Choose your element and ready up.' : 'Opponent joined. Choose your element and ready up.'}
              </p>
              <div className="menu-element-select" style={{ marginBottom: '1rem' }}>
                <label>Your element</label>
                <div className="element-options">
                  {BASE_ELEMENTS.map((id) => (
                    <button
                      key={id}
                      className={`element-option spell-${ELEMENTS[id]?.spellType || 'damage'}${selectedStartElement === id ? ' selected' : ''}`}
                      onClick={() => { setStartElement(id); setElementChosen(true); }}
                    >
                      {ELEMENTS[id]?.name ?? id}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', marginBottom: '0.5rem' }}
                onClick={handleReady}
                disabled={!elementChosen}
              >
                Ready
              </button>
            </>
          )}
          <button type="button" className="btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleLeave}>
            Leave
          </button>
        </>
      )}
    </motion.div>
  );
}
