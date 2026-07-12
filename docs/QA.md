# QA & Quality Loop — toward a 7/10 indie RPG

A living tracker for the autonomous quality pass. Update the scores and the
findings log every session. "7/10" = a small but genuinely enjoyable, polished,
bug-free indie RPG that a stranger would finish and rate positively.

## Rubric (each /10; target: no category below 7, weighted average ≥ 7)

| # | Category | Score | Notes |
|---|----------|-------|-------|
| 1 | No softlocks / crashes / save corruption | ? | most important |
| 2 | Combat balance (not trivial, not grindy) | ? | needs real number testing |
| 3 | Game feel / juice (feedback, transitions, SFX) | ? | battle strong; overworld? |
| 4 | Onboarding & moment-to-moment clarity | ? | does a new player know what to do |
| 5 | UI/UX polish (menus, HUD, editor, readability) | ? | |
| 6 | Content variety (enemies, maps, dialogue) | ? | 4 floors / ~12 enemies / 19 puzzles |
| 7 | Narrative & atmosphere | ? | concept strong |
| 8 | Educational payload actually lands | ? | strong — real interpreter |
| 9 | Progression feels rewarding (XP, drops, abilities) | ? | |
| 10 | Title / pause / ending / meta polish | ? | |

## How the loop works
1. Playtest a slice via the preview + the `__gc` debug API (pump frames; screenshots throttle, so sample canvas / assert state).
2. Log every concrete issue below under FINDINGS with a severity (P0 softlock, P1 hurts the grade, P2 polish).
3. Fix in priority order, `npm test` + typecheck + live-verify each.
4. Re-score. Repeat until the bar is met.

## FINDINGS (newest first)

- **F1 (P1, balance)** — combat is trivial. Sim (`scripts/balance-sim.ts`): with any
  ability, regular trash dies in 1 turn and the player takes ~0 damage; bosses
  die in 2-4 turns near full HP once you use their weakness. Only sweep-only
  play has any tension. Overworld fights are pointless filler.
- **F2 (P1, ending)** — beating the FINAL boss (floor 3) shows a stale message:
  Pram says "go get some air" then a NOTICE saying "Floor 3 ... is next" — but
  floor 3 is what you just cleared. No real conclusion beat. IS_DEMO is now
  always false so the wrong branch shows.
- **F3 (P2, RPG affordance)** — no way to heal except leveling or losing (which
  fully heals + respawns, so there's no fail state). Break-room coolers (W tiles)
  are decorative only. A rest point would add a real pressure valve + let combat
  matter.

## FIXED (log)

- **F2 ending** — replaced the stale "Floor 3 is next" beat with a real 5-page
  conclusion (Pram sign-off + a SHIFT COMPLETE card summarizing level, abilities,
  floors cleared). Sets `game-cleared`; title now shows a "* COMPLEX 7 CLEAN *"
  badge. Verified live: fires on final clear, correct text, flag persists.
- **F3 rest points** — new `rest` entity on every floor's break-room cooler;
  interact to restore HP+RAM to full (SFX + line). Floor-0 sign teaches it.
  Verified live: 5→20 HP, 0→6 RAM.
- **F1 balance** — retuned all enemies (scripts/balance-sim.ts). Now: sweep-only
  is genuinely risky (40-70% win on mid mobs), optimal play costs ~15-30% HP,
  and the final boss drops you to ~30% even played well. Bosses still require
  ability use (the lesson). Rest points offset the new attrition.
  Was: everything 1-turn / 0 damage.
