# The Garbage Collector — Game Design Document

## One-liner

A silent, fluorescent-lit Pokémon-like where a masked janitor learns real C++
to fight organized garbage, because in a world without a garbage collector,
somebody has to be one.

## The joke that carries the whole game

C++ famously has **no garbage collector** — memory must be managed by hand.
The game literalizes this: Complex 7's "GC daemon" died, nobody cleaned
anything up, and the leaked garbage became monsters. Wes, a janitor with a
mop, is the manual memory management. Every system should echo this theme:
enemies are leaks, dangles, and clutter; late-game abilities are `delete`,
RAII, and smart pointers; the final boss is The Leak.

## Design pillars

1. **The code is real.** Players type genuine C++ into an in-game editor and
   the game runs it. Rewards come from working programs, not multiple choice.
   If a player finishes the game, they can read and write real beginner C++.
2. **Silence is the soundtrack.** No music, by hard rule. Fluorescent hum,
   HVAC rumble, footsteps, wet mop hits. Tension and comfort both come from
   the soundscape of an empty office at 3 AM. Captivation comes from
   atmosphere, feedback crunch (shake, particles, typewriter text), and the
   drip-feed of new powers.
3. **Learn a line, earn a power.** Every combat ability IS a line of C++ the
   player has personally written at a terminal. The ability menu shows its
   code signature forever, so the association never fades.
4. **The floor gets visibly cleaner.** Defeated trash piles stay gone
   (flagged). Progress is spatial and legible: a clean hallway is your XP bar.
5. **$4.99 of tight, finished game.** 6–10 hours, zero filler, every enemy and
   room hand-placed. Small scope, high polish — a Steam review that says
   "short but I actually know C++ basics now" is the win condition.

## World & story

**Complex 7** — a brutalist office tower, permanently night. The architects
wrote the building's maintenance layer in C++ and vanished. The automated
garbage collector ("the GC daemon") stopped responding years ago; management
response was masks, not fixes. Refuse accumulated, then organized.

- **Wes** (player) — new night janitor. Blank white full-face mask, work cap,
  teal coveralls, mop. Silent protagonist.
- **Custodian Pram** — veteran mentor. Gray fatigues, filter mask. Speaks in
  radio-clipped fragments. Gates floor progression, delivers lore.
- **Humans** all wear masks that completely hide facial features (hard rule).
  In-fiction: "the particulate is ambitious." Thematically: in this building,
  identity is role — a janitor is a mop and a mask.
- **Garbage creatures** are all headless (hard rule). Garbage has no head, no
  face, no argument — it just accumulates. Killing it isn't cruelty; it's
  cleanup.

Story spine (10 floors, see CURRICULUM.md): climb from sub-basement to the
server penthouse, restart the GC. Mid-game twist (floor 6, pointers chapter):
the terminals reveal C++ never HAD a garbage collector — the "daemon" was
always just the previous janitor, who is now missing. The title is a job
description, and it's yours. Endgame: you don't restart an automated system;
you accept the role, armed with RAII and smart pointers — the C++ answer to
garbage collection.

## Core loops

**Macro (per floor):** arrive → explore → find terminals → learn concept →
unlock ability → clear trash → boss → elevator to next floor.

**Terminal loop:** read brief (concept taught in fiction-flavored plain
words) → write real C++ → Ctrl+Enter → real compile/run errors with friendly
hints → pass checks → CERTIFIED → ability/reward. Failed attempts cost
nothing; the code persists between visits.

**Battle loop (turn-based, first-person like EarthBound):** enemy fills the
screen; menu of abilities (each showing RAM cost + its C++ signature);
attack/buff/guard/scan; enemy acts; RAM regenerates +1 per round. Scan is the
flavor channel: every enemy's scan entry teaches a real C++ fact.

## Combat systems (current)

- HP / RAM (ability resource) / ATK / LV / XP / Scrap (currency).
- `Sweep` free basic attack; unlocked abilities cost RAM (see abilities.ts).
- Increment (+1 ATK stack ×3), Branch Guard (halve next hit), enemy guard and
  atk-buff moves mirror the player's options.
- Losing = wake in the closet, full HP, no other penalty (education game:
  losing must never destroy progress).

Planned depth (see ROADMAP): typed damage (MOIST/SHARP/STATIC vs paper, lint,
ooze), consumable items from vending machines (spend Scrap), boss patterns
that reference the floor's C++ concept (e.g. The Shredder loops a 3-turn
`for` pattern the player must read and interrupt at `break`).

## Tone & writing

Deadpan, dry, lightly eerie, never grimdark. The building is unsettling but
the game is kind: error messages teach, deaths are gentle, Pram is gruff but
on your side. Notices and terminals speak in bureaucratic monotone
("CLEARANCE DENIED"). Jokes are workplace jokes, not references.

## Audio design (NO MUSIC — hard rule)

All WebAudio synthesis, in `engine/audio.ts`:
- **Bed:** 120 Hz triangle hum (fluorescent ballast) + low-passed noise (HVAC).
- **SFX:** filtered-noise thuds (steps, hits, keys), short square blips (text,
  menus). Victory = rising noise sweep. Compile error = sagging sawtooth.
- Future: per-floor bed variation (deeper rumble in basement, whining CRTs in
  IT), one-shot environmental ticks (pipes, distant doors) on a random timer.
  Never a melody.

## Visual identity

320×180 pixel canvas, integer scale, subtle scanlines. Fixed 28-color palette
(art/palette.ts): office drab + CRT green for anything code + ooze purple for
garbage magic. One bitmap font (5×7) everywhere, including the code editor.
See ART_BIBLE.md.

## Scope guardrails

- No open world, no procedural generation, no crafting, no romance, no voice.
- One town-equivalent (the break rooms), one mentor, ~10 floors, ~25 enemies,
  ~40 challenges, 1 final boss. Ship that, polished, at $4.99.
