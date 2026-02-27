import { create } from 'zustand';
import { ELEMENTS, BASE_ELEMENTS } from '../engine/elements.js';
import { combineElements, getRandomFizzleMessage } from '../engine/recipes.js';
import { LEVELS, getLevel } from '../engine/opponents.js';
import {
  applySpell,
  applyTurnStartEffects,
  isTurnBlocked,
  getOpponentCastOptions,
  chooseEnemySpell,
  statusTelegraph,
  getUnlockedEffectsByLevel,
  getNextStatusTier,
  isEffectUnlocked,
  getCraftingTierForLevel,
} from '../engine/gameEngine.js';

const MAX_PLAYER_HP = 180;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// Duel: HTTP polling (Vercel serverless has no WebSocket). Same origin /api/duel
let duelPollTimerId = null;

function duelApi(path = '', body = null) {
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/duel${path}`;
  return fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.json());
}

export const useGameStore = create((set, get) => ({
  screen: 'menu',
  phase: 'menu',
  levelIndex: 0,
  turn: 'player',
  battleLog: '',
  selectedStartElement: 'fire',
  latestSuccessUnlock: null,
  announcedStatusLevels: new Set(),

  // Game mode: campaign (single-player) or duel (1v1 with code)
  gameMode: 'campaign',

  // Duel state (when gameMode === 'duel')
  duelRoomCode: null,
  duelRole: null,
  duelWs: null,
  duelConnected: false,
  duelWaitingForOpponent: false,
  duelOpponentJoined: false,
  duelState: null,
  duelHostElement: null,
  duelGuestElement: null,
  duelMyElement: null,
  duelBattleLog: '',
  duelSpellEvent: null,
  duelGameOver: null,

  player: {
    hp: 120,
    maxHp: MAX_PLAYER_HP,
    unlockedElements: new Set(['fire']),
    discoveredSpells: new Set(['fire']),
    seenFromEnemy: new Set(),
    buffs: {},
    debuffs: {},
  },

  enemy: null,

  event: {
    weakSpotDiscovered: false,
    weakSpotTurns: 0,
    promptShownByLevel: {},
    pending: false,
  },

  // Spell effect event for 3D layer
  spellEvent: null,

  // Encounter banner
  encounterBanner: null,
  transitionCard: null,
  narrativeEvent: null,
  recipesModalOpen: false,
  openRecipes: () => set({ recipesModalOpen: true }),
  closeRecipes: () => set({ recipesModalOpen: false }),

  setScreen: (screen) => set({ screen }),
  setRecipesModalOpen: (open) => set({ recipesModalOpen: open }),
  setStartElement: (el) => set({ selectedStartElement: el }),

  resetRun: () => {
    const startEl = get().selectedStartElement;
    set({
      levelIndex: 0,
      phase: 'menu',
      turn: 'player',
      battleLog: '',
      latestSuccessUnlock: null,
      spellEvent: null,
      encounterBanner: null,
      transitionCard: null,
      narrativeEvent: null,
      player: {
        hp: 120,
        maxHp: MAX_PLAYER_HP,
        unlockedElements: new Set([startEl]),
        discoveredSpells: new Set([startEl]),
        seenFromEnemy: new Set(),
        buffs: {},
        debuffs: {},
      },
      enemy: null,
      event: {
        weakSpotDiscovered: false,
        weakSpotTurns: 0,
        promptShownByLevel: {},
        pending: false,
      },
    });
  },

  startLevel: async () => {
    const { levelIndex, announcedStatusLevels } = get();
    const def = getLevel(levelIndex);
    if (!def) {
      set({ screen: 'menu' });
      return;
    }

    const enemy = { ...def, currentHp: def.hp, buffs: {}, debuffs: {}, recentSpells: [] };
    set({
      enemy,
      turn: 'player',
      phase: 'encounterIntro',
      screen: 'game',
      spellEvent: null,
      narrativeEvent: null,
    });

    // Encounter intro (EncounterIntro component handles cinematic display)
    const introTitle = def.isBoss ? 'Boss Encounter' : 'Encounter';
    const introText = def.isBoss ? (def.bossLine || def.introLine) : def.introLine;
    set({ encounterBanner: { title: introTitle, text: introText } });
    await wait(def.isBoss ? 3000 : 2000);

    set({ phase: 'combat' });

    // Weak-spot setup
    const eventState = { ...get().event };
    eventState.weakSpotDiscovered = def.level >= 7;
    eventState.weakSpotTurns = 0;
    if (!eventState.promptShownByLevel[def.level] && def.level >= 7) {
      const msg = def.level >= 14
        ? 'You sense unstable life threads in the enemy core. Strike life energy to expose weak spots.'
        : 'Your sigils reveal faint weak spots in enemy life energy. You can choose to attack them.';
      set({ narrativeEvent: msg });
      eventState.pending = true;
      eventState.promptShownByLevel[def.level] = true;
    }
    set({ event: eventState });

    // Status progress
    let statusText = '';
    if (!announcedStatusLevels.has(def.level)) {
      if (def.level === 5) statusText = 'Status tier unlocked: Weaken, Ward, Regeneration.';
      if (def.level === 9) statusText = 'Status tier unlocked: Slow, Blind, Shield.';
      if (def.level === 13) statusText = 'Status tier unlocked: Poison, DefenseDown, PowerUp, Cleanse.';
      if (def.level === 17) statusText = 'Status tier unlocked: Silence.';
      if (statusText) {
        announcedStatusLevels.add(def.level);
        set({ announcedStatusLevels: new Set(announcedStatusLevels) });
      }
    }

    set({
      battleLog: statusText || def.introLine || `Facing ${def.name}.`,
      encounterBanner: {
        title: `Level ${def.level}`,
        text: def.isBoss ? 'Boss battle in progress' : 'Battle in progress',
      },
    });
  },

  castPlayerSpell: async (spellId) => {
    const state = get();
    if (state.event.pending) return;
    if (state.phase !== 'combat') return;
    if (state.turn !== 'player') return;

    const player = state.player;
    if (!player.discoveredSpells.has(spellId) && !player.unlockedElements.has(spellId)) return;

    const playerUnit = {
      currentHp: player.hp, maxHp: player.maxHp,
      buffs: { ...player.buffs }, debuffs: { ...player.debuffs },
    };
    const enemyUnit = {
      currentHp: state.enemy.currentHp, maxHp: state.enemy.hp,
      buffs: { ...state.enemy.buffs }, debuffs: { ...state.enemy.debuffs },
    };

    const startLog = applyTurnStartEffects(playerUnit);
    const block = isTurnBlocked(playerUnit);
    if (block.blocked) {
      set({
        player: { ...player, hp: playerUnit.currentHp, buffs: playerUnit.buffs, debuffs: playerUnit.debuffs },
        battleLog: `Wizard is ${block.reason} and loses the turn.${startLog}`,
      });
      await wait(300);
      get().enemyTurn();
      return;
    }

    const playerLevel = state.enemy?.level ?? 1;
    const telegraph = statusTelegraph('Wizard', spellId, playerLevel);
    if (telegraph) set({ battleLog: telegraph });

    const log = applySpell(playerUnit, enemyUnit, spellId, playerLevel);
    const spell = ELEMENTS[spellId] ?? ELEMENTS.fusion;

    const newDiscovered = new Set(player.discoveredSpells);
    newDiscovered.add(spellId);
    const newSeen = new Set(player.seenFromEnemy);
    newSeen.delete(spellId);

    set({
      player: {
        ...player,
        hp: playerUnit.currentHp,
        buffs: playerUnit.buffs,
        debuffs: playerUnit.debuffs,
        discoveredSpells: newDiscovered,
        seenFromEnemy: newSeen,
      },
      enemy: {
        ...state.enemy,
        currentHp: enemyUnit.currentHp,
        buffs: enemyUnit.buffs,
        debuffs: enemyUnit.debuffs,
      },
      battleLog: `Wizard: ${log}${startLog}`,
      spellEvent: {
        type: spell.spellType,
        spellId,
        direction: 'toEnemy',
        timestamp: Date.now(),
      },
    });

    if (enemyUnit.currentHp <= 0) {
      get().onLevelWon();
      return;
    }

    get().maybeTriggerWeakSpotEvent();
    await wait(350);
    get().enemyTurn();
  },

  enemyTurn: async () => {
    const state = get();
    if (state.phase !== 'combat') return;
    set({ turn: 'enemy' });

    const enemy = state.enemy;
    if (!enemy) return;

    const enemyUnit = {
      currentHp: enemy.currentHp, maxHp: enemy.hp,
      buffs: { ...enemy.buffs }, debuffs: { ...enemy.debuffs },
    };
    const startLog = applyTurnStartEffects(enemyUnit);

    if (enemyUnit.currentHp <= 0) {
      set({
        enemy: { ...enemy, currentHp: 0, buffs: enemyUnit.buffs, debuffs: enemyUnit.debuffs },
        battleLog: `Enemy suffered attrition.${startLog}`,
      });
      get().onLevelWon();
      return;
    }

    const block = isTurnBlocked(enemyUnit);
    if (block.blocked) {
      set({
        enemy: { ...enemy, currentHp: enemyUnit.currentHp, buffs: enemyUnit.buffs, debuffs: enemyUnit.debuffs },
        battleLog: `${enemy.name} is ${block.reason} and loses the turn.${startLog}`,
        turn: 'player',
      });
      return;
    }

    const player = get().player;
    const options = getOpponentCastOptions(enemy, player);
    const picked = chooseEnemySpell(enemy, options, enemyUnit, {
      currentHp: player.hp, maxHp: player.maxHp,
      buffs: player.buffs, debuffs: player.debuffs,
    });

    const recentSpells = [...(enemy.recentSpells || []), picked].slice(-2);

    const newSeen = new Set(player.seenFromEnemy);
    if (!player.discoveredSpells.has(picked)) newSeen.add(picked);

    const telegraph = statusTelegraph(enemy.name, picked, enemy.level);
    if (telegraph) {
      set({ battleLog: telegraph });
      await wait(280);
    }

    const playerUnit = {
      currentHp: player.hp, maxHp: player.maxHp,
      buffs: { ...player.buffs }, debuffs: { ...player.debuffs },
    };
    const eUnit = {
      currentHp: enemyUnit.currentHp, maxHp: enemy.hp,
      buffs: { ...enemyUnit.buffs }, debuffs: { ...enemyUnit.debuffs },
    };

    const log = applySpell(eUnit, playerUnit, picked, enemy.level);
    const spell = ELEMENTS[picked] ?? ELEMENTS.fusion;

    set({
      player: {
        ...player,
        hp: playerUnit.currentHp,
        buffs: playerUnit.buffs,
        debuffs: playerUnit.debuffs,
        seenFromEnemy: newSeen,
      },
      enemy: {
        ...enemy,
        currentHp: eUnit.currentHp,
        buffs: eUnit.buffs,
        debuffs: eUnit.debuffs,
        recentSpells,
      },
      battleLog: `${enemy.name}: ${log}`,
      turn: 'player',
      spellEvent: {
        type: spell.spellType,
        spellId: picked,
        direction: 'toPlayer',
        timestamp: Date.now(),
      },
    });

    if (playerUnit.currentHp <= 0) {
      set({ screen: 'gameover' });
    }
  },

  onLevelWon: () => {
    const state = get();
    const current = getLevel(state.levelIndex);
    let unlock = null;
    const player = { ...state.player };

    if (current?.isBoss && current.unlockElement && !player.unlockedElements.has(current.unlockElement)) {
      player.unlockedElements = new Set(player.unlockedElements);
      player.unlockedElements.add(current.unlockElement);
      player.discoveredSpells = new Set(player.discoveredSpells);
      player.discoveredSpells.add(current.unlockElement);
      unlock = current.unlockElement;
    }

    const narrativeBeat = current?.defeatLine ? `${current.defeatLine} ` : '';
    const unlockText = unlock
      ? `${narrativeBeat}You defeated ${current.name} and unlocked ${ELEMENTS[unlock]?.name ?? unlock}.`
      : `${narrativeBeat}You defeated ${current.name}.`;

    set({
      player,
      latestSuccessUnlock: unlock,
      phase: 'levelClear',
      screen: 'success',
      battleLog: unlockText,
      narrativeEvent: null,
      event: { ...state.event, pending: false },
    });
  },

  healAndAdvance: async () => {
    const player = get().player;
    set({
      player: { ...player, hp: clamp(player.hp + 25, 0, player.maxHp) },
      transitionCard: { title: 'Recovery', text: 'You channel a healing pulse.' },
    });
    await wait(450);
    set({ transitionCard: null });
    get().advanceLevel();
  },

  advanceLevel: () => {
    const nextIndex = get().levelIndex + 1;
    if (nextIndex >= LEVELS.length) {
      set({ screen: 'menu', encounterBanner: null });
      return;
    }
    set({ levelIndex: nextIndex });
    get().startLevel();
  },

  skipAndAdvance: async () => {
    set({ transitionCard: { title: 'Advance', text: 'A new foe approaches.' } });
    await wait(450);
    set({ transitionCard: null });
    get().advanceLevel();
  },

  maybeTriggerWeakSpotEvent: () => {
    const state = get();
    if (!state.event.weakSpotDiscovered || !state.enemy) return;
    if (state.event.pending) return;
    if (state.enemy.currentHp <= 0) return;
    if (Math.random() < 0.22) {
      set({
        narrativeEvent: 'A weak pulse flashes through the enemy. Target life energy to expose a weak spot?',
        event: { ...state.event, pending: true },
      });
    }
  },

  attackLifeEnergy: () => {
    const state = get();
    if (!state.enemy || state.phase !== 'combat') return;
    set({
      narrativeEvent: null,
      event: { ...state.event, pending: false, weakSpotTurns: 2 },
      enemy: { ...state.enemy, debuffs: { ...state.enemy.debuffs, weakSpot: 2 } },
      battleLog: 'You pierce the enemy life energy. Weak spot exposed!',
    });
  },

  ignoreEvent: () => {
    set({
      narrativeEvent: null,
      event: { ...get().event, pending: false },
      battleLog: 'You hold formation and wait for a cleaner opening.',
    });
  },

  combineInWorkspace: (aId, bId) => {
    const resultId = combineElements(aId, bId);

    if (!resultId) {
      set({
        battleLog: getRandomFizzleMessage(),
      });
      return null;
    }

    const resultSpell = ELEMENTS[resultId];
    const player = get().player;
    const playerLevel = get().gameMode === 'duel' ? 19 : (get().enemy?.level ?? 1);
    const maxTier = getCraftingTierForLevel(playerLevel);
    if (resultSpell?.tier && resultSpell.tier > maxTier) {
      set({
        battleLog: `The ${resultSpell.name} spell is beyond your current mastery...`,
      });
      return null;
    }

    const newDiscovered = new Set(player.discoveredSpells);
    newDiscovered.add(resultId);
    const newSeen = new Set(player.seenFromEnemy);
    newSeen.delete(resultId);
    set({
      player: { ...player, discoveredSpells: newDiscovered, seenFromEnemy: newSeen },
      battleLog: `Combined ${ELEMENTS[aId]?.name ?? aId} + ${ELEMENTS[bId]?.name ?? bId} -> ${ELEMENTS[resultId]?.name ?? resultId}.`,
    });
    return resultId;
  },

  getUnlockedEffects: () => {
    const level = get().gameMode === 'duel' ? 17 : (get().enemy?.level ?? 1);
    return getUnlockedEffectsByLevel(level);
  },

  getNextTier: () => {
    const level = get().enemy?.level ?? 1;
    return getNextStatusTier(level);
  },

  isSpellVisible: (spellId) => {
    const spell = ELEMENTS[spellId];
    if (!spell) return false;
    const level = get().gameMode === 'duel' ? 17 : (get().enemy?.level ?? 1);
    if (spell.effectId && !isEffectUnlocked(spell.effectId, level)) return false;
    return true;
  },

  // ---- Duel mode ----
  setGameMode: (mode) => set({ gameMode: mode }),

  createDuelRoom: async () => {
    try {
      const data = await duelApi('', { action: 'create' });
      if (data.code) {
        set({
          duelRoomCode: data.code,
          duelRole: 'host',
          duelWs: null,
          duelConnected: true,
          duelWaitingForOpponent: true,
          duelOpponentJoined: false,
          screen: 'duel_lobby',
        });
        get()._duelStartPolling();
      } else {
        set({ duelBattleLog: data.error || 'Failed to create room.', duelConnected: false });
      }
    } catch (e) {
      set({ duelBattleLog: 'Could not reach server. Try again.', duelConnected: false });
    }
  },

  joinDuelRoom: async (code) => {
    const c = (code || '').toUpperCase().trim();
    try {
      const data = await duelApi('', { action: 'join', code: c });
      if (data.error) {
        set({ duelBattleLog: data.error || 'Failed to join.', duelConnected: false });
        return;
      }
      set({
        duelRoomCode: c,
        duelRole: 'guest',
        duelWs: null,
        duelConnected: true,
        duelWaitingForOpponent: false,
        duelOpponentJoined: true,
        screen: 'duel_lobby',
      });
      get()._duelStartPolling();
    } catch (e) {
      set({ duelBattleLog: 'Could not reach server. Check the code.', duelConnected: false });
    }
  },

  _duelStartPolling: () => {
    if (duelPollTimerId) clearInterval(duelPollTimerId);
    duelPollTimerId = setInterval(async () => {
      const { duelRoomCode: code, duelRole: role, screen } = get();
      if (!code || !role || screen === 'duel_win' || screen === 'duel_lose') return;
      try {
        const data = await duelApi(`?code=${encodeURIComponent(code)}&role=${role}`);
        if (data.error) return;
        const state = get();
        if (data.opponentJoined !== undefined && role === 'host' && !state.duelOpponentJoined && data.opponentJoined) {
          set({ duelOpponentJoined: true, duelWaitingForOpponent: false });
        }
        if (data.state && !state.duelState && state.screen === 'duel_lobby') {
          get()._duelHandleMessage({
            type: 'start',
            state: data.state,
            hostElement: data.hostElement,
            guestElement: data.guestElement,
          });
          if (duelPollTimerId) clearInterval(duelPollTimerId);
          duelPollTimerId = null;
        }
        if (data.state && state.duelState && state.screen === 'duel_game') {
          const prevTurn = state.duelState.turn;
          if (data.state.turn !== prevTurn || data.gameOver) {
            get()._duelHandleMessage({
              type: 'state',
              state: data.state,
              log: data.lastLog || state.duelBattleLog,
              spellId: data.lastSpellId,
              direction: data.lastDirection,
              gameOver: data.gameOver,
            });
          }
        }
      } catch (_) {}
    }, 1500);
  },

  _duelHandleMessage: (msg, ws) => {
    if (msg.type === 'ready_ack') return;
    if (msg.type === 'start') {
      const role = get().duelRole;
      const s = msg.state;
      const opponentHp = role === 'host' ? s.guestHp : s.hostHp;
      const opponentBuffs = role === 'host' ? s.guestBuffs : s.hostBuffs;
      const opponentDebuffs = role === 'host' ? s.guestDebuffs : s.hostDebuffs;
      const myEl = role === 'host' ? msg.hostElement : msg.guestElement;
      set({
        duelState: s,
        duelHostElement: msg.hostElement,
        duelGuestElement: msg.guestElement,
        duelBattleLog: 'Battle start!',
        battleLog: 'Battle start!',
        screen: 'duel_game',
        phase: 'combat',
        turn: s.turn === role ? 'player' : 'enemy',
        enemy: {
          name: 'Opponent',
          currentHp: opponentHp,
          hp: role === 'host' ? s.guestMaxHp : s.hostMaxHp,
          buffs: opponentBuffs,
          debuffs: opponentDebuffs,
          level: 17,
        },
        spellEvent: null,
        player: {
          hp: role === 'host' ? s.hostHp : s.guestHp,
          maxHp: role === 'host' ? s.hostMaxHp : s.guestMaxHp,
          unlockedElements: new Set([myEl]),
          discoveredSpells: new Set([myEl]),
          seenFromEnemy: new Set(),
          buffs: role === 'host' ? s.hostBuffs : s.guestBuffs,
          debuffs: role === 'host' ? s.hostDebuffs : s.guestDebuffs,
        },
      });
      return;
    }
    if (msg.type === 'state') {
      const role = get().duelRole;
      const s = msg.state;
      const opponentHp = role === 'host' ? s.guestHp : s.hostHp;
      const opponentBuffs = role === 'host' ? s.guestBuffs : s.hostBuffs;
      const opponentDebuffs = role === 'host' ? s.guestDebuffs : s.hostDebuffs;
      set({
        duelState: s,
        duelBattleLog: msg.log || '',
        battleLog: msg.log || '',
        duelSpellEvent: msg.spellId ? {
          type: ELEMENTS[msg.spellId]?.spellType || 'damage',
          spellId: msg.spellId,
          direction: role === 'host' ? (msg.direction === 'toGuest' ? 'toEnemy' : 'toPlayer') : (msg.direction === 'toHost' ? 'toEnemy' : 'toPlayer'),
          timestamp: Date.now(),
        } : null,
      });
      set({
        enemy: {
          name: 'Opponent',
          currentHp: opponentHp,
          hp: role === 'host' ? s.guestMaxHp : s.hostMaxHp,
          buffs: opponentBuffs,
          debuffs: opponentDebuffs,
          level: 17,
        },
        player: {
          ...get().player,
          hp: role === 'host' ? s.hostHp : s.guestHp,
          maxHp: role === 'host' ? s.hostMaxHp : s.guestMaxHp,
          buffs: role === 'host' ? s.hostBuffs : s.guestBuffs,
          debuffs: role === 'host' ? s.hostDebuffs : s.guestDebuffs,
        },
        spellEvent: msg.spellId ? {
          type: ELEMENTS[msg.spellId]?.spellType || 'damage',
          spellId: msg.spellId,
          direction: role === 'host' ? (msg.direction === 'toGuest' ? 'toEnemy' : 'toPlayer') : (msg.direction === 'toHost' ? 'toEnemy' : 'toPlayer'),
          timestamp: Date.now(),
        } : null,
        turn: s.turn === role ? 'player' : 'enemy',
      });
      if (msg.gameOver) {
        const iWon = (msg.gameOver === 'host' && role === 'guest') || (msg.gameOver === 'guest' && role === 'host');
        set({ duelGameOver: iWon ? 'win' : 'lose', screen: iWon ? 'duel_win' : 'duel_lose' });
      }
    }
  },

  sendDuelReady: async (element) => {
    const state = get();
    const code = state.duelRoomCode;
    const role = state.duelRole;
    const el = element || state.selectedStartElement;
    if (!code || !role) return;
    try {
      const data = await duelApi('', { action: 'ready', code, role, element: el });
      set({ duelMyElement: el });
      if (data.state) {
        get()._duelHandleMessage({
          type: 'start',
          state: data.state,
          hostElement: data.hostElement,
          guestElement: data.guestElement,
        });
        if (duelPollTimerId) clearInterval(duelPollTimerId);
        duelPollTimerId = null;
      }
    } catch (_) {}
  },

  sendDuelCast: async (spellId) => {
    const state = get();
    if (state.duelGameOver) return;
    const turn = state.duelState?.turn;
    const role = state.duelRole;
    const code = state.duelRoomCode;
    if (turn !== role || !code) return;
    if (!state.player.discoveredSpells.has(spellId) && !state.player.unlockedElements.has(spellId)) return;
    try {
      const data = await duelApi('', { action: 'cast', code, role, spellId });
      if (data.state) {
        get()._duelHandleMessage({
          type: 'state',
          state: data.state,
          log: data.log,
          spellId: data.spellId,
          direction: data.direction,
          gameOver: data.gameOver,
        });
      }
    } catch (_) {}
  },

  disconnectDuel: () => {
    if (duelPollTimerId) {
      clearInterval(duelPollTimerId);
      duelPollTimerId = null;
    }
    set({
      duelRoomCode: null,
      duelRole: null,
      duelWs: null,
      duelConnected: false,
      duelWaitingForOpponent: false,
      duelOpponentJoined: false,
      duelState: null,
      duelHostElement: null,
      duelGuestElement: null,
      duelMyElement: null,
      duelBattleLog: '',
      duelSpellEvent: null,
      duelGameOver: null,
    });
  },
}));
