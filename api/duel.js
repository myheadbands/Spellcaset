/**
 * Duel API (HTTP polling). Vercel serverless doesn't support WebSockets.
 * POST /api/duel with body { action, code?, role?, element?, spellId? }
 * GET  /api/duel?code=XXX&role=host|guest  → poll state
 */
const DUEL_LEVEL = 17;

// In-memory room store (per instance; for production consider Vercel KV)
const rooms = new Map();

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function getState(room) {
  if (!room.state) return null;
  return {
    hostHp: room.state.host.currentHp,
    hostMaxHp: room.state.host.maxHp,
    hostBuffs: { ...room.state.host.buffs },
    hostDebuffs: { ...room.state.host.debuffs },
    guestHp: room.state.guest.currentHp,
    guestMaxHp: room.state.guest.maxHp,
    guestBuffs: { ...room.state.guest.buffs },
    guestDebuffs: { ...room.state.guest.debuffs },
    turn: room.turn,
  };
}

// Minimal spell resolution (no ELEMENTS import in serverless)
function applySpellLogic(caster, target, spellId, spellPayload) {
  const { spellType, attack, heal, effectId } = spellPayload || {};
  let log = `Spell cast.`;
  if (spellType === 'damage') {
    let dmg = attack ?? 10;
    if (target.buffs?.shield) dmg = Math.round(dmg * 0.6);
    target.currentHp = Math.max(0, target.currentHp - dmg);
    if (effectId && effectId !== 'regeneration') target.debuffs[effectId] = 2;
    log = `Deals ${dmg} damage.`;
  } else if (spellType === 'heal') {
    const h = heal ?? 12;
    caster.currentHp = Math.min(caster.maxHp, caster.currentHp + h);
    if (effectId === 'regeneration') caster.buffs.regeneration = 2;
    log = `Heals ${h}.`;
  } else if (spellType === 'buff') {
    const bid = effectId ?? 'powerUp';
    caster.buffs[bid] = 2;
    log = `Grants ${bid}.`;
  } else if (spellType === 'debuff') {
    const did = effectId ?? 'weaken';
    target.debuffs[did] = 2;
    log = `Inflicts ${did}.`;
  }
  // decay
  ['buffs', 'debuffs'].forEach(k => {
    const o = caster[k] || {};
    Object.keys(o).forEach(key => { o[key] -= 1; if (o[key] <= 0) delete o[key]; });
  });
  ['buffs', 'debuffs'].forEach(k => {
    const o = target[k] || {};
    Object.keys(o).forEach(key => { o[key] -= 1; if (o[key] <= 0) delete o[key]; });
  });
  return log;
}

function spellPayload(spellId) {
  const table = {
    fire: { spellType: 'damage', attack: 8 },
    water: { spellType: 'damage', attack: 6 },
    earth: { spellType: 'damage', attack: 7 },
    wind: { spellType: 'damage', attack: 6 },
    steam: { spellType: 'damage', attack: 9 },
    plant: { spellType: 'damage', attack: 8 },
    wave: { spellType: 'damage', attack: 10 },
    lava: { spellType: 'damage', attack: 14 },
    smoke: { spellType: 'debuff', effectId: 'blind' },
    dust: { spellType: 'debuff', effectId: 'slow' },
    volcano: { spellType: 'damage', attack: 17 },
    lake: { spellType: 'heal', heal: 14, effectId: 'regeneration' },
    mountain: { spellType: 'buff', effectId: 'shield' },
    storm: { spellType: 'damage', attack: 16 },
    lightning: { spellType: 'damage', attack: 18 },
    meteor: { spellType: 'damage', attack: 22 },
    tsunami: { spellType: 'damage', attack: 24 },
    rain: { spellType: 'heal', heal: 18, effectId: 'regeneration' },
    blizzard: { spellType: 'damage', attack: 20, effectId: 'slow' },
    fusion: { spellType: 'damage', attack: 10 },
  };
  return table[spellId] || { spellType: 'damage', attack: 12 };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const isGet = req.method === 'GET';
  const query = req.query || {};
  const code = ((isGet ? query.code : req.body?.code) || '').toUpperCase().trim();
  const role = isGet ? query.role : req.body?.role;

  if (isGet) {
    if (!code || !role) return res.status(400).json({ error: 'code and role required' });
    const room = rooms.get(code);
    if (!room) return res.status(404).json({ error: 'Invalid or expired code.' });
    const payload = {
      opponentJoined: role === 'host' ? !!room.guestConnected : true,
      hostReady: room.hostReady,
      guestReady: room.guestReady,
      hostElement: room.hostElement,
      guestElement: room.guestElement,
      state: getState(room),
      turn: room.turn,
      gameOver: room.gameOver || null,
      lastLog: room.lastLog || null,
      lastSpellId: room.lastSpellId || null,
      lastDirection: room.lastDirection || null,
    };
    return res.status(200).json(payload);
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const action = body.action;
  const roomCode = (body.code || '').toUpperCase().trim();
  const roleBody = body.role;
  const element = body.element || 'fire';
  const spellId = body.spellId;

  if (action === 'create') {
    const c = randomCode();
    rooms.set(c, {
      hostConnected: true,
      guestConnected: false,
      hostElement: null,
      guestElement: null,
      hostReady: false,
      guestReady: false,
      state: null,
      turn: null,
      gameOver: null,
      lastLog: null,
      lastSpellId: null,
      lastDirection: null,
    });
    return res.status(200).json({ code: c });
  }

  if (action === 'join') {
    const room = rooms.get(roomCode);
    if (!room) return res.status(404).json({ error: 'Invalid or expired code.' });
    if (room.guestConnected) return res.status(400).json({ error: 'Room is full.' });
    room.guestConnected = true;
    return res.status(200).json({ ok: true, code: roomCode });
  }

  if (action === 'ready') {
    const room = rooms.get(roomCode);
    if (!room) return res.status(404).json({ error: 'Invalid or expired code.' });
    if (roleBody === 'host') {
      room.hostElement = element;
      room.hostReady = true;
    } else {
      room.guestElement = element;
      room.guestReady = true;
    }
    if (room.hostReady && room.guestReady && !room.state) {
      room.state = {
        host: { currentHp: 120, maxHp: 180, buffs: {}, debuffs: {} },
        guest: { currentHp: 120, maxHp: 180, buffs: {}, debuffs: {} },
      };
      room.turn = 'host';
    }
    return res.status(200).json({ ok: true, state: getState(room), hostElement: room.hostElement, guestElement: room.guestElement, turn: room.turn });
  }

  if (action === 'cast') {
    const room = rooms.get(roomCode);
    if (!room || !room.state) return res.status(400).json({ error: 'Room not ready.' });
    if (room.turn !== roleBody) return res.status(400).json({ error: 'Not your turn.' });
    const caster = roleBody === 'host' ? room.state.host : room.state.guest;
    const target = roleBody === 'host' ? room.state.guest : room.state.host;
    const payload = spellPayload(spellId);
    const log = applySpellLogic(caster, target, spellId, payload);
    room.turn = roleBody === 'host' ? 'guest' : 'host';
    let gameOver = null;
    if (target.currentHp <= 0) gameOver = roleBody;
    room.gameOver = gameOver;
    room.lastLog = log;
    room.lastSpellId = spellId;
    room.lastDirection = roleBody === 'host' ? 'toGuest' : 'toHost';
    return res.status(200).json({
      state: getState(room),
      log,
      spellId,
      direction: roleBody === 'host' ? 'toGuest' : 'toHost',
      gameOver,
    });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
