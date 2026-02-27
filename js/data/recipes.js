import { ELEMENTS } from "./elements.js";

export function recipeKey(a, b) {
  return [a, b].sort().join("|");
}

const R = (a, b, resultId) => [recipeKey(a, b), resultId];

export const RECIPE_MAP = new Map([
  R("fire", "fire", "volcano"),
  R("water", "water", "lake"),
  R("earth", "earth", "mountain"),
  R("wind", "wind", "storm"),
  R("fire", "water", "steam"),
  R("water", "earth", "plant"),
  R("water", "wind", "wave"),
  R("fire", "earth", "lava"),
  R("fire", "wind", "smoke"),
  R("earth", "wind", "dust"),
  R("steam", "water", "rain"),
  R("steam", "smoke", "fog"),
  R("steam", "earth", "mud"),
  R("storm", "fire", "lightning"),
  R("storm", "water", "tsunami"),
  R("storm", "wind", "blizzard"),
  R("blizzard", "earth", "glacier"),
  R("lava", "storm", "meteor"),
  R("shadow", "storm", "meteor"),
  R("shadow", "water", "tsunami"),
  R("shadow", "fire", "meteor"),
  R("shadow", "earth", "glacier"),

  R("steam", "fire", "cloud"),
  R("steam", "wind", "mist"),
  R("steam", "lava", "stone"),
  R("steam", "dust", "sand"),
  R("steam", "lake", "ocean"),
  R("steam", "storm", "blizzard"),
  R("lava", "water", "stone"),
  R("lava", "earth", "volcano"),
  R("lava", "wind", "ash"),
  R("lava", "smoke", "ash"),
  R("lava", "dust", "glass"),
  R("lava", "lake", "ocean"),
  R("smoke", "water", "fog"),
  R("smoke", "earth", "ash"),
  R("smoke", "wind", "storm"),
  R("smoke", "dust", "smog"),
  R("smoke", "lake", "mist"),
  R("smoke", "mountain", "cloud"),
  R("smoke", "storm", "thunder"),
  R("dust", "water", "mud"),
  R("dust", "fire", "ash"),
  R("dust", "earth", "sand"),
  R("dust", "wind", "sandstorm"),
  R("dust", "lake", "clay"),
  R("dust", "storm", "tornado"),
  R("plant", "fire", "ash"),
  R("plant", "water", "lily"),
  R("plant", "earth", "tree"),
  R("plant", "wind", "pollen"),
  R("plant", "steam", "tea"),
  R("plant", "lava", "ash"),
  R("plant", "smoke", "incense"),
  R("plant", "dust", "pollen"),
  R("plant", "lake", "lily"),
  R("plant", "mountain", "forest"),
  R("plant", "storm", "lightning"),
  R("wave", "fire", "steam"),
  R("wave", "earth", "sand"),
  R("wave", "wind", "hurricane"),
  R("wave", "lake", "ocean"),
  R("wave", "storm", "tsunami"),
  R("cloud", "fire", "lightning"),
  R("cloud", "water", "rain"),
  R("cloud", "earth", "fog"),
  R("cloud", "wind", "storm"),
  R("cloud", "steam", "mist"),
  R("cloud", "lava", "ash"),
  R("cloud", "smoke", "smog"),
  R("cloud", "dust", "sandstorm"),
  R("cloud", "lake", "mist"),
  R("cloud", "mountain", "snow"),
  R("cloud", "storm", "thunderstorm"),
  R("storm", "earth", "thunder"),
  R("storm", "smoke", "thunder"),
  R("storm", "dust", "sandstorm"),
  R("storm", "lake", "tsunami"),
  R("storm", "mountain", "blizzard"),
  R("snow", "water", "ice"),
  R("snow", "wind", "blizzard"),
  R("snow", "earth", "glacier"),
  R("snow", "fire", "water"),
  R("ice", "wind", "blizzard"),
  R("ice", "earth", "glacier"),
  R("ice", "fire", "water"),
  R("ice", "storm", "blizzard"),
  R("mud", "fire", "clay"),
  R("mud", "plant", "swamp"),
  R("mud", "water", "swamp"),
  R("sand", "fire", "glass"),
  R("sand", "water", "clay"),
  R("sand", "wind", "sandstorm"),
  R("sand", "storm", "sandstorm"),
  R("ash", "water", "mud"),
  R("ash", "wind", "smog"),
  R("ash", "earth", "clay"),
  R("stone", "fire", "lava"),
  R("stone", "water", "sand"),
  R("stone", "wind", "sand"),
  R("stone", "plant", "forest"),
  R("ocean", "fire", "steam"),
  R("ocean", "wind", "hurricane"),
  R("ocean", "storm", "tsunami"),
  R("forest", "fire", "ash"),
  R("forest", "water", "swamp"),
  R("forest", "wind", "hurricane"),
  R("tea", "storm", "thunder"),
  R("incense", "shadow", "ward"),
  R("lily", "rain", "regeneration"),
  R("pollen", "wind", "sandstorm"),
  R("pollen", "smoke", "smog")
]);

export function combineElements(a, b) {
  const key = recipeKey(a, b);
  const explicit = RECIPE_MAP.get(key);
  if (explicit && ELEMENTS[explicit]) {
    return explicit;
  }
  return "fusion";
}

export function getAllRecipeRows() {
  const rows = [];
  for (const [key, resultId] of RECIPE_MAP.entries()) {
    const [a, b] = key.split("|");
    const result = ELEMENTS[resultId] ?? ELEMENTS.fusion;
    rows.push({
      a,
      b,
      resultId,
      resultName: result.name,
      spellType: result.spellType,
      detail: result.attack ?? result.heal ?? result.effectId ?? "-"
    });
  }
  rows.sort((x, y) => x.resultName.localeCompare(y.resultName));
  return rows;
}
