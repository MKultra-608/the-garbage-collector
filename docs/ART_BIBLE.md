# Art Bible

## Non-negotiable rules

1. **Humans: masked, always.** Every human sprite/portrait wears a mask that
   completely hides ALL facial features. No eyes, mouths, noses, eyebrows —
   not even as dots. Equipment (filter discs, vents, straps) is fine and is
   the main way to differentiate characters. Silhouette + palette + gear =
   identity.
2. **Non-humans: headless, always.** Creatures are torsos, cones, piles,
   blobs, furniture. Nothing that reads as a head or face. If a design needs
   a "focus point", use a wound, a label, a dent — never eyes.
3. **Palette is fixed** — `src/art/palette.ts`. Office drab (grays, carpet
   greens, desk browns), CRT green reserved for code/terminals/UI-positive,
   amber for warnings/signage, ooze purple for garbage magic, cyan for water.
   A new color requires a new *material* and a code comment.
4. **No music** also shapes art: the game leans on visual rhythm (flicker,
   scanlines, typewriter text, idle bobs) to feel alive.

## Technical format

- Internal resolution 320×180, integer upscale, scanlines at ≥3×.
- Tiles: 16×16, drawn in code (`art/tiles.ts`) — geometric things stay code.
- Characters: 16×16 text pixel-art (`art/sprites.ts`), 2 walk frames per
  facing; side view faces LEFT (right is flipX). 1px black (`k`) outline.
- Battle enemies: 24×24 text pixel-art, drawn at 3× in battle (72px). Design
  for silhouette first — they're the biggest art on screen.
- Font: single built-in 5×7 bitmap font for EVERYTHING (ui/font.ts).

## Character sheets

- **Wes**: white blank mask (`mask`), navy cap (`cap`), teal coveralls
  (`suit`/`suitHi`), canvas gloves (`glove`). Reads as "medical + custodial".
- **Pram**: gray beanie/fatigues, white mask with amber filter disc. Bulkier
  silhouette than Wes.
- **Future NPCs**: box-head couriers (cardboard visor), welding-mask
  maintenance, HR in smooth ceramic masks. Vary mask MATERIAL per department.

## Enemy design language

- Paper creatures: `paper`/`paperDim`, crease lines, light and crinkly.
- Lint/dust: `lint`/`lintHi`, lumpy outlines, asymmetric.
- Ooze: `ooze`/`oozeDim`, drips and pools, glossy single highlight.
- Office-object possessions (cones, shredders, staplers): keep the object
  recognizable, add ooze at the joints.
- Bosses get one signature animation tic (Shredder's teeth cycle, Leak's
  slow growth) instead of more colors.

## Environment language

- Walls have a lit top edge (`wallHi`) — the fluorescents are always on.
- Terminals are the only strong green light source in a room; place them so
  they read as beacons.
- Clutter tells the difficulty story: more trash tiles = more dangerous wing.
- Break rooms are carpeted (`carpet`) safe zones — warmer texture, a cooler,
  a plant. One per floor.
