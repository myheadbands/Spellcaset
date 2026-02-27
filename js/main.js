import { BASE_ELEMENTS, ELEMENTS } from "./data/elements.js";
import { combineElements, getAllRecipeRows } from "./data/recipes.js";
import { LEVELS, getLevel } from "./data/opponents.js";

const MAX_PLAYER_HP = 180;

const state = {
  screen: "menu",
  levelIndex: 0,
  player: {
    hp: 120,
    maxHp: MAX_PLAYER_HP,
    unlockedElements: new Set(["fire"]),
    discoveredSpells: new Set(["fire"]),
    seenFromEnemy: new Set(),
    buffs: {},
    debuffs: {}
  },
  enemy: null,
  turn: "player",
  phase: "menu",
  event: {
    weakSpotDiscovered: false,
    weakSpotTurns: 0,
    promptShownByLevel: {},
    pending: false
  },
  selectedStartElement: "fire",
  latestSuccessUnlock: null
};

const els = {
  screens: {
    menu: document.getElementById("menu-screen"),
    game: document.getElementById("game-screen"),
    success: document.getElementById("success-screen"),
    gameover: document.getElementById("gameover-screen")
  },
  playBtn: document.getElementById("play-btn"),
  recipesBtn: document.getElementById("recipes-btn"),
  recipesInGameBtn: document.getElementById("recipes-in-game-btn"),
  closeRecipesBtn: document.getElementById("close-recipes-btn"),
  startElement: document.getElementById("start-element"),
  levelLabel: document.getElementById("level-label"),
  turnLabel: document.getElementById("turn-label"),
  battleLog: document.getElementById("battle-log"),
  enemyName: document.getElementById("enemy-name"),
  playerHpFill: document.getElementById("player-hp-fill"),
  playerHpText: document.getElementById("player-hp-text"),
  enemyHpFill: document.getElementById("enemy-hp-fill"),
  enemyHpText: document.getElementById("enemy-hp-text"),
  playerStatuses: document.getElementById("player-statuses"),
  enemyStatuses: document.getElementById("enemy-statuses"),
  inventoryList: document.getElementById("inventory-list"),
  seenList: document.getElementById("seen-list"),
  workspace: document.getElementById("workspace"),
  fxLayer: document.getElementById("fx-layer"),
  castZone: document.getElementById("cast-zone"),
  statusTierInfo: document.getElementById("status-tier-info"),
  encounterBanner: document.getElementById("encounter-banner"),
  encounterBannerTitle: document.getElementById("encounter-banner-title"),
  encounterBannerText: document.getElementById("encounter-banner-text"),
  transitionCard: document.getElementById("transition-card"),
  transitionCardTitle: document.getElementById("transition-card-title"),
  transitionCardText: document.getElementById("transition-card-text"),
  narrativeEvent: document.getElementById("narrative-event"),
  narrativeEventText: document.getElementById("narrative-event-text"),
  eventAttackLifeBtn: document.getElementById("event-attack-life-btn"),
  eventIgnoreBtn: document.getElementById("event-ignore-btn"),
  successText: document.getElementById("success-text"),
  healBtn: document.getElementById("heal-btn"),
  nextBtn: document.getElementById("next-btn"),
  retryBtn: document.getElementById("retry-btn"),
  menuBtn: document.getElementById("menu-btn"),
  recipesModal: document.getElementById("recipes-modal"),
  recipesList: document.getElementById("recipes-list")
};

let pointerDrag = null;
let dragGhost = null;
let workspaceRuntimeId = 0;
const announcedStatusLevels = new Set();

function showScreen(name) {
  Object.values(els.screens).forEach((node) => node.classList.remove("active"));
  els.screens[name].classList.add("active");
  state.screen = name;
  if (name === "menu") {
    document.body.classList.add("menu-mode");
  } else {
    document.body.classList.remove("menu-mode");
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showEncounterBanner(title, text) {
  if (!els.encounterBanner) return;
  els.encounterBannerTitle.textContent = title;
  els.encounterBannerText.textContent = text;
  els.encounterBanner.classList.remove("hidden");
}

function hideEncounterBanner() {
  if (!els.encounterBanner) return;
  els.encounterBanner.classList.add("hidden");
}

function hideNarrativeEvent() {
  if (!els.narrativeEvent) return;
  els.narrativeEvent.classList.add("hidden");
  state.event.pending = false;
}

function showNarrativeEvent(text) {
  if (!els.narrativeEvent) return;
  els.narrativeEventText.textContent = text;
  els.narrativeEvent.classList.remove("hidden");
  state.event.pending = true;
}

async function showTransitionCard(title, text, duration = 950) {
  if (!els.transitionCard) return;
  els.transitionCardTitle.textContent = title;
  els.transitionCardText.textContent = text;
  els.transitionCard.classList.remove("hidden");
  await wait(duration);
  els.transitionCard.classList.add("hidden");
}

function getUnlockedEffectsByLevel(level) {
  const unlocked = new Set();
  if (level >= 5) ["weaken", "ward", "regeneration"].forEach((e) => unlocked.add(e));
  if (level >= 9) ["slow", "blind", "shield"].forEach((e) => unlocked.add(e));
  if (level >= 13) ["poison", "defenseDown", "powerUp", "cleanse"].forEach((e) => unlocked.add(e));
  if (level >= 17) ["silence"].forEach((e) => unlocked.add(e));
  return unlocked;
}

function getNextStatusTier(level) {
  if (level < 5) return { level: 5, effects: ["weaken", "ward", "regeneration"] };
  if (level < 9) return { level: 9, effects: ["slow", "blind", "shield"] };
  if (level < 13) return { level: 13, effects: ["poison", "defenseDown", "powerUp", "cleanse"] };
  if (level < 17) return { level: 17, effects: ["silence"] };
  return null;
}

function isEffectUnlocked(effectId, level) {
  if (!effectId) return true;
  return getUnlockedEffectsByLevel(level).has(effectId);
}

function readableEffect(effectId) {
  if (!effectId) return "effect";
  return effectId.charAt(0).toUpperCase() + effectId.slice(1);
}

function statusTelegraph(casterName, spellId, level) {
  const spell = ELEMENTS[spellId] ?? ELEMENTS.fusion;
  const effectId = spell.effectId;
  if (!effectId) return "";
  if (!isEffectUnlocked(effectId, level)) return "";
  if (spell.spellType !== "buff" && spell.spellType !== "debuff" && spell.spellType !== "damage" && spell.spellType !== "heal") return "";
  return `${casterName} prepares ${spell.name} (${readableEffect(effectId)}).`;
}

function statusProgressText(level) {
  if (announcedStatusLevels.has(level)) return "";
  let text = "";
  if (level === 5) text = "Status tier unlocked: Weaken, Ward, Regeneration.";
  if (level === 9) text = "Status tier unlocked: Slow, Blind, Shield.";
  if (level === 13) text = "Status tier unlocked: Poison, DefenseDown, PowerUp, Cleanse.";
  if (level === 17) text = "Status tier unlocked: Silence.";
  if (text) announcedStatusLevels.add(level);
  return text;
}

function hasUnlocked(id) {
  return state.player.unlockedElements.has(id);
}

function hasAccessToSpell(spellId) {
  return hasUnlocked(spellId) || state.player.discoveredSpells.has(spellId);
}

function createEnemy(levelDef) {
  return {
    ...levelDef,
    currentHp: levelDef.hp,
    buffs: {},
    debuffs: {}
  };
}

function resetRun() {
  state.levelIndex = 0;
  state.player.hp = 120;
  state.player.maxHp = MAX_PLAYER_HP;
  state.player.unlockedElements = new Set([state.selectedStartElement]);
  state.player.discoveredSpells = new Set([state.selectedStartElement]);
  state.player.seenFromEnemy = new Set();
  state.player.buffs = {};
  state.player.debuffs = {};
  state.latestSuccessUnlock = null;
  state.phase = "menu";
  state.event = {
    weakSpotDiscovered: false,
    weakSpotTurns: 0,
    promptShownByLevel: {},
    pending: false
  };
}

function levelPanel(which) {
  return which === "player"
    ? els.playerHpFill.closest(".panel")
    : els.enemyHpFill.closest(".panel");
}

function animatePanel(which, kind) {
  const node = levelPanel(which);
  if (!node) return;
  const cls = kind === "heal" ? "panel-heal" : "panel-hit";
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

function castPulse() {
  els.castZone.classList.remove("cast-pulse");
  void els.castZone.offsetWidth;
  els.castZone.classList.add("cast-pulse");
}

function animateProjectile(toEnemy) {
  const fromRect = els.castZone.getBoundingClientRect();
  const toRect = (toEnemy ? els.enemyHpFill : els.playerHpFill).getBoundingClientRect();
  const fx = document.createElement("div");
  fx.className = "spell-projectile";
  document.body.appendChild(fx);

  const sx = fromRect.left + fromRect.width / 2;
  const sy = fromRect.top + fromRect.height / 2;
  const tx = toRect.left + toRect.width / 2;
  const ty = toRect.top + toRect.height / 2;
  const start = performance.now();
  const duration = 300;

  function step(now) {
    const p = Math.min(1, (now - start) / duration);
    const x = sx + (tx - sx) * p;
    const y = sy + (ty - sy) * p;
    fx.style.left = `${x}px`;
    fx.style.top = `${y}px`;
    if (p < 1) {
      requestAnimationFrame(step);
    } else {
      fx.remove();
    }
  }
  requestAnimationFrame(step);
}

function applyStatusDecay(unit) {
  Object.keys(unit.buffs).forEach((k) => {
    unit.buffs[k] -= 1;
    if (unit.buffs[k] <= 0) delete unit.buffs[k];
  });
  Object.keys(unit.debuffs).forEach((k) => {
    unit.debuffs[k] -= 1;
    if (unit.debuffs[k] <= 0) delete unit.debuffs[k];
  });
}

function applySpell(caster, target, spellId, levelForEffects) {
  const spell = ELEMENTS[spellId] ?? ELEMENTS.fusion;
  let log = `${spell.name} cast.`;

  if (spell.spellType === "damage") {
    let dmg = spell.attack ?? 10;
    if (caster.buffs.powerUp) dmg = Math.round(dmg * 1.3);
    if (target.debuffs.defenseDown) dmg = Math.round(dmg * 1.2);
    if (target.buffs.shield) dmg = Math.round(dmg * 0.6);
    if (target.debuffs.weakSpot) dmg = Math.round(dmg * 1.35);
    target.currentHp = clamp(target.currentHp - dmg, 0, target.maxHp);
    if (spell.effectId && spell.effectId !== "regeneration" && isEffectUnlocked(spell.effectId, levelForEffects)) {
      target.debuffs[spell.effectId] = 2;
    }
    log = `${spell.name} deals ${dmg} damage.`;
  } else if (spell.spellType === "heal") {
    const heal = spell.heal ?? 12;
    caster.currentHp = clamp(caster.currentHp + heal, 0, caster.maxHp);
    if (spell.effectId === "regeneration" && isEffectUnlocked("regeneration", levelForEffects)) caster.buffs.regeneration = 2;
    if (spell.effectId === "cleanse" && isEffectUnlocked("cleanse", levelForEffects)) caster.debuffs = {};
    log = `${spell.name} heals ${heal}.`;
  } else if (spell.spellType === "buff") {
    const buffId = spell.effectId ?? "powerUp";
    if (isEffectUnlocked(buffId, levelForEffects)) {
      caster.buffs[buffId] = 2;
      log = `${spell.name} grants ${buffId}.`;
    } else {
      log = `${spell.name} pulses but no status takes hold yet.`;
    }
  } else if (spell.spellType === "debuff") {
    const debuffId = spell.effectId ?? "weaken";
    if (isEffectUnlocked(debuffId, levelForEffects)) {
      target.debuffs[debuffId] = 2;
      log = `${spell.name} inflicts ${debuffId}.`;
    } else {
      log = `${spell.name} strikes, but advanced status is dormant.`;
    }
  }

  if (caster.buffs.regeneration) {
    caster.currentHp = clamp(caster.currentHp + 6, 0, caster.maxHp);
    log += " Regeneration restores 6 HP.";
  }

  applyStatusDecay(caster);
  applyStatusDecay(target);
  return log;
}

function applyTurnStartEffects(unit) {
  let log = "";
  if (unit.debuffs.poison) {
    unit.currentHp = clamp(unit.currentHp - 5, 0, unit.maxHp);
    log = " Poison deals 5.";
  }
  if (unit.buffs.regeneration) {
    unit.currentHp = clamp(unit.currentHp + 4, 0, unit.maxHp);
    log += " Regeneration heals 4.";
  }
  return log;
}

function isTurnBlocked(unit) {
  if (unit.debuffs.silence) return { blocked: true, reason: "silenced" };
  if (unit.debuffs.slow && Math.random() < 0.25) return { blocked: true, reason: "slowed" };
  if (unit.debuffs.blind && Math.random() < 0.25) return { blocked: true, reason: "blinded" };
  return { blocked: false, reason: "" };
}

function getOpponentCastOptions(enemy) {
  const options = enemy.spellIds.filter((id) => {
    if (!ELEMENTS[id]) return false;
    if (enemy.isBoss) return true;
    return hasAccessToSpell(id) || BASE_ELEMENTS.includes(id) || state.player.unlockedElements.has(id);
  });
  return options.length ? options : ["fusion"];
}

function chooseEnemySpell(enemy, options, enemyUnit, playerUnit) {
  const tier = enemy.aiTier ?? (enemy.isBoss ? "boss" : "basic");
  const weighted = options.map((id) => {
    const spell = ELEMENTS[id] ?? ELEMENTS.fusion;
    let score = 1;

    if (tier === "basic") {
      if (spell.spellType === "damage") score += 2;
      if (spell.spellType === "heal" && enemyUnit.currentHp < enemyUnit.maxHp * 0.45) score += 1.2;
      if (spell.spellType === "debuff") score += 0.5;
      if (spell.spellType === "heal" && enemy.recentSpells?.includes(id)) score -= 1.3;
      return { id, score };
    }

    if (tier === "adaptive") {
      if (spell.spellType === "damage") score += 2;
      if (spell.spellType === "heal" && enemyUnit.currentHp < enemyUnit.maxHp * 0.55) score += 1.7;
      if (spell.spellType === "buff" && !enemyUnit.buffs[spell.effectId ?? "powerUp"]) score += 2;
      if (spell.spellType === "debuff" && !playerUnit.debuffs[spell.effectId ?? "weaken"]) score += 2;
      if (playerUnit.currentHp < playerUnit.maxHp * 0.35 && spell.spellType === "damage") score += 1.5;
      if (spell.spellType === "heal" && enemy.recentSpells?.includes(id)) score -= 1.6;
      return { id, score };
    }

    if (spell.spellType === "heal" && enemyUnit.currentHp < enemyUnit.maxHp * 0.55) score += 2.2;
    if (spell.spellType === "buff" && !enemyUnit.buffs[spell.effectId ?? "powerUp"]) score += 3;
    if (spell.spellType === "debuff" && !playerUnit.debuffs[spell.effectId ?? "weaken"]) score += 3;
    if (spell.spellType === "damage") score += 2.5;
    if (playerUnit.currentHp < playerUnit.maxHp * 0.4 && spell.spellType === "damage") score += 2;
    if (spell.spellType === "heal" && enemy.recentSpells?.includes(id)) score -= 2.1;
    score += Math.random() * 0.7;
    return { id, score };
  });

  const total = weighted.reduce((sum, item) => sum + item.score, 0);
  let roll = Math.random() * total;
  for (const item of weighted) {
    roll -= item.score;
    if (roll <= 0) return item.id;
  }
  return weighted[weighted.length - 1]?.id ?? "fusion";
}

async function enemyTurn() {
  if (state.phase !== "combat") return;
  state.turn = "enemy";
  renderHeader();
  const enemy = state.enemy;
  if (!enemy) return;
  const enemyUnitStart = {
    currentHp: state.enemy.currentHp,
    maxHp: state.enemy.hp,
    buffs: state.enemy.buffs,
    debuffs: state.enemy.debuffs
  };
  const startLog = applyTurnStartEffects(enemyUnitStart);
  state.enemy.currentHp = enemyUnitStart.currentHp;
  state.enemy.buffs = enemyUnitStart.buffs;
  state.enemy.debuffs = enemyUnitStart.debuffs;
  if (state.enemy.currentHp <= 0) {
    els.battleLog.textContent = `Enemy suffered attrition.${startLog}`;
    onLevelWon();
    return;
  }
  const block = isTurnBlocked(enemyUnitStart);
  if (block.blocked) {
    els.battleLog.textContent = `${enemy.name} is ${block.reason} and loses the turn.${startLog}`;
    state.turn = "player";
    renderGame();
    return;
  }
  const options = getOpponentCastOptions(enemy);
  const picked = chooseEnemySpell(enemy, options, enemyUnitStart, {
    currentHp: state.player.hp,
    maxHp: state.player.maxHp,
    buffs: state.player.buffs,
    debuffs: state.player.debuffs
  });
  enemy.recentSpells = enemy.recentSpells || [];
  enemy.recentSpells.push(picked);
  if (enemy.recentSpells.length > 2) enemy.recentSpells.shift();

  if (!state.player.discoveredSpells.has(picked)) {
    state.player.seenFromEnemy.add(picked);
  }

  const telegraph = statusTelegraph(enemy.name, picked, enemy.level);
  if (telegraph) {
    els.battleLog.textContent = telegraph;
    await wait(480);
  }

  const playerUnit = {
    currentHp: state.player.hp,
    maxHp: state.player.maxHp,
    buffs: state.player.buffs,
    debuffs: state.player.debuffs
  };
  const enemyUnit = {
    currentHp: state.enemy.currentHp,
    maxHp: state.enemy.hp,
    buffs: state.enemy.buffs,
    debuffs: state.enemy.debuffs
  };

  const log = applySpell(enemyUnit, playerUnit, picked, enemy.level);
  state.player.hp = playerUnit.currentHp;
  state.enemy.currentHp = enemyUnit.currentHp;
  state.player.buffs = playerUnit.buffs;
  state.player.debuffs = playerUnit.debuffs;
  state.enemy.buffs = enemyUnit.buffs;
  state.enemy.debuffs = enemyUnit.debuffs;

  animateProjectile(false);
  const enemySpell = ELEMENTS[picked] ?? ELEMENTS.fusion;
  if (enemySpell.spellType === "heal" || enemySpell.spellType === "buff") {
    animatePanel("enemy", "heal");
  } else {
    animatePanel("player", "hit");
  }
  els.battleLog.textContent = `${enemy.name}: ${log}`;

  if (state.player.hp <= 0) {
    showScreen("gameover");
    return;
  }
  state.turn = "player";
  renderGame();
}

function castPlayerSpell(spellId) {
  if (state.event.pending) return;
  if (state.phase !== "combat") return;
  if (state.turn !== "player") return;
  if (!hasAccessToSpell(spellId)) return;

  const playerUnit = {
    currentHp: state.player.hp,
    maxHp: state.player.maxHp,
    buffs: state.player.buffs,
    debuffs: state.player.debuffs
  };
  const enemyUnit = {
    currentHp: state.enemy.currentHp,
    maxHp: state.enemy.hp,
    buffs: state.enemy.buffs,
    debuffs: state.enemy.debuffs
  };

  const startLog = applyTurnStartEffects(playerUnit);
  const block = isTurnBlocked(playerUnit);
  if (block.blocked) {
    state.player.hp = playerUnit.currentHp;
    state.player.buffs = playerUnit.buffs;
    state.player.debuffs = playerUnit.debuffs;
    els.battleLog.textContent = `Wizard is ${block.reason} and loses the turn.${startLog}`;
    renderGame();
    setTimeout(enemyTurn, 500);
    return;
  }

  const playerLevel = state.enemy?.level ?? 1;
  const telegraph = statusTelegraph("Wizard", spellId, playerLevel);
  if (telegraph) {
    els.battleLog.textContent = telegraph;
  }

  const log = applySpell(playerUnit, enemyUnit, spellId, playerLevel);
  state.player.hp = playerUnit.currentHp;
  state.enemy.currentHp = enemyUnit.currentHp;
  state.player.buffs = playerUnit.buffs;
  state.player.debuffs = playerUnit.debuffs;
  state.enemy.buffs = enemyUnit.buffs;
  state.enemy.debuffs = enemyUnit.debuffs;

  castPulse();
  animateProjectile(true);
  const spell = ELEMENTS[spellId] ?? ELEMENTS.fusion;
  if (spell.spellType === "heal" || spell.spellType === "buff") {
    animatePanel("player", "heal");
  } else {
    animatePanel("enemy", "hit");
  }
  state.player.discoveredSpells.add(spellId);
  state.player.seenFromEnemy.delete(spellId);

  els.battleLog.textContent = `Wizard: ${log}${startLog}`;

  if (state.enemy.currentHp <= 0) {
    onLevelWon();
    return;
  }
  maybeTriggerWeakSpotEvent();
  renderGame();
  setTimeout(enemyTurn, 700);
}

function onLevelWon() {
  const current = getLevel(state.levelIndex);
  state.latestSuccessUnlock = null;
  if (current?.isBoss && current.unlockElement && !state.player.unlockedElements.has(current.unlockElement)) {
    state.player.unlockedElements.add(current.unlockElement);
    state.player.discoveredSpells.add(current.unlockElement);
    state.latestSuccessUnlock = current.unlockElement;
  }

  const narrativeBeat = current?.defeatLine ? `${current.defeatLine} ` : "";
  const unlockText = state.latestSuccessUnlock
    ? `${narrativeBeat}You defeated ${current.name} and unlocked ${ELEMENTS[state.latestSuccessUnlock]?.name ?? state.latestSuccessUnlock}.`
    : `${narrativeBeat}You defeated ${current.name}.`;
  els.successText.textContent = unlockText;
  state.phase = "levelClear";
  hideNarrativeEvent();
  showScreen("success");
}

async function runEncounterIntro(def) {
  state.phase = "encounterIntro";
  const introTitle = def.isBoss ? "Boss Encounter" : "Encounter";
  const introText = def.isBoss ? (def.bossLine || def.introLine || `Prepare for ${def.name}.`) : (def.introLine || `Facing ${def.name}.`);
  showEncounterBanner(introTitle, introText);
  await showTransitionCard(`Level ${def.level}`, def.name, 760);
}

async function startLevel() {
  const def = getLevel(state.levelIndex);
  if (!def) {
    showScreen("menu");
    return;
  }
  state.enemy = createEnemy(def);
  state.turn = "player";
  state.phase = "encounterIntro";
  [...els.workspace.querySelectorAll(".workspace-chip")].forEach((n) => n.remove());
  showScreen("game");
  await runEncounterIntro(def);
  state.phase = "combat";
  hideNarrativeEvent();
  state.event.weakSpotDiscovered = def.level >= 7;
  state.event.weakSpotTurns = 0;
  if (!state.event.promptShownByLevel[def.level] && def.level >= 7) {
    showNarrativeEvent(def.level >= 14
      ? "You sense unstable life threads in the enemy core. Strike life energy to expose weak spots."
      : "Your sigils reveal faint weak spots in enemy life energy. You can choose to attack them.");
    state.event.promptShownByLevel[def.level] = true;
  }
  renderGame();
  const progText = statusProgressText(def.level);
  if (progText) {
    els.battleLog.textContent = progText;
  } else {
    els.battleLog.textContent = def.introLine || `Facing ${def.name}.`;
  }
}

function advanceLevel() {
  state.phase = "transition";
  state.levelIndex += 1;
  if (state.levelIndex >= LEVELS.length) {
    hideEncounterBanner();
    showScreen("menu");
    return;
  }
  startLevel();
}

function renderHeader() {
  const enemy = state.enemy;
  els.levelLabel.textContent = `Level ${enemy?.level ?? "-"}`;
  els.turnLabel.textContent = state.turn === "player" ? "Your turn" : "Enemy turn";
  els.enemyName.textContent = enemy?.name ?? "";
  els.playerHpText.textContent = `${state.player.hp}/${state.player.maxHp}`;
  els.enemyHpText.textContent = `${enemy?.currentHp ?? 0}/${enemy?.hp ?? 0}`;
  els.playerHpFill.style.width = `${(state.player.hp / state.player.maxHp) * 100}%`;
  els.enemyHpFill.style.width = `${((enemy?.currentHp ?? 0) / (enemy?.hp ?? 1)) * 100}%`;
  renderStatuses(els.playerStatuses, state.player.buffs, state.player.debuffs);
  renderStatuses(els.enemyStatuses, state.enemy?.buffs ?? {}, state.enemy?.debuffs ?? {});
  renderStatusTierInfo();
  if (enemy) {
    const bannerText = state.phase === "combat"
      ? (enemy.isBoss ? "Boss battle in progress" : "Battle in progress")
      : (enemy.isBoss ? "Boss prepares arcane assault" : "Encounter begins");
    showEncounterBanner(`Level ${enemy.level}`, bannerText);
  } else {
    hideEncounterBanner();
  }
}

function maybeTriggerWeakSpotEvent() {
  if (!state.event.weakSpotDiscovered || !state.enemy) return;
  if (state.event.pending) return;
  if (state.enemy.currentHp <= 0) return;
  if (Math.random() < 0.22) {
    showNarrativeEvent("A weak pulse flashes through the enemy. Target life energy to expose a weak spot?");
  }
}

function chipClass(id, muted = false) {
  const spell = ELEMENTS[id] ?? ELEMENTS.fusion;
  const parts = ["chip", `spell-${spell.spellType || "damage"}`];
  if (muted) parts.push("muted");
  return parts.join(" ");
}

function renderStatuses(container, buffs, debuffs) {
  container.innerHTML = "";
  Object.entries(buffs).forEach(([name, turns]) => {
    const pill = document.createElement("span");
    pill.className = "status-pill";
    pill.textContent = `+${name} (${turns})`;
    container.appendChild(pill);
  });
  Object.entries(debuffs).forEach(([name, turns]) => {
    const pill = document.createElement("span");
    pill.className = "status-pill";
    pill.textContent = `-${name} (${turns})`;
    container.appendChild(pill);
  });
}

function renderStatusTierInfo() {
  const level = state.enemy?.level ?? 1;
  const unlocked = [...getUnlockedEffectsByLevel(level)];
  const next = getNextStatusTier(level);
  if (!els.statusTierInfo) return;

  const unlockedText = unlocked.length ? unlocked.join(", ") : "None yet";
  const nextText = next ? `Level ${next.level}: ${next.effects.join(", ")}` : "All status tiers unlocked";

  els.statusTierInfo.innerHTML = `
    <div class="status-tier-title">Status Tiers</div>
    <div class="status-tier-row"><strong>Active now:</strong> ${unlockedText}</div>
    <div class="status-tier-row"><strong>Next unlock:</strong> ${nextText}</div>
  `;
}

function createInventoryChip(id, muted = false) {
  const spell = ELEMENTS[id] ?? ELEMENTS.fusion;
  const btn = document.createElement("button");
  btn.className = chipClass(id, muted);
  btn.textContent = spell.name;
  btn.dataset.spellId = id;
  if (!muted) {
    btn.addEventListener("pointerdown", (e) => startPointerDrag(e, { id, source: "inventory", node: btn }));
  } else {
    btn.title = "Seen from enemy. Discover by crafting.";
  }
  return btn;
}

function createWorkspaceChip(id, x, y) {
  const spell = ELEMENTS[id] ?? ELEMENTS.fusion;
  const node = document.createElement("button");
  node.className = `${chipClass(id)} workspace-chip`;
  node.textContent = spell.name;
  node.dataset.spellId = id;
  node.dataset.runtimeId = `ws-${workspaceRuntimeId += 1}`;
  node.classList.add("chip-formed");
  node.title = `${spell.name} (${spell.spellType})`;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.addEventListener("animationend", () => node.classList.remove("chip-formed"), { once: true });
  node.addEventListener("pointerdown", (e) => startPointerDrag(e, { id, source: "workspace", node }));

  els.workspace.appendChild(node);
  keepWorkspaceChipInside(node);
}

function keepWorkspaceChipInside(node) {
  const rect = els.workspace.getBoundingClientRect();
  const nx = clamp(parseFloat(node.style.left || "0"), 0, Math.max(0, rect.width - node.offsetWidth));
  const ny = clamp(parseFloat(node.style.top || "0"), 0, Math.max(0, rect.height - node.offsetHeight));
  node.style.left = `${nx}px`;
  node.style.top = `${ny}px`;
}

function createDragGhost(spellId) {
  const ghost = document.createElement("div");
  ghost.className = `chip drag-ghost ${chipClass(spellId).replace("chip ", "")}`;
  ghost.textContent = ELEMENTS[spellId]?.name ?? spellId;
  document.body.appendChild(ghost);
  return ghost;
}

function clearDropHighlights() {
  els.castZone.classList.remove("active");
  [...els.workspace.querySelectorAll(".workspace-chip.drop-highlight")].forEach((n) => n.classList.remove("drop-highlight"));
}

function startPointerDrag(e, payload) {
  if (state.screen !== "game") return;
  if (state.phase !== "combat") return;
  if (state.turn !== "player" && payload.source !== "workspace") return;
  e.preventDefault();

  pointerDrag = {
    id: payload.id,
    source: payload.source,
    sourceNode: payload.node
  };
  dragGhost = createDragGhost(payload.id);
  updatePointerDrag(e.clientX, e.clientY);

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp, { once: true });
}

function updatePointerDrag(clientX, clientY) {
  if (!dragGhost || !pointerDrag) return;
  dragGhost.style.left = `${clientX}px`;
  dragGhost.style.top = `${clientY}px`;
  clearDropHighlights();

  const castRect = els.castZone.getBoundingClientRect();
  if (clientX >= castRect.left && clientX <= castRect.right && clientY >= castRect.top && clientY <= castRect.bottom) {
    els.castZone.classList.add("active");
  }

  const wsNode = pickWorkspaceTarget(clientX, clientY, pointerDrag.sourceNode);
  if (wsNode) wsNode.classList.add("drop-highlight");
}

function pickWorkspaceTarget(clientX, clientY, ignoreNode) {
  const chips = [...els.workspace.querySelectorAll(".workspace-chip")];
  for (let i = chips.length - 1; i >= 0; i -= 1) {
    const chip = chips[i];
    if (chip === ignoreNode) continue;
    const r = chip.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      return chip;
    }
  }
  return null;
}

function onPointerMove(e) {
  updatePointerDrag(e.clientX, e.clientY);
}

function endPointerDrag() {
  window.removeEventListener("pointermove", onPointerMove);
  if (dragGhost) dragGhost.remove();
  dragGhost = null;
  pointerDrag = null;
  clearDropHighlights();
}

function onPointerUp(e) {
  if (!pointerDrag) return;

  const castRect = els.castZone.getBoundingClientRect();
  const inCast = e.clientX >= castRect.left && e.clientX <= castRect.right && e.clientY >= castRect.top && e.clientY <= castRect.bottom;
  if (inCast) {
    castPlayerSpell(pointerDrag.id);
    if (pointerDrag.source === "workspace" && pointerDrag.sourceNode?.isConnected) {
      pointerDrag.sourceNode.remove();
    }
    endPointerDrag();
    return;
  }

  const combineTarget = pickWorkspaceTarget(e.clientX, e.clientY, pointerDrag.sourceNode);
  if (combineTarget) {
    const resultId = combineElements(combineTarget.dataset.spellId, pointerDrag.id);
    const wsRect = els.workspace.getBoundingClientRect();
    createWorkspaceChip(resultId, e.clientX - wsRect.left - 30, e.clientY - wsRect.top - 15);
    state.player.discoveredSpells.add(resultId);
    state.player.seenFromEnemy.delete(resultId);
    if (pointerDrag.source === "workspace" && pointerDrag.sourceNode?.isConnected) {
      pointerDrag.sourceNode.remove();
    }
    combineTarget.remove();
    renderInventory();
    els.battleLog.textContent = `Combined ${ELEMENTS[combineTarget.dataset.spellId]?.name ?? combineTarget.dataset.spellId} + ${ELEMENTS[pointerDrag.id]?.name ?? pointerDrag.id} -> ${ELEMENTS[resultId]?.name ?? resultId}.`;
    endPointerDrag();
    return;
  }

  const wsRect = els.workspace.getBoundingClientRect();
  const inWorkspace = e.clientX >= wsRect.left && e.clientX <= wsRect.right && e.clientY >= wsRect.top && e.clientY <= wsRect.bottom;
  if (inWorkspace) {
    const x = e.clientX - wsRect.left - 30;
    const y = e.clientY - wsRect.top - 14;
    if (pointerDrag.source === "workspace" && pointerDrag.sourceNode?.isConnected) {
      pointerDrag.sourceNode.style.left = `${x}px`;
      pointerDrag.sourceNode.style.top = `${y}px`;
      keepWorkspaceChipInside(pointerDrag.sourceNode);
    } else {
      createWorkspaceChip(pointerDrag.id, x, y);
    }
  }
  endPointerDrag();
}

function renderInventory() {
  els.inventoryList.innerHTML = "";
  const top = new Set([...state.player.unlockedElements, ...state.player.discoveredSpells]);
  [...top].forEach((id) => {
    if (!ELEMENTS[id]) return;
    const spell = ELEMENTS[id];
    const level = state.enemy?.level ?? 1;
    if ((spell.spellType === "buff" || spell.spellType === "debuff" || spell.effectId) && spell.effectId && !isEffectUnlocked(spell.effectId, level)) {
      return;
    }
    const chip = createInventoryChip(id, false);
    chip.title = `${spell.name} - ${spell.spellType}`;
    els.inventoryList.appendChild(chip);
  });

  els.seenList.innerHTML = "";
  [...state.player.seenFromEnemy]
    .filter((id) => !state.player.discoveredSpells.has(id))
    .forEach((id) => {
      if (!ELEMENTS[id]) return;
      const spell = ELEMENTS[id];
      const level = state.enemy?.level ?? 1;
      if ((spell.spellType === "buff" || spell.spellType === "debuff" || spell.effectId) && spell.effectId && !isEffectUnlocked(spell.effectId, level)) {
        return;
      }
      const chip = createInventoryChip(id, true);
      chip.title = `${spell.name} - Seen from enemy`;
      els.seenList.appendChild(chip);
    });
}

function countExplicitRecipes() {
  return getAllRecipeRows().length;
}

function renderGame() {
  renderHeader();
  renderInventory();
}

function renderRecipes() {
  const rows = getAllRecipeRows();
  els.recipesList.innerHTML = "";
  const countDiv = document.createElement("div");
  countDiv.className = "recipe-row";
  countDiv.textContent = `Explicit recipes: ${rows.length} (all other pairs still combine as Fusion).`;
  els.recipesList.appendChild(countDiv);
  rows.forEach((row) => {
    const div = document.createElement("div");
    div.className = "recipe-row";
    div.textContent = `${ELEMENTS[row.a]?.name ?? row.a} + ${ELEMENTS[row.b]?.name ?? row.b} -> ${row.resultName} [${row.spellType}] (${row.detail})`;
    els.recipesList.appendChild(div);
  });
}

function wireCastZone() {
  els.workspace.addEventListener("pointerdown", (e) => {
    if (e.target === els.workspace || e.target === els.fxLayer) {
      clearDropHighlights();
    }
  });
}

function wireEvents() {
  els.playBtn.addEventListener("click", () => {
    state.selectedStartElement = els.startElement.value;
    resetRun();
    startLevel();
  });
  els.recipesBtn.addEventListener("click", () => {
    renderRecipes();
    els.recipesModal.showModal();
  });
  els.recipesInGameBtn.addEventListener("click", () => {
    renderRecipes();
    els.recipesModal.showModal();
  });
  els.closeRecipesBtn.addEventListener("click", () => {
    els.recipesModal.close();
  });
  els.healBtn.addEventListener("click", () => {
    state.player.hp = clamp(state.player.hp + 25, 0, state.player.maxHp);
    showTransitionCard("Recovery", "You channel a healing pulse.", 700).then(advanceLevel);
  });
  els.nextBtn.addEventListener("click", () => {
    showTransitionCard("Advance", "A new foe approaches.", 700).then(advanceLevel);
  });
  els.retryBtn.addEventListener("click", () => {
    resetRun();
    startLevel();
  });
  els.menuBtn.addEventListener("click", () => {
    hideEncounterBanner();
    hideNarrativeEvent();
    showScreen("menu");
  });
  els.eventAttackLifeBtn.addEventListener("click", () => {
    if (!state.enemy || state.phase !== "combat") return;
    hideNarrativeEvent();
    state.enemy.debuffs.weakSpot = 2;
    state.event.weakSpotTurns = 2;
    els.battleLog.textContent = "You pierce the enemy life energy. Weak spot exposed!";
    renderGame();
  });
  els.eventIgnoreBtn.addEventListener("click", () => {
    hideNarrativeEvent();
    els.battleLog.textContent = "You hold formation and wait for a cleaner opening.";
  });

  wireCastZone();
}

function init() {
  wireEvents();
  renderRecipes();
  els.battleLog.textContent = `Loaded ${countExplicitRecipes()} explicit recipes.`;
  announcedStatusLevels.clear();
  hideEncounterBanner();
  showScreen("menu");
}

init();
