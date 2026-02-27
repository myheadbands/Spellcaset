import { ELEMENTS, BASE_ELEMENTS } from './elements.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function getCraftingTierForLevel(level) {
  if (level >= 19) return 5; // After Vorak (lvl 18 boss)
  if (level >= 15) return 4; // After Vex (lvl 14 boss)
  if (level >= 10) return 3; // After Thrain (lvl 9 boss)
  if (level >= 5) return 2;  // After Pyra (lvl 4 boss)
  return 1;
}

export function getUnlockedEffectsByLevel(level) {
  const unlocked = new Set();
  if (level >= 5) ['weaken', 'ward', 'regeneration'].forEach(e => unlocked.add(e));
  if (level >= 9) ['slow', 'blind', 'shield'].forEach(e => unlocked.add(e));
  if (level >= 13) ['poison', 'defenseDown', 'powerUp', 'cleanse'].forEach(e => unlocked.add(e));
  if (level >= 17) ['silence'].forEach(e => unlocked.add(e));
  return unlocked;
}

export function getNextStatusTier(level) {
  if (level < 5) return { level: 5, effects: ['weaken', 'ward', 'regeneration'] };
  if (level < 9) return { level: 9, effects: ['slow', 'blind', 'shield'] };
  if (level < 13) return { level: 13, effects: ['poison', 'defenseDown', 'powerUp', 'cleanse'] };
  if (level < 17) return { level: 17, effects: ['silence'] };
  return null;
}

export function isEffectUnlocked(effectId, level) {
  if (!effectId) return true;
  return getUnlockedEffectsByLevel(level).has(effectId);
}

function readableEffect(effectId) {
  if (!effectId) return 'effect';
  return effectId.charAt(0).toUpperCase() + effectId.slice(1);
}

export function statusTelegraph(casterName, spellId, level) {
  const spell = ELEMENTS[spellId] ?? ELEMENTS.fusion;
  const effectId = spell.effectId;
  if (!effectId) return '';
  if (!isEffectUnlocked(effectId, level)) return '';
  return `${casterName} prepares ${spell.name} (${readableEffect(effectId)}).`;
}

export function applyStatusDecay(unit) {
  Object.keys(unit.buffs).forEach(k => {
    unit.buffs[k] -= 1;
    if (unit.buffs[k] <= 0) delete unit.buffs[k];
  });
  Object.keys(unit.debuffs).forEach(k => {
    unit.debuffs[k] -= 1;
    if (unit.debuffs[k] <= 0) delete unit.debuffs[k];
  });
}

export function applySpell(caster, target, spellId, levelForEffects) {
  const spell = ELEMENTS[spellId] ?? ELEMENTS.fusion;
  let log = `${spell.name} cast.`;

  if (spell.spellType === 'damage') {
    let dmg = spell.attack ?? 10;
    if (caster.buffs.powerUp) dmg = Math.round(dmg * 1.3);
    if (target.debuffs.defenseDown) dmg = Math.round(dmg * 1.2);
    if (target.buffs.shield) dmg = Math.round(dmg * 0.6);
    if (target.debuffs.weakSpot) dmg = Math.round(dmg * 1.35);
    target.currentHp = clamp(target.currentHp - dmg, 0, target.maxHp);
    if (spell.effectId && spell.effectId !== 'regeneration' && isEffectUnlocked(spell.effectId, levelForEffects)) {
      target.debuffs[spell.effectId] = 2;
    }
    log = `${spell.name} deals ${dmg} damage.`;
  } else if (spell.spellType === 'heal') {
    const heal = spell.heal ?? 12;
    caster.currentHp = clamp(caster.currentHp + heal, 0, caster.maxHp);
    if (spell.effectId === 'regeneration' && isEffectUnlocked('regeneration', levelForEffects)) caster.buffs.regeneration = 2;
    if (spell.effectId === 'cleanse' && isEffectUnlocked('cleanse', levelForEffects)) caster.debuffs = {};
    log = `${spell.name} heals ${heal}.`;
  } else if (spell.spellType === 'buff') {
    const buffId = spell.effectId ?? 'powerUp';
    if (isEffectUnlocked(buffId, levelForEffects)) {
      caster.buffs[buffId] = 2;
      log = `${spell.name} grants ${buffId}.`;
    } else {
      log = `${spell.name} pulses but no status takes hold yet.`;
    }
  } else if (spell.spellType === 'debuff') {
    const debuffId = spell.effectId ?? 'weaken';
    if (isEffectUnlocked(debuffId, levelForEffects)) {
      target.debuffs[debuffId] = 2;
      log = `${spell.name} inflicts ${debuffId}.`;
    } else {
      log = `${spell.name} strikes, but advanced status is dormant.`;
    }
  }

  if (caster.buffs.regeneration) {
    caster.currentHp = clamp(caster.currentHp + 6, 0, caster.maxHp);
    log += ' Regeneration restores 6 HP.';
  }

  applyStatusDecay(caster);
  applyStatusDecay(target);
  return log;
}

export function applyTurnStartEffects(unit) {
  let log = '';
  if (unit.debuffs.poison) {
    unit.currentHp = clamp(unit.currentHp - 5, 0, unit.maxHp);
    log = ' Poison deals 5.';
  }
  if (unit.buffs.regeneration) {
    unit.currentHp = clamp(unit.currentHp + 4, 0, unit.maxHp);
    log += ' Regeneration heals 4.';
  }
  return log;
}

export function isTurnBlocked(unit) {
  if (unit.debuffs.silence) return { blocked: true, reason: 'silenced' };
  if (unit.debuffs.slow && Math.random() < 0.25) return { blocked: true, reason: 'slowed' };
  if (unit.debuffs.blind && Math.random() < 0.25) return { blocked: true, reason: 'blinded' };
  return { blocked: false, reason: '' };
}

export function getOpponentCastOptions(enemy, playerState) {
  const options = enemy.spellIds.filter(id => {
    if (!ELEMENTS[id]) return false;
    if (enemy.isBoss) return true;
    return playerState.discoveredSpells.has(id) || BASE_ELEMENTS.includes(id) || playerState.unlockedElements.has(id);
  });
  return options.length ? options : ['fusion'];
}

export function chooseEnemySpell(enemy, options, enemyUnit, playerUnit) {
  const tier = enemy.aiTier ?? (enemy.isBoss ? 'boss' : 'basic');
  const weighted = options.map(id => {
    const spell = ELEMENTS[id] ?? ELEMENTS.fusion;
    let score = 1;

    if (tier === 'basic') {
      if (spell.spellType === 'damage') score += 2;
      if (spell.spellType === 'heal' && enemyUnit.currentHp < enemyUnit.maxHp * 0.45) score += 1.2;
      if (spell.spellType === 'debuff') score += 0.5;
      if (spell.spellType === 'heal' && enemy.recentSpells?.includes(id)) score -= 1.3;
      return { id, score };
    }

    if (tier === 'adaptive') {
      if (spell.spellType === 'damage') score += 2;
      if (spell.spellType === 'heal' && enemyUnit.currentHp < enemyUnit.maxHp * 0.55) score += 1.7;
      if (spell.spellType === 'buff' && !enemyUnit.buffs[spell.effectId ?? 'powerUp']) score += 2;
      if (spell.spellType === 'debuff' && !playerUnit.debuffs[spell.effectId ?? 'weaken']) score += 2;
      if (playerUnit.currentHp < playerUnit.maxHp * 0.35 && spell.spellType === 'damage') score += 1.5;
      if (spell.spellType === 'heal' && enemy.recentSpells?.includes(id)) score -= 1.6;
      return { id, score };
    }

    if (spell.spellType === 'heal' && enemyUnit.currentHp < enemyUnit.maxHp * 0.55) score += 2.2;
    if (spell.spellType === 'buff' && !enemyUnit.buffs[spell.effectId ?? 'powerUp']) score += 3;
    if (spell.spellType === 'debuff' && !playerUnit.debuffs[spell.effectId ?? 'weaken']) score += 3;
    if (spell.spellType === 'damage') score += 2.5;
    if (playerUnit.currentHp < playerUnit.maxHp * 0.4 && spell.spellType === 'damage') score += 2;
    if (spell.spellType === 'heal' && enemy.recentSpells?.includes(id)) score -= 2.1;
    score += Math.random() * 0.7;
    return { id, score };
  });

  const total = weighted.reduce((sum, item) => sum + item.score, 0);
  let roll = Math.random() * total;
  for (const item of weighted) {
    roll -= item.score;
    if (roll <= 0) return item.id;
  }
  return weighted[weighted.length - 1]?.id ?? 'fusion';
}
