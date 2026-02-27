/**
 * Read decompressed Infinite Craft recipes and output R(a, b, result) lines
 * for recipes where both ingredients and result map to our element ids.
 * Run after fetch-ic-recipes.js has written data/ic-recipes-decompressed.json.
 *
 *   node scripts/merge-ic-recipes.js
 *   node scripts/merge-ic-recipes.js data/ic-recipes-decompressed.json
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { recipeKey } from '../src/engine/recipes.js';
import { icNameToSpellId } from '../data/icNameToSpellId.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const defaultPath = join(root, 'data', 'ic-recipes-decompressed.json');
const inputPath = process.argv[2] || defaultPath;

function main() {
  let recipes;
  try {
    recipes = JSON.parse(readFileSync(inputPath, 'utf8'));
  } catch (e) {
    console.error('Could not read', inputPath, e.message);
    process.exit(1);
  }

  const seen = new Set();
  const out = [];
  for (const r of recipes) {
    const a = icNameToSpellId(r.first);
    const b = icNameToSpellId(r.second);
    const result = icNameToSpellId(r.result);
    if (!a || !b || !result) continue;
    const key = recipeKey(a, b);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(`  R("${a}", "${b}", "${result}"),`);
  }

  console.log('// Add to RECIPE_MAP (from IC decompressed dataset):');
  console.log(out.slice(0, 200).join('\n'));
  if (out.length > 200) console.log('  // ... and', out.length - 200, 'more');
  console.log('\nTotal mappable recipes:', out.length);
}

main();
