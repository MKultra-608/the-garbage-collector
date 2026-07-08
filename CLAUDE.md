# The Garbage Collector

A Pokémon-like RPG that teaches real C++ — from absolute novice to proficient
hobbyist. You are Wes, the night janitor of Complex 7, an office tower whose
garbage-collection daemon died years ago. The trash got organized. You climb
the building floor by floor, learning C++ at wall terminals to unlock cleaning
abilities, and fighting headless garbage creatures in turn-based battles.

Target quality bar: a successful $4.99 educational Steam game. Tight, cohesive,
zero filler. Read `docs/GAME_DESIGN.md` before adding features.

## Commands

```
npm run dev        # vite dev server on http://localhost:5178 (strict port)
npm run build      # typecheck + production bundle to dist/
npm run typecheck  # tsc --noEmit
npm test           # C++ interpreter regression tests (Node, no browser needed)
```

There is a preview launch config named `garbage-collector` in
`~/.claude/launch.json` (port 5178).

## HARD DESIGN RULES — never break these

1. **NO MUSIC. Ever.** No melodies, no jingles, no chiptunes. The soundscape is
   diegetic: fluorescent hum, HVAC noise, mechanical SFX (all synthesized in
   `src/engine/audio.ts`). Even the victory sting is a noise sweep. The silence
   is the atmosphere.
2. **Every human wears a mask that hides ALL facial features.** No eyes, mouths,
   or noses on any human sprite, portrait, or art — ever. Filters/vents are
   equipment and are allowed. (Lore: "the particulate".)
3. **Every non-human creature is headless.** Garbage monsters are torsos, blobs,
   cones, piles. No heads, no faces. (Lore: garbage has no head to speak with.)
4. **The C++ taught is real.** Challenges run the player's code through a real
   interpreter (`src/game/code/interp.ts`) and grade behavior. Never "fake" a
   lesson with pure regex matching; patterns only steer toward the concept.
5. **Fixed palette** (`src/art/palette.ts`). New colors need a new material and
   a comment justifying them.
6. **Keyboard only.** Arrows/WASD move, Z/Space confirms, X/Esc cancels, Enter
   opens the pause menu. The code editor is modal and grabs raw keys
   (Ctrl+Enter runs; F1 opens escalating hints).
7. **Nobody gets stuck.** Every challenge ships escalating `hints` and a tested
   `solution` (see `tests/solutions.test.ts`). Frustration is a bigger threat to
   an education game than hand-holding — always give a graceful way forward.

## Architecture

320x180 internal canvas, integer-upscaled with scanlines. Fixed 60 Hz update.
No runtime dependencies — vanilla TypeScript + Canvas 2D, everything (art,
font, audio) is generated in code. No asset files, no network.

```
src/
  main.ts                    entry; installs window.__gc debug API
  engine/
    engine.ts                game loop, scene stack, transitions, shake, upscale
    input.ts                 key state + K bindings + rawHandler (editor modal)
    audio.ts                 synthesized SFX + ambience (NO MUSIC — see rule 1)
    save.ts                  localStorage save/load (key gc-save-v1, versioned)
  ui/
    font.ts                  built-in 5x7 bitmap font, full printable ASCII
    text.ts                  drawText/wrapText/drawPanel (all UI goes through this)
  art/
    palette.ts               THE palette (rule 5)
    sprites.ts               text pixel-art: janitor, NPCs, enemies, trash
    tiles.ts                 code-drawn 16px map tiles + solidity
  game/
    state.ts                 GameState shape, newGame(), XP/leveling, unlockedFloors
    progression.ts           floor clear/unlock logic (challenges + boss)
    data/
      abilities.ts           combat abilities (each IS a line of C++; multi-hit via `hits`)
      enemies.ts             enemy specs; scan teaches C++; boss fields (script/weakTo)
      challenges.ts          code challenges (the curriculum content), tagged by `floor`
      maps.ts                string-grid maps + entity lists + FLOORS registry
    code/
      interp.ts              C++ micro-interpreter (tested by npm test)
      validator.ts           grades challenge attempts via interp + patterns
    scenes/
      boot.ts title.ts       CRT boot log; title menu
      overworld.ts           grid movement, camera, interaction, encounters, travel
      dialogue.ts            shared typewriter dialogue overlay
      pause.ts               stats/abilities/save menu
      terminal.ts            challenge picker (filtered to the current floor)
      elevator.ts            floor-travel picker (unlocked floors)
      editor.ts              modal C++ editor: edit -> run -> grade -> reward
      battle.ts              turn-based battle (EarthBound-style first person; bosses)
tests/
  interp.test.ts             interpreter regression suite — extend per language feature
  content.test.ts            map/floor/sprite integrity checks
  solutions.test.ts          every challenge is solvable + progression unlock logic
docs/                        GAME_DESIGN, CURRICULUM, ART_BIBLE, ROADMAP
```

Scene stack: opaque scenes (battle, editor) cover everything; transparent ones
(dialogue, pause, terminal, elevator) draw over the scene below. Only the top
scene updates. `engine.transition(fn)` fades out, runs `fn` (push/pop/replace),
fades in.

## Recipes

**Add an enemy**: sprite in `sprites.ts` (24x24, headless!), spec in
`enemies.ts` (moves + a `scan` line that teaches real C++), place a
`trash` entity in `maps.ts` with a fresh flag. Add the sprite to
`content.test.ts`'s art list so its legend is checked.

**Add a boss**: as above, plus set `boss/intro/script/weakTo/weakHint` on the
spec, place a `boss` entity (with `intro` lines) in the map, and point the
floor's `bossFlag` (in `FLOORS`) at that entity's flag.

**Add a floor**: new `MapDef` in `maps.ts` (use the `mrow` builder for width
safety) + an entry in `FLOORS` (spawn point, optional `bossFlag`). Tag its
challenges with the matching `floor` index. Clearing the previous floor
auto-unlocks it via `progression.ts` — no other wiring needed.

**Add an ability**: entry in `abilities.ts` (`sig` = the C++ line it embodies),
then reward it from a challenge in `challenges.ts`. Abilities are ONLY granted
by challenges — that is the core loop.

**Add a challenge**: entry in `challenges.ts` (set its `floor`). Teach in
`brief` first, then task. Provide `teaches` (concept label), 2-3 escalating
`hints` (concept nudge → syntax → near-complete line), and a full worked
`solution`. Grade with `expect` (run cases) and `variants` (source
substitutions that prove no hardcoding; matching is whitespace-tolerant). If it
needs a language feature the interpreter lacks, extend `interp.ts` and add
tests to `tests/interp.test.ts` FIRST. `tests/solutions.test.ts` fails unless
every challenge has hints + a solution, the solution passes, and the starter
does NOT — so authoring is self-checking.

**The in-editor tutor**: `EditorScene` has `help`/`solution` modes. F1 reveals
hints one at a time; after the last hint the player can view the worked
solution and press L to load it into the editor to study and run. Hint progress
persists in `gs.hintsSeen`. Keep hints escalating — never lead with the answer.

## Debug API (browser console / automated verification)

```js
__gc.scene()                    // current scene class name
__gc.key('z')                   // tap a key; __gc.key('Enter', {ctrl:true})
__gc.keyDown('ArrowRight'); __gc.keyUp('ArrowRight')   // hold to walk
__gc.state                      // live GameState (once in the overworld)
__gc.warp(x, y)                 // teleport player (tile coords)
localStorage.removeItem('gc-save-v1')   // fresh start
```

## Verification checklist (after changes)

1. `npm run typecheck` and `npm test` pass.
2. Boot -> title -> NEW GAME -> intro dialogue advances with Z.
3. Walk each direction; bump walls (SFX, no clip-through).
4. Talk to PRAM, read the sign, open pause menu, SAVE, reload page, CONTINUE.
5. Bump a trash pile -> battle -> win/flee; defeated pile stays gone.
6. Terminal -> FIRST SHIFT -> type a solution -> Ctrl+Enter -> claim reward ->
   Flush appears in battle menu and in pause > ABILITIES.
7. Deliberately submit broken code -> error message is helpful, not cryptic.
8. In the editor press F1 -> hints reveal one at a time -> after the last hint,
   view the worked solution -> L loads it -> Ctrl+Enter passes -> claim reward.
9. Certify all Floor 0 terminals -> return to overworld -> Pram announces the
   elevator -> ride the elevator (RIDE) -> Floor 1 loads at its spawn.
10. Floor 1: solve the four mailroom terminals; confront MISLABEL (no FLEE);
    Scan reveals its weakness; Switch Case hits multiple times and is super
    effective; defeating it + all terminals fires the floor-clear beat.

Fast path for driving via the console: see the __gc debug API above — set
`__gc.state` flags/`unlockedFloors`, write it to `localStorage['gc-save-v1']`,
reload, and CONTINUE to jump to any floor.

Automated preview note: a backgrounded/headless tab throttles
requestAnimationFrame, so the game loop freezes and screenshots hang. Pump it
manually from an eval — `__gc.engine.frame(t)` runs one loop iteration (TS
`private` is not runtime-private), and `__gc.engine.top()` exposes the live
scene (its `.mode`, `.hintLevel`, `.result`, `.lines`) for state assertions.
