/**
 * Spell icon mapping. Uses composite sprite sheets in /img/spells/.
 * Each entry: { sheet, row, col, rows, cols } for background-position.
 * Sheets: base-elements (2x2), damage-spells (2x3), special-spells (2x2).
 */
const SHEETS = {
  base: { url: '/img/spells/base-elements.png', cols: 2, rows: 2 },
  damage: { url: '/img/spells/damage-spells.png', cols: 2, rows: 3 },
  special: { url: '/img/spells/special-spells.png', cols: 2, rows: 2 },
};

const SPELL_ICON_MAP = {
  fire: { sheet: 'base', col: 0, row: 0 },
  water: { sheet: 'base', col: 1, row: 0 },
  earth: { sheet: 'base', col: 0, row: 1 },
  wind: { sheet: 'base', col: 1, row: 1 },
  steam: { sheet: 'damage', col: 0, row: 0 },
  lava: { sheet: 'damage', col: 1, row: 0 },
  storm: { sheet: 'damage', col: 0, row: 1 },
  volcano: { sheet: 'damage', col: 1, row: 1 },
  lightning: { sheet: 'damage', col: 0, row: 2 },
  meteor: { sheet: 'damage', col: 1, row: 2 },
  lake: { sheet: 'special', col: 0, row: 0 },
  mountain: { sheet: 'special', col: 1, row: 0 },
  inferno: { sheet: 'special', col: 0, row: 1 },
  apocalypse: { sheet: 'special', col: 1, row: 1 },
};

export function getSpellIconStyle(spellId) {
  const entry = SPELL_ICON_MAP[spellId];
  if (!entry) return null;

  const sheet = SHEETS[entry.sheet];
  if (!sheet) return null;

  const x = (entry.col / sheet.cols) * 100;
  const y = (entry.row / sheet.rows) * 100;

  return {
    backgroundImage: `url(${sheet.url})`,
    backgroundSize: `${sheet.cols * 100}% ${sheet.rows * 100}%`,
    backgroundPosition: `${x}% ${y}%`,
  };
}

export function hasSpellIcon(spellId) {
  return spellId in SPELL_ICON_MAP;
}
