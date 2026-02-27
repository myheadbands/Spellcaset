import { ELEMENTS, STATUS_EMOJI } from './elements.js';

/**
 * Returns a short description of what the spell does (damage, heal, effect).
 * Used for the 2s-hover tooltip on chips.
 */
export function getSpellTooltipText(spellId) {
  const spell = ELEMENTS[spellId];
  if (!spell) return '';

  const parts = [];
  if (spell.spellType === 'damage' && spell.attack != null) {
    parts.push(`${spell.attack} damage`);
  }
  if (spell.spellType === 'heal' && spell.heal != null) {
    parts.push(`${spell.heal} heal`);
  }
  if (spell.effectId) {
    const emoji = STATUS_EMOJI[spell.effectId] ?? '';
    const name = spell.effectId.charAt(0).toUpperCase() + spell.effectId.slice(1);
    parts.push(`${emoji} ${name}`);
  }
  if (spell.tier != null && spell.tier < 99) {
    parts.push(`Tier ${spell.tier}`);
  }
  return parts.length ? parts.join(' • ') : spell.spellType;
}

export function getSpellTooltipTitle(spellId) {
  const spell = ELEMENTS[spellId];
  if (!spell) return '';
  return `${spell.name} (${spell.spellType})`;
}
