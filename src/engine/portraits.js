const ENEMY_PORTRAITS = {
  1: '/img/enemy-goblin.png',
  2: '/img/enemy-goblin.png',
  3: '/img/enemy-goblin.png',
  4: '/img/enemy-boss.png',       // Pyra the Flameguard
  5: '/img/enemy-witch.png',      // Morwen the Witch
  6: '/img/enemy-swamp.png',      // Drip the Danker
  7: '/img/enemy-swamp.png',      // Puddle
  8: '/img/enemy-swamp.png',      // Bogwart
  9: '/img/enemy-troll.png',      // Thrain the Troll
  10: '/img/enemy-troll.png',     // Gravel Fist
  11: '/img/enemy-wraith.png',    // Sorrow the Wraith
  12: '/img/enemy-swamp.png',     // Marsh Lurker
  13: '/img/enemy-goblin.png',    // Dust Devil
  14: '/img/enemy-imp.png',       // Vex the Imp
  15: '/img/enemy-goblin.png',    // Grimjaw
  16: '/img/enemy-wraith.png',    // Howler
  17: '/img/enemy-shadow.png',    // Maldred the Dark
  18: '/img/enemy-boss.png',      // Cinderlord Vorak
  19: '/img/enemy-frost.png',     // Seraphine
  20: '/img/enemy-frost.png',     // Rime the Frostborn
  21: '/img/enemy-lich.png',      // Malachar the Lich
};

export function getEnemyPortrait(level) {
  return ENEMY_PORTRAITS[level] || '/img/enemy-goblin.png';
}
