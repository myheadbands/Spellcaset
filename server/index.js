/**
 * Duel 1v1 WebSocket server. Room codes to share; authoritative spell resolution.
 * Run: node server/index.js   (from project root: node server/index.js)
 */
import { WebSocketServer } from 'ws';
import { applySpell, applyTurnStartEffects, isTurnBlocked } from '../src/engine/gameEngine.js';
import { ELEMENTS } from '../src/engine/elements.js';

const DUEL_LEVEL = 17; // all effects unlocked
const PORT = Number(process.env.DUEL_PORT) || 8765;

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function serializeUnit(u) {
  return {
    hp: u.currentHp,
    maxHp: u.maxHp,
    buffs: { ...(u.buffs || {}) },
    debuffs: { ...(u.debuffs || {}) },
  };
}

const rooms = new Map(); // code -> { host, guest, state, hostElement, guestElement }

function getState(room) {
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

function broadcast(room, msg) {
  const payload = JSON.stringify(msg);
  if (room.host?.readyState === 1) room.host.send(payload);
  if (room.guest?.readyState === 1) room.guest.send(payload);
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    if (msg.type === 'create') {
      const code = randomCode();
      rooms.set(code, {
        host: ws,
        guest: null,
        state: null,
        hostElement: null,
        guestElement: null,
        hostReady: false,
        guestReady: false,
        turn: null,
      });
      ws.send(JSON.stringify({ type: 'room_created', code }));
      return;
    }

    if (msg.type === 'join') {
      const code = (msg.code || '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid or expired code.' }));
        return;
      }
      if (room.guest) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room is full.' }));
        return;
      }
      room.guest = ws;
      ws.send(JSON.stringify({ type: 'joined', code, role: 'guest' }));
      if (room.host?.readyState === 1) {
        room.host.send(JSON.stringify({ type: 'opponent_joined' }));
      }
      return;
    }

    if (msg.type === 'ready') {
      const room = [...rooms.entries()].find(([, r]) => r.host === ws || r.guest === ws);
      if (!room) return;
      const [, r] = room;
      const role = r.host === ws ? 'host' : 'guest';
      const element = msg.element && ELEMENTS[msg.element] ? msg.element : 'fire';
      if (role === 'host') {
        r.hostElement = element;
        r.hostReady = true;
      } else {
        r.guestElement = element;
        r.guestReady = true;
      }
      broadcast(r, { type: 'ready_ack', role, element });
      if (r.hostReady && r.guestReady) {
        r.state = {
          host: { currentHp: 120, maxHp: 180, buffs: {}, debuffs: {} },
          guest: { currentHp: 120, maxHp: 180, buffs: {}, debuffs: {} },
        };
        r.turn = 'host';
        broadcast(r, {
          type: 'start',
          state: getState(r),
          hostElement: r.hostElement,
          guestElement: r.guestElement,
        });
      }
      return;
    }

    if (msg.type === 'cast') {
      const [code, room] = [...rooms.entries()].find(([, r]) => r.host === ws || r.guest === ws) || [];
      if (!room || !room.state) return;
      const role = room.host === ws ? 'host' : 'guest';
      if (room.turn !== role) return;
      const spellId = msg.spellId;
      if (!spellId || !ELEMENTS[spellId]) return;

      const caster = role === 'host' ? room.state.host : room.state.guest;
      const target = role === 'host' ? room.state.guest : room.state.host;

      let startLog = applyTurnStartEffects(caster);
      const block = isTurnBlocked(caster);
      if (block.blocked) {
        room.turn = role === 'host' ? 'guest' : 'host';
        broadcast(room, { type: 'state', state: getState(room), log: `${role} lost turn (${block.reason}).`, spellId: null });
        return;
      }

      const log = applySpell(caster, target, spellId, DUEL_LEVEL);
      const spell = ELEMENTS[spellId] ?? ELEMENTS.fusion;
      room.turn = role === 'host' ? 'guest' : 'host';

      let gameOver = null;
      if (target.currentHp <= 0) gameOver = role;

      broadcast(room, {
        type: 'state',
        state: getState(room),
        log,
        spellId,
        spellType: spell.spellType,
        direction: role === 'host' ? 'toGuest' : 'toHost',
        gameOver,
      });

      if (gameOver) {
        setTimeout(() => {
          rooms.delete(code);
        }, 5000);
      }
    }
  });

  ws.on('close', () => {
    for (const [code, room] of rooms.entries()) {
      if (room.host === ws || room.guest === ws) {
        const other = room.host === ws ? room.guest : room.host;
        if (other?.readyState === 1) {
          other.send(JSON.stringify({ type: 'opponent_left' }));
        }
        rooms.delete(code);
        break;
      }
    }
  });
});

console.log(`Duel server on ws://localhost:${PORT}`);
