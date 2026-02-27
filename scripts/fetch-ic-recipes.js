/**
 * Fetch and decompress Infinite Craft recipes (icscdn.vantezzen.io/recipes.json).
 * See: https://github.com/vantezzen/infinite-craft-solver
 *
 * Usage:
 *   node scripts/fetch-ic-recipes.js [output.json]
 *   If recipes.json is in project root (downloaded manually), uses that; else tries fetch.
 *   Writes decompressed array to output.json (default: data/ic-recipes-decompressed.json).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { decompressRecipes } from '../src/engine/infiniteCraftDecompress.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = process.argv[2] || join(root, 'data', 'ic-recipes-decompressed.json');

async function main() {
  let data;
  const localPath = join(root, 'recipes.json');
  try {
    data = JSON.parse(readFileSync(localPath, 'utf8'));
    console.log('Using local recipes.json');
  } catch {
    try {
      const res = await fetch('https://icscdn.vantezzen.io/recipes.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
      console.log('Fetched from icscdn.vantezzen.io');
    } catch (e) {
      console.error('Could not load recipes: no local recipes.json and fetch failed:', e.message);
      process.exit(1);
    }
  }

  const recipes = data.compressed !== false && data.items && data.recipes
    ? decompressRecipes({ items: data.items, recipes: data.recipes })
    : Array.isArray(data) ? data : (data.recipes || []);

  const dir = dirname(outPath);
  try { mkdirSync(dir, { recursive: true }); } catch (_) {}
  writeFileSync(outPath, JSON.stringify(recipes, null, 0), 'utf8');
  console.log('Wrote', recipes.length, 'recipes to', outPath);
}

main();
