/**
 * Infinite Craft recipe decompression (same format as icscdn.vantezzen.io/recipes.json).
 * See: https://github.com/vantezzen/infinite-craft-solver
 *
 * Compressed format: { items: string[], recipes: [firstIdx, secondIdx, resultIdx][] }
 * first/second are stored alphabetically in Infinite Craft.
 */
export function decompressRecipes({ items, recipes }) {
  if (!Array.isArray(items) || !Array.isArray(recipes)) return [];
  return recipes.map((recipe) => ({
    first: items[recipe[0]] ?? '',
    second: items[recipe[1]] ?? '',
    result: items[recipe[2]] ?? '',
  }));
}

/**
 * Normalize Infinite Craft item name to our element id (lowercase, no spaces).
 * Used to map IC dataset into our RECIPE_MAP when names match.
 */
export function icNameToId(name) {
  if (typeof name !== 'string') return '';
  return name.trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Build a map from our ELEMENTS id/name to canonical id for matching IC names.
 * IC uses "Fire", "Water", "Steam", etc. We use "fire", "water", "steam".
 */
export function getOurNameToIdMap(elements) {
  const map = {};
  for (const [id, obj] of Object.entries(elements)) {
    if (obj && typeof obj.name === 'string') {
      const key = obj.name.trim().toLowerCase().replace(/\s+/g, '');
      map[key] = id;
      map[id] = id;
    }
  }
  return map;
}
