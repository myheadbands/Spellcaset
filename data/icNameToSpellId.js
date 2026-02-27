/**
 * Map Infinite Craft item names (normalized: lowercase, no spaces) to our element ids.
 * Used by scripts/merge-ic-recipes.js to turn decompressed IC recipes into R(a,b,result) entries.
 * Add entries when you add new elements so IC dataset merges correctly.
 */
import { ELEMENTS } from '../src/engine/elements.js';

function normalize(name) {
  return String(name).trim().toLowerCase().replace(/\s+/g, '');
}

const map = {};
for (const [id, obj] of Object.entries(ELEMENTS)) {
  if (obj && obj.name) {
    map[normalize(obj.name)] = id;
    map[id] = id;
  }
}

// Common IC names that differ from our display name
map['infinite'] = null; // skip
map['craft'] = null;
map['nessie'] = null;
map['facebook'] = null;

export function icNameToSpellId(name) {
  const id = map[normalize(name)];
  return id || null;
}

export { map as IC_NAME_TO_SPELL_ID };
