# QA & Quality Loop — toward a 7/10 indie RPG

A living tracker for the autonomous quality pass. Update the scores and the
findings log every session. "7/10" = a small but genuinely enjoyable, polished,
bug-free indie RPG that a stranger would finish and rate positively.

## Rubric (each /10; target: no category below 7, weighted average ≥ 7)

Scores after QA pass 1 (2026-07-11). Weighted avg ~7.6; no category below 7.

| # | Category | Score | Notes |
|---|----------|-------|-------|
| 1 | No softlocks / crashes / save corruption | 8 | interp fuzz 24/24 graceful; save/continue round-trips; no console errors |
| 2 | Combat balance (not trivial, not grindy) | 7 | retuned: sweep-only risky, optimal costs HP, final boss → ~30%. Regular mobs still a touch easy optimally |
| 3 | Game feel / juice | 7 | battle: shake, particles, flash, damage numbers, hurt vignette, telegraphs. Overworld: walk anim + camera + ambience |
| 4 | Onboarding & clarity | 8 | intro, sign teaches controls+cooler, teach-before-ask briefs, F1 hints + glossary, error-line marker |
| 5 | UI/UX polish | 7 | HUD, pause, syntax-highlit editor w/ line nums + error marker, glossary |
| 6 | Content variety | 7 | 4 floors, 12 enemies, 3 bosses, 19 puzzles, distinct tiles/ambience/enemies per floor |
| 7 | Narrative & atmosphere | 8 | strong concept, good dialogue, real ending + CLEARED badge |
| 8 | Educational payload | 9 | real C interpreter, all 11 labs, glossary with etymology + stdio lineage |
| 9 | Progression rewards | 7 | XP/level/abilities/rest points/ending summary |
| 10 | Title / pause / ending / meta | 7 | boot log, title, pause, ending card, CLEARED badge |

### Remaining nice-to-haves (next-session backlog, all P2)
- Regular-mob combat is still a bit easy with optimal play (2 turns, ~18% HP).
- Battle backdrop is identical on every floor — a per-floor tint would add variety.
- No floating "LEVEL UP" flourish (just a log line).
- Could add a second enemy-type per floor for more variety.
- Editor: bracket-matching / auto-close would be a nicety (not needed).

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

- **F5 (P1, terminal UI)** — the certification terminal drew challenge rows at a
  fixed `y = 54 + i*12` with no scrolling, so Floor 3's SIX exercises spilled
  the sixth row (y=114) on top of the reward line (y=112) — the last exercise
  was unreadable/unusable. Rebuilt the picker with a scrolling viewport (5 rows
  + a proportional scrollbar that appears only when the list overflows), a
  header `n/m CERTIFIED` progress counter (greens on completion), a `TEACHES:`
  concept line + task preview for the highlighted exercise, certified rows tinted
  green, and it now opens pre-focused on the first still-pending exercise.
  Verified headlessly: the cursor stays inside the scroll window across full
  up/down navigation (incl. wrap) and rows never overlap the detail block.

- **F4 (P1, interpreter correctness)** — `&&` and `||` did not short-circuit:
  the interpreter eagerly evaluated the right operand, so a guard like
  `if (n != 0 && x / n > 1)` (or the bounds idiom `if (i < len && arr[i]...)`)
  wrongly raised "division by zero" / out-of-bounds instead of running like
  real C. Violated HARD RULE 4 ("the C taught is real"). Fixed: the operand a
  short-circuit skips is now parsed under a `noEval` guard that suppresses only
  the value-dependent runtime errors it would spuriously raise (div/modulo by
  zero, array/string OOB); a fault that is *actually reached* still errors.
  Added six regression tests to `tests/interp.test.ts`. Verified: guarded
  idioms run, both-true still evaluates the RHS, real faults still throw.


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
- **Battle juice** — rising damage numbers over the target (big amber on a
  super-effective hit; red over Wes on a hit) + a red screen-edge pulse when
  hurt. Verified live.
- **Editor error marker** — a compile error now jumps the cursor to the cited
  line and paints it red (bar + tint + gutter), cleared on edit. Verified:
  "line 5" marks exactly the broken line.
- **Robustness** — interpreter fuzzed with 24 malformed programs: all handled
  gracefully, zero throws/crashes. Save→SAVE→reload→CONTINUE round-trips.
