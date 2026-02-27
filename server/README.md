# Duel 1v1 server

WebSocket server for Spellcaset Duel mode. Players create or join a match with a 6-letter code and fight 1v1 with spells.

**Run from project root:**

```bash
npm run duel
# or: node server/index.js
```

Ensure `server/node_modules` exists (`cd server && npm install` if needed).

Server listens on **ws://localhost:8765**. Set `DUEL_PORT` to use another port.
