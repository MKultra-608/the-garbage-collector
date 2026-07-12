/**
 * Content sanity checks: map grids are rectangular and use known tile chars,
 * entities sit on sensible tiles, sprite art rows are consistent and fully
 * covered by their legends, and cross-references (enemies, abilities) resolve.
 * Run with:  npm test
 *
 * NOTE: the tile char sets below mirror art/tiles.ts (which can't be imported
 * in Node because it draws to canvases at load). If you add a tile char,
 * add it here too — a failure here is the reminder.
 */
import { MAPS, FLOORS } from '../src/game/data/maps.ts'
import {
  JANITOR, PRAM, COURIER, CLERK, TEMP, TRASH_PILE,
  CRUMPLE, LINT_GOLEM, SLUDGE_CONE, SHREDLING, JUNK_FAX, MISLABEL,
  TALLYMORE, ROLO, OFF_BY_ONE,
  COPYPASTA, SCOPE_CREEP, STACK_OVERFLOW,
} from '../src/art/sprites.ts'
import { CHALLENGES } from '../src/game/data/challenges.ts'
import { ENEMIES } from '../src/game/data/enemies.ts'
import { ABILITIES } from '../src/game/data/abilities.ts'

let bad = 0
const TILE_CHARS = new Set('V#.,CDMEPWSHFAUG'.split(''))
const SOLID = new Set('V#DMEPWSHFAUG'.split(''))

for (const map of Object.values(MAPS)) {
  const w = map.grid[0].length
  map.grid.forEach((row, y) => {
    if (row.length !== w) {
      console.error(`MAP ${map.id} row ${y}: length ${row.length} != ${w}`)
      bad++
    }
    for (const ch of row) {
      if (!TILE_CHARS.has(ch)) {
        console.error(`MAP ${map.id} row ${y}: unknown tile char '${ch}'`)
        bad++
      }
    }
  })
  for (const e of map.entities) {
    const ch = map.grid[e.y]?.[e.x]
    if (ch === undefined) {
      console.error(`MAP ${map.id}: entity ${e.kind} out of bounds (${e.x},${e.y})`)
      bad++
      continue
    }
    // trash/npc/boss stand on walkable floor; sign/terminal/elevator/rest live ON solid furniture tiles
    const wantsSolid = e.kind === 'sign' || e.kind === 'terminal' || e.kind === 'elevator' || e.kind === 'rest'
    if (wantsSolid !== SOLID.has(ch)) {
      console.error(`MAP ${map.id}: ${e.kind} at (${e.x},${e.y}) on '${ch}' — placement looks wrong`)
      bad++
    }
    if ((e.kind === 'trash' || e.kind === 'boss') && !ENEMIES[e.enemy]) {
      console.error(`MAP ${map.id}: ${e.kind} at (${e.x},${e.y}) references unknown enemy '${e.enemy}'`)
      bad++
    }
  }
  console.log(`ok   map ${map.id}: ${w}x${map.grid.length}, ${map.entities.length} entities`)
}

// Every floor in FLOORS must have a real map and an in-bounds, walkable spawn.
for (const floor of FLOORS) {
  const map = MAPS[floor.id]
  if (!map) {
    console.error(`FLOOR ${floor.id}: has no map in MAPS`)
    bad++
    continue
  }
  const ch = map.grid[floor.spawn.y]?.[floor.spawn.x]
  if (ch === undefined || SOLID.has(ch)) {
    console.error(`FLOOR ${floor.id}: spawn (${floor.spawn.x},${floor.spawn.y}) is not walkable ('${ch}')`)
    bad++
  }
  if (floor.bossFlag) {
    const hasBoss = map.entities.some((e) => e.kind === 'boss' && e.flag === floor.bossFlag)
    if (!hasBoss) {
      console.error(`FLOOR ${floor.id}: bossFlag '${floor.bossFlag}' has no matching boss entity`)
      bad++
    }
  }
  console.log(`ok   floor ${floor.id}: spawn ok, ${map.entities.length} entities`)
}

const arts = [
  ...JANITOR.down, ...JANITOR.up, ...JANITOR.side,
  PRAM, COURIER, CLERK, TEMP, TRASH_PILE,
  CRUMPLE, LINT_GOLEM, SLUDGE_CONE, SHREDLING, JUNK_FAX, MISLABEL,
  TALLYMORE, ROLO, OFF_BY_ONE,
  COPYPASTA, SCOPE_CREEP, STACK_OVERFLOW,
]
for (const art of arts) {
  const w = Math.max(...art.rows.map((r) => r.length))
  for (const [y, row] of art.rows.entries()) {
    if (row.length !== w) {
      console.log(`note art ${art.name} row ${y}: ${row.length} wide of ${w} — will right-pad`)
    }
    for (const ch of row) {
      if (ch !== '.' && !(ch in art.legend)) {
        console.error(`ART ${art.name} row ${y}: char '${ch}' missing from legend`)
        bad++
      }
    }
  }
  console.log(`ok   art ${art.name}: ${w}x${art.rows.length}`)
}

for (const ch of CHALLENGES) {
  if (ch.reward.ability && !ABILITIES[ch.reward.ability]) {
    console.error(`CHALLENGE ${ch.id}: unknown reward ability '${ch.reward.ability}'`)
    bad++
  }
  if (!ch.expect?.length && !ch.variants?.length) {
    console.error(`CHALLENGE ${ch.id}: has no behavioral checks (expect/variants) — rule 4 violation`)
    bad++
  }
}

if (bad) {
  console.error(`\n${bad} content problem(s)`)
  process.exit(1)
}
console.log('\nall content checks passed')
