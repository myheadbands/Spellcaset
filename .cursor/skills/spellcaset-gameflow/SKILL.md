---
name: spellcaset-gameflow
description: Maintain and extend Spellcaset's encounter-based game flow and UI polish. Use when adding levels, boss beats, narrative intros, transition states, combat UI hierarchy, status effect presentation, or flow-related balancing in this project.
---

# Spellcaset Gameflow Skill

## Core Workflow

1. Update level content in `js/data/opponents.js` with gameplay values and narrative fields.
2. Ensure runtime phases in `js/main.js` remain coherent:
   - `encounterIntro`
   - `combat`
   - `levelClear`
   - `transition`
3. Keep encounter UI cues aligned in:
   - `index.html` narrative containers
   - `css/style.css` transition and banner styles
4. Validate regressions:
   - start-level intro sequence
   - turn-based combat loop
   - level clear and next-level transitions

## Level Entry Template

Use this template when adding or revising encounters:

```javascript
{
  level: 0,
  name: "Enemy Name",
  hp: 100,
  isBoss: false,
  aiTier: "basic",
  spellIds: ["fire"],
  unlockElement: undefined,
  introLine: "Encounter intro.",
  bossLine: "Boss-only line.",
  defeatLine: "Post-defeat line."
}
```

Notes:
- Keep `bossLine` for bosses or omit for normal encounters.
- Keep narrative short (one concise sentence each).
- Ensure `spellIds` reference valid element ids.

## Status Emoji Mapping

Use consistent mapping in status-related UI/telegraphs:

- `🛡️ shield`
- `💚 regeneration`
- `🧽 cleanse`
- `🐌 slow`
- `👁️ blind`
- `☠️ poison`
- `🔇 silence`
- `🧨 powerUp`
- `🪓 weaken`
- `🧱 defenseDown`

Keep global emoji usage light outside status contexts.

## UI Hierarchy Rules

- Enemy emphasis at top.
- Combat state and log centrally visible.
- Interaction controls grouped in lower/right interaction deck.
- Narrative banners should inform flow without delaying action excessively.

## Validation Checklist

- Syntax checks pass for edited JS modules.
- Encounter intro appears before combat input becomes active.
- Enemy/player turns still alternate correctly.
- Boss unlock and level clear flow still works.
- No breakage in drag-combine-cast loop.
