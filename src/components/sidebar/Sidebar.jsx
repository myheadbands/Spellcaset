import React from 'react';
import { useGameStore } from '../../stores/gameStore.js';
import { ELEMENTS, STATUS_EMOJI } from '../../engine/elements.js';
import InventoryChip from './InventoryChip.jsx';

export default function Sidebar() {
  const player = useGameStore(s => s.player);
  const openRecipes = useGameStore(s => s.openRecipes);
  const isSpellVisible = useGameStore(s => s.isSpellVisible);
  const getUnlockedEffects = useGameStore(s => s.getUnlockedEffects);
  const getNextTier = useGameStore(s => s.getNextTier);
  const enemy = useGameStore(s => s.enemy);

  const inventoryIds = [...new Set([...player.unlockedElements, ...player.discoveredSpells])];
  const visibleInventory = inventoryIds.filter(id => isSpellVisible(id));
  const seenFromEnemy = [...player.seenFromEnemy].filter(id => ELEMENTS[id] && !player.discoveredSpells.has(id));

  const unlockedEffects = getUnlockedEffects();
  const nextTier = getNextTier();

  const dmgSpells = visibleInventory.filter(id => ELEMENTS[id]?.spellType === 'damage');
  const healSpells = visibleInventory.filter(id => ELEMENTS[id]?.spellType === 'heal');
  const buffSpells = visibleInventory.filter(id => ELEMENTS[id]?.spellType === 'buff');
  const debuffSpells = visibleInventory.filter(id => ELEMENTS[id]?.spellType === 'debuff');

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3>Spells ({visibleInventory.length})</h3>

        {dmgSpells.length > 0 && (
          <div className="spell-group">
            <span className="spell-group-label damage-label">Damage</span>
            <div className="inventory-chips">
              {dmgSpells.map(id => <InventoryChip key={id} id={id} muted={false} />)}
            </div>
          </div>
        )}

        {healSpells.length > 0 && (
          <div className="spell-group">
            <span className="spell-group-label heal-label">Heal</span>
            <div className="inventory-chips">
              {healSpells.map(id => <InventoryChip key={id} id={id} muted={false} />)}
            </div>
          </div>
        )}

        {buffSpells.length > 0 && (
          <div className="spell-group">
            <span className="spell-group-label buff-label">Buff</span>
            <div className="inventory-chips">
              {buffSpells.map(id => <InventoryChip key={id} id={id} muted={false} />)}
            </div>
          </div>
        )}

        {debuffSpells.length > 0 && (
          <div className="spell-group">
            <span className="spell-group-label debuff-label">Debuff</span>
            <div className="inventory-chips">
              {debuffSpells.map(id => <InventoryChip key={id} id={id} muted={false} />)}
            </div>
          </div>
        )}
      </div>

      {seenFromEnemy.length > 0 && (
        <div className="sidebar-section">
          <h3>Seen From Enemy</h3>
          <div className="seen-chips">
            {seenFromEnemy.map(id => <InventoryChip key={id} id={id} muted />)}
          </div>
        </div>
      )}

      <div className="sidebar-section">
        <h3>Status Effects</h3>
        <div className="status-tier-info">
          <div className="tier-row">
            <span className="tier-label">Active:</span>
            <span className="tier-value">
              {[...unlockedEffects].map(e => `${STATUS_EMOJI[e] ?? ''} ${e}`).join(', ') || 'None'}
            </span>
          </div>
          {nextTier && (
            <div className="tier-row next-tier">
              <span className="tier-label">Next (Lvl {nextTier.level}):</span>
              <span className="tier-value">{nextTier.effects.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      <button type="button" className="hack-recipes" onClick={openRecipes}>
        Recipe Book
      </button>
    </aside>
  );
}
