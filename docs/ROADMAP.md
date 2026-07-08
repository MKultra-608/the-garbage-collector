# Roadmap

## Status: FLOOR 2 COMPLETE (v0.4)

Three floors playable end-to-end: Floor 0 (orientation) → Floor 1 (mailroom,
MISLABEL) → Floor 2 (the Archives, OFF-BY-ONE) → floor-clear beat pointing at
Floor 3. Real C++ across all three; **12 challenges**; multi-floor elevator
travel; two scripted bosses with taught weaknesses; the escalating-hint /
worked-solution tutor. `npm test` (interpreter + content + solution/progression
suites) and `npm run build` are clean.

### Public demo (Floors 0–1)
`npm run build:demo` → `the-garbage-collector-demo.html`, one self-contained
file (base64 data-URI module, no external refs) that runs by double-click. The
cap is a build flag: `GC_DEMO=1` sets `__DEMO_MAX_FLOOR__` (vite.config.ts), and
`data/maps.ts` filters `FLOORS` to it — Floor 2+ content stays in the bundle but
is unreachable, so the demo ends after the mailroom with an END OF DEMO beat. A
framed, hosted version (CRT-bezel chrome via scripts under scratchpad) is
published as a Claude Artifact for sharing.

### Floor 2 — The Archives (loops) — DONE (v0.4)
- [x] `floor2` MapDef: repeating cabinet aisles + archive-box tiles, a reading
      nook, Clerk NPC, 3 trash encounters, OFF-BY-ONE in the east vault.
- [x] Two headless enemies (TALLYMORE = accumulator, ROLO = infinite loop) and
      boss OFF-BY-ONE (weak to Loop Lash; Scan teaches i<=n vs i<n).
- [x] Loop Lash ability (fixed 3-hit "iteration" flurry).
- [x] 4 challenges: while (CLOCK OUT), for (SHELF SCAN → Loop Lash),
      accumulator (TALLY), nested (GRID FILE).
- [x] Multi-hit / super-effective / boss-defeat flavor made per-ability and
      per-boss (was leaking MISLABEL/"cases" text onto other content).

What exists (do not rebuild — extend):
- Engine: scene stack, transitions, fixed timestep, shake, scanline upscale.
- Synthesized audio (no-music rule enforced in code comments).
- 5×7 bitmap font, panels, wrapping, typewriter dialogue.
- Text pixel-art pipeline + code-drawn tiles (art/).
- Grid overworld with camera, y-sorting, entities, flags, interact verbs.
- Multi-floor travel: `FLOORS` registry, `ElevatorScene`, per-floor spawns,
  `progression.ts` (clear/unlock logic), floor-clear announcements.
- Turn-based battle with RAM economy, buffs/guards, scan-as-lore, particles,
  plus boss support: scripted move rotations, taught weaknesses (weakTo/
  weakHint), multi-hit abilities, no-flee, floor-aware respawn.
- Modal C++ editor with syntax highlighting and friendly grading.
- C++ interpreter covering chapters 0–2 (now incl. switch/case/default) with a
  regression suite; a solution suite proves every challenge is solvable.
- Save v1 (localStorage, forward-compatible), Floors 0–1 content
  (8 challenges, 6 enemies + 1 boss, 2 maps).

## Milestone 1 — Floor 1: The Mailroom — DONE (v0.2)

- [x] Elevator travels: `gs.map` switches, per-floor spawns, `ElevatorScene`
      lists unlocked floors and gates locked ones.
- [x] `floor1` MapDef: mailroom (pigeonhole + conveyor tiles), break room,
      2 terminals, courier NPC, 3 trash encounters.
- [x] Interpreter: `switch/case/default` with fall-through + tests.
- [x] 4 challenges: cin (INTAKE), string compare (SIGNATURE CHECK),
      switch (SORTING CODE → Switch Case), combined (MISLABELED).
- [x] `Switch Case` multi-hit ability + boss MISLABEL (scripted rotation,
      weak to Switch Case, revealed by Scan).

### Trash respawn decision (RESOLVED)
Regular trash and bosses are **permanent** once defeated (hidden via their
flags). Rationale: the core fantasy is a floor that visibly gets *cleaner* and
stays clean — respawning trash undercuts that and turns exploration into a
grind. If an XP/scrap faucet is needed later, add dedicated **vending machines
or a respawning "dumpster" entity** (Milestone 2) rather than respawning the
hand-placed piles. Any respawn would use per-visit flags, never the permanent
`f{n}-trash-*` flags.

## Milestone 2 — Systems depth

- [ ] Typed damage (MOIST/SHARP/STATIC vs paper/lint/ooze) — data lives in
      abilities.ts/enemies.ts; keep the matrix tiny (3×3) and show hints via Scan.
- [ ] Vending machines: spend Scrap on consumables (Coffee = heal, Air Duster
      = flee guarantee, Sticky Note = one free guard). New `item` entities +
      battle ITEMS submenu.
- [ ] Overworld polish: room-name toasts, more ambient one-shot SFX on a
      random timer (pipes, distant doors), rare light-flicker events.
- [ ] Settings in pause menu: SFX volume, scanlines toggle (persist in save).

## Milestone 3 — The long climb (floors 2–5)

- Floor 2 (loops) is content-only — interpreter already supports it. Build it
  early for cheap momentum.
- Floor 3 requires interpreter functions (call stack) — the biggest interp
  task; do it test-first, budget accordingly.
- Floors 4–5: arrays/vectors, then structs/classes (see CURRICULUM.md).

## Milestone 4 — Twist & endgame (floors 6–9)

- Pointers twist scene (floor 6), heap meter UI (floor 7), polymorphic boss
  squad (floor 8), THE LEAK + smart pointers (floor 9), credits.

## Milestone 5 — Ship prep

- [ ] Wrap for Steam via Electron or Tauri (game is already offline-only,
      no-network, save = localStorage → migrate to file via wrapper API).
- [ ] Achievements hooks (flags already exist), Steam page copy, trailer
      (silent trailer — lean into it).
- [ ] Playtest with true novices; measure challenge fail points; every rage
      moment gets a better hint, not an easier check.

## Learning system (v0.3)

Every challenge now carries a `teaches` label, 2-3 escalating `hints`, and a
tested worked `solution`. In the editor, F1 opens a tutor overlay that reveals
hints one at a time; after the last hint the player can view the full solution
and press L to load it in to study and run. Hint progress persists
(`gs.hintsSeen`). `tests/solutions.test.ts` guarantees every worked solution
passes the grader and every starter does not — the help content can never be
empty or wrong. Variant grading is now whitespace-tolerant, and the
interpreter keeps `char` a char through `++`/`+=` (both were bugs, now fixed
with regression tests).

## Known debts (small, tracked, not urgent)

- Editor lacks selection/clipboard; fine for small programs, revisit at F3
  when functions make programs longer.
- Battle enemy is single; multi-enemy fights arrive with F4 (`Batch Job`).
- No gamepad support (keyboard-only is a design rule for the editor, but
  overworld/battle could take a pad later).
- Interpreter models uninitialized variables as 0 (not garbage); safer for
  learners but slightly at odds with CRUMPLE's scan lore. Leave as-is.
