export const LEVELS = [
  { level: 1, name: "Grik the Goblin", hp: 25, isBoss: false, aiTier: "basic", spellIds: ["fire", "volcano"], introLine: "A ragged goblin darts from the smoke.", defeatLine: "Grik flees, dropping singed runes." },
  { level: 2, name: "Snag the Scout", hp: 30, isBoss: false, aiTier: "basic", spellIds: ["fire", "volcano"], introLine: "Snag whistles; embers swirl around the arena.", defeatLine: "Snag stumbles back into the ruins." },
  { level: 3, name: "Cinder the Ember", hp: 38, isBoss: false, aiTier: "basic", spellIds: ["fire", "volcano"], introLine: "Cinder steps forward, palms blazing.", defeatLine: "Cinder's flame sputters to ash." },
  { level: 4, name: "Pyra the Flameguard", hp: 50, isBoss: true, aiTier: "boss", spellIds: ["fire", "volcano", "steam"], unlockElement: "water", introLine: "The first gate opens. Pyra guards the spring sigil.", bossLine: "Pyra channels twin sigils; heat and mist converge.", defeatLine: "The spring sigil shatters free. You claim Water." },
  { level: 5, name: "Morwen the Witch", hp: 55, isBoss: false, aiTier: "basic", spellIds: ["steam", "fog", "water"], introLine: "Morwen paints fog circles on the floor.", defeatLine: "Morwen vanishes into her own mist." },
  { level: 6, name: "Drip the Danker", hp: 62, isBoss: false, aiTier: "basic", spellIds: ["water", "wave", "lake"], introLine: "Drip stomps, flooding the battleground.", defeatLine: "The flood recedes as Drip falls." },
  { level: 7, name: "Puddle", hp: 72, isBoss: false, aiTier: "adaptive", spellIds: ["wave", "rain", "lake"], introLine: "Puddle laughs and mirrors your stance.", defeatLine: "Puddle dissolves into harmless rain." },
  { level: 8, name: "Bogwart", hp: 82, isBoss: false, aiTier: "adaptive", spellIds: ["plant", "mud", "rain"], introLine: "Roots crawl up as Bogwart arrives.", defeatLine: "Bogwart sinks into the marsh." },
  { level: 9, name: "Thrain the Troll", hp: 108, isBoss: true, aiTier: "boss", spellIds: ["mountain", "lava", "mud"], unlockElement: "earth", introLine: "Stone pillars rise. Thrain blocks the mountain gate.", bossLine: "Thrain slams the ground; earth and lava answer.", defeatLine: "The mountain gate cracks open. You claim Earth." },
  { level: 10, name: "Gravel Fist", hp: 110, isBoss: false, aiTier: "adaptive", spellIds: ["earth", "mountain", "dust"], introLine: "Gravel Fist grinds boulders to powder.", defeatLine: "Gravel Fist is buried in his own dust." },
  { level: 11, name: "Sorrow the Wraith", hp: 117, isBoss: false, aiTier: "adaptive", spellIds: ["plant", "mud", "fog"], introLine: "A hollow wraith drifts between broken banners.", defeatLine: "Sorrow's echo fades into silence." },
  { level: 12, name: "Marsh Lurker", hp: 124, isBoss: false, aiTier: "adaptive", spellIds: ["mud", "fog", "rain"], introLine: "The Marsh Lurker rises from dark water.", defeatLine: "The lurker slips back beneath the mud." },
  { level: 13, name: "Dust Devil", hp: 132, isBoss: false, aiTier: "adaptive", spellIds: ["dust", "storm", "mountain"], introLine: "A dust column twists and forms a face.", defeatLine: "The storm collapses into drifting grit." },
  { level: 14, name: "Vex the Imp", hp: 144, isBoss: true, aiTier: "boss", spellIds: ["storm", "lightning", "smoke"], unlockElement: "wind", introLine: "The sky gate trembles as Vex appears.", bossLine: "Vex howls; lightning forks over your sigils.", defeatLine: "The sky gate opens. You claim Wind." },
  { level: 15, name: "Grimjaw", hp: 148, isBoss: false, aiTier: "adaptive", spellIds: ["storm", "lightning", "wave"], introLine: "Grimjaw circles, charged with static.", defeatLine: "Grimjaw crashes with a final spark." },
  { level: 16, name: "Howler", hp: 154, isBoss: false, aiTier: "adaptive", spellIds: ["wind", "storm", "dust"], introLine: "Howler's cry bends the air itself.", defeatLine: "Howler's cry breaks into a whisper." },
  { level: 17, name: "Maldred the Dark", hp: 161, isBoss: false, aiTier: "adaptive", spellIds: ["smoke", "dust", "shadow"], introLine: "Shadows stretch long as Maldred arrives.", defeatLine: "Maldred is swallowed by his own gloom." },
  { level: 18, name: "Cinderlord Vorak", hp: 176, isBoss: true, aiTier: "boss", spellIds: ["lava", "meteor", "smoke"], unlockElement: "lava", introLine: "The forge gate ignites. Vorak awaits.", bossLine: "Vorak calls meteors like hammer blows.", defeatLine: "The forge gate cools. You claim Lava." },
  { level: 19, name: "Seraphine", hp: 182, isBoss: false, aiTier: "adaptive", spellIds: ["blizzard", "rain", "fog"], introLine: "Seraphine glides in with frozen breath.", defeatLine: "Seraphine's frost melts into mist." },
  { level: 20, name: "Rime the Frostborn", hp: 198, isBoss: true, aiTier: "boss", spellIds: ["blizzard", "glacier", "storm"], unlockElement: "blizzard", introLine: "A frozen arch descends. Rime seals the path.", bossLine: "Rime carves sigils in ice and thunder.", defeatLine: "The frost arch shatters. You claim Blizzard." },
  { level: 21, name: "Malachar the Lich", hp: 220, isBoss: true, aiTier: "boss", spellIds: ["meteor", "tsunami", "shadow"], unlockElement: "shadow", introLine: "The final tower bell tolls. Malachar rises.", bossLine: "Malachar binds shadow to cataclysm.", defeatLine: "The tower kneels. You claim Shadow and victory." },
];

export function getLevel(levelIndex) {
  return LEVELS[levelIndex];
}
