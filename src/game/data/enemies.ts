import type { PixelArt } from '../../art/sprites.ts'
import {
  CRUMPLE, LINT_GOLEM, SLUDGE_CONE, SHREDLING, JUNK_FAX, MISLABEL,
  TALLYMORE, ROLO, OFF_BY_ONE,
  COPYPASTA, SCOPE_CREEP, STACK_OVERFLOW,
} from '../../art/sprites.ts'

/**
 * Garbage-themed enemies. Every one is headless (hard art rule) and every
 * `scan` entry teaches or foreshadows a real C++ idea — enemies ARE the
 * curriculum's flavor text. Keep that pattern when adding more.
 */
export interface EnemyMove {
  name: string
  msg: string
  /** [min,max] damage to the player. Omit for self-effects. */
  dmg?: [number, number]
  self?: 'atk+' | 'guard'
  weight: number
}

export interface EnemySpec {
  id: string
  name: string
  hp: number
  xp: number
  scrap: number
  sprite: PixelArt
  moves: EnemyMove[]
  /** Shown by the Scan ability — one C++ lesson per enemy. */
  scan: string
  // ----- boss-only fields -----
  /** Marks a story boss: bigger presence, scripted moves, gates floor clear. */
  boss?: boolean
  /** Line spoken when the boss battle opens. */
  intro?: string
  /** Flavor shown when this boss is defeated (falls back to a generic line). */
  defeat?: string
  /** Fixed move rotation (indices into `moves`), cycled by turn. Overrides weights. */
  script?: number[]
  /** Ability id this enemy is weak to — deals extra damage. Scan hints at it. */
  weakTo?: string
  /** Hint revealed by Scan once, to teach the weakness in-fiction. */
  weakHint?: string
}

export const ENEMIES: Record<string, EnemySpec> = {
  crumple: {
    id: 'crumple',
    name: 'CRUMPLE',
    hp: 12,
    xp: 6,
    scrap: 2,
    sprite: CRUMPLE,
    moves: [
      { name: 'Paper Cut', msg: 'CRUMPLE slices with a folded edge!', dmg: [2, 3], weight: 3 },
      { name: 'Rustle', msg: 'CRUMPLE rustles menacingly. Nothing happens.', weight: 1 },
    ],
    scan: 'A draft that was saved over itself 40 times. Its contents were never initialized. LESSON: a variable you never assign holds garbage.',
  },
  lintgolem: {
    id: 'lintgolem',
    name: 'LINT GOLEM',
    hp: 18,
    xp: 10,
    scrap: 4,
    sprite: LINT_GOLEM,
    moves: [
      { name: 'Lint Barrage', msg: 'LINT GOLEM hurls compacted fluff!', dmg: [3, 5], weight: 3 },
      { name: 'Static Cling', msg: 'LINT GOLEM crackles with static. Its attack rises!', self: 'atk+', weight: 1 },
    ],
    scan: 'It grew one sock at a time, for years. LESSON: state accumulates on every loop iteration — know what your loop is building.',
  },
  sludgecone: {
    id: 'sludgecone',
    name: 'SLUDGE CONE',
    hp: 24,
    xp: 14,
    scrap: 6,
    sprite: SLUDGE_CONE,
    moves: [
      { name: 'Ooze Splash', msg: 'SLUDGE CONE splashes expired coffee ooze!', dmg: [4, 6], weight: 3 },
      { name: 'Harden', msg: 'SLUDGE CONE congeals. It braces for the next hit!', self: 'guard', weight: 1 },
    ],
    scan: 'A wet-floor cone that will not change and will not move. LESSON: that is what `const` means, and the compiler enforces it.',
  },

  // ------------------------------------------------------------- Floor 1
  shredling: {
    id: 'shredling',
    name: 'SHREDLING',
    hp: 20,
    xp: 12,
    scrap: 4,
    sprite: SHREDLING,
    moves: [
      { name: 'Paper Storm', msg: 'SHREDLING flings a blizzard of confetti!', dmg: [4, 6], weight: 3 },
      { name: 'Reassemble', msg: 'SHREDLING knits its strips tighter. It braces!', self: 'guard', weight: 1 },
    ],
    scan: 'A document shredded, then reassembled wrong. LESSON: reading a value in the wrong order gives nonsense — sequence matters.',
  },
  junkfax: {
    id: 'junkfax',
    name: 'JUNK FAX',
    hp: 26,
    xp: 16,
    scrap: 6,
    sprite: JUNK_FAX,
    moves: [
      { name: 'Cover Sheet', msg: 'JUNK FAX spools endless cover sheets at you!', dmg: [5, 7], weight: 3 },
      { name: 'Redial', msg: 'JUNK FAX redials, louder. Its output rises!', self: 'atk+', weight: 1 },
    ],
    scan: 'It transmits the same page forever, never checking if anyone reads it. LESSON: an unbounded loop with no exit condition never stops.',
  },
  mislabel: {
    id: 'mislabel',
    name: 'MISLABEL',
    hp: 60,
    xp: 40,
    scrap: 20,
    sprite: MISLABEL,
    boss: true,
    intro: 'A parcel lurches upright, plastered with a dozen contradictory labels. MISLABEL claims to be FRAGILE, PERISHABLE, and EMPTY at once.',
    defeat: 'MISLABEL bursts. A blizzard of contradictory labels drifts down, and the back dock is finally, truly quiet.',
    // Telegraphed 3-turn rotation: brace, then two heavy hits — readable, like a switch.
    script: [1, 0, 2],
    weakTo: 'switchcase',
    weakHint: 'Its labels lie about its type. LESSON: to handle a value that could be many types, switch on what it ACTUALLY is. Switch Case cuts through the labels.',
    moves: [
      { name: 'Return to Sender', msg: 'MISLABEL hurls itself shoulder-first!', dmg: [6, 9], weight: 1 },
      { name: 'Relabel', msg: 'MISLABEL slaps on a fresh FRAGILE sticker and braces.', self: 'guard', weight: 1 },
      { name: 'Postage Due', msg: 'MISLABEL dumps a sack of unpaid postage on you!', dmg: [7, 11], weight: 1 },
    ],
    scan: 'A package that refuses to declare its type. Every label contradicts the last.',
  },

  // ------------------------------------------------------------- Floor 2
  tallymore: {
    id: 'tallymore',
    name: 'TALLYMORE',
    hp: 30,
    xp: 18,
    scrap: 7,
    sprite: TALLYMORE,
    moves: [
      { name: 'Add One', msg: 'TALLYMORE scratches another mark and swells!', dmg: [5, 7], weight: 3 },
      { name: 'Carry', msg: 'TALLYMORE tallies harder. Its total keeps climbing!', self: 'atk+', weight: 2 },
    ],
    scan: 'It adds one to itself every single turn and never resets. LESSON: an accumulator keeps its running total across the whole loop — initialise it, and know when to stop.',
  },
  rolo: {
    id: 'rolo',
    name: 'ROLO',
    hp: 34,
    xp: 22,
    scrap: 9,
    sprite: ROLO,
    moves: [
      { name: 'Spin Cycle', msg: 'ROLO whirls its cards into a buzzsaw!', dmg: [6, 8], weight: 3 },
      { name: 'Rewind', msg: 'ROLO flips back to the first card and braces.', self: 'guard', weight: 1 },
    ],
    scan: 'A card wheel that spins and spins, its stop condition never true. LESSON: a loop with no exit runs forever — always give while/for a way to end.',
  },
  offbyone: {
    id: 'offbyone',
    name: 'OFF-BY-ONE',
    hp: 78,
    xp: 55,
    scrap: 28,
    sprite: OFF_BY_ONE,
    boss: true,
    intro: 'A tower of file drawers grinds upright. OFF-BY-ONE counts the intruders: "ONE. TWO. THREE. FOUR." There are three of you. It is already wrong, and it will not stop at the last one.',
    defeat: 'OFF-BY-ONE reaches for one drawer too many, overbalances, and topples. Its drawers scatter across the floor — numbered, counted, and finally still.',
    // Telegraphed rotation: count up (buff), then two overreaching strikes.
    script: [1, 0, 2, 0],
    weakTo: 'looplash',
    weakHint: 'It always runs one iteration too many — that overrun is when it is exposed. LESSON: a loop bounded i <= n visits n+1 items; use i < n. A correctly counted Loop Lash strikes it clean.',
    moves: [
      { name: 'Index n', msg: 'OFF-BY-ONE files a drawer squarely into you!', dmg: [7, 10], weight: 1 },
      { name: 'Recount', msg: 'OFF-BY-ONE counts again from zero. Its total rises!', self: 'atk+', weight: 1 },
      { name: 'Overrun', msg: 'OFF-BY-ONE reaches for index n+1 that is not there — and slams it anyway!', dmg: [9, 13], weight: 1 },
    ],
    scan: 'A filing unit that always counts one past the end. Its drawers number 0,1,2... and then one drawer too many.',
  },

  // ------------------------------------------------------------- Floor 3
  copypasta: {
    id: 'copypasta',
    name: 'COPYPASTA',
    hp: 38,
    xp: 26,
    scrap: 10,
    sprite: COPYPASTA,
    moves: [
      { name: 'Paste Slam', msg: 'COPYPASTA slams you with sixty identical pages!', dmg: [6, 9], weight: 3 },
      { name: 'Duplicate', msg: 'COPYPASTA runs itself through the copier again. It thickens!', self: 'atk+', weight: 1 },
    ],
    scan: 'The same memo, photocopied until it fused into a body. LESSON: if you write the same code twice, make it a function — one definition, many calls.',
  },
  scopecreep: {
    id: 'scopecreep',
    name: 'SCOPE CREEP',
    hp: 44,
    xp: 30,
    scrap: 12,
    sprite: SCOPE_CREEP,
    moves: [
      { name: 'Spill Over', msg: 'SCOPE CREEP surges over its partition and onto you!', dmg: [7, 10], weight: 3 },
      { name: 'Annex', msg: 'SCOPE CREEP claims another cubicle. Its reach grows!', self: 'atk+', weight: 1 },
    ],
    scan: 'It was assigned one cubicle. It seeped into nine. LESSON: a variable lives inside the braces that declared it — keep things local, or everything touches everything.',
  },
  stackoverflow: {
    id: 'stackoverflow',
    name: 'STACK OVERFLOW',
    hp: 96,
    xp: 70,
    scrap: 36,
    sprite: STACK_OVERFLOW,
    boss: true,
    intro:
      'The corner office is a tower of letter trays, each stacked on the last, swaying. STACK OVERFLOW adds another tray to itself. And another. It has no plan to stop.',
    defeat:
      'One clean call is answered, returns, and the tower finally unwinds — tray by tray, frame by frame — until the corner office is just a floor with paper on it.',
    // Telegraphed rotation: stack itself higher, strike, stack, then the big drop.
    script: [1, 0, 1, 2],
    weakTo: 'subroutine',
    weakHint:
      'It keeps calling itself and nothing ever returns — frames pile on frames with no base case. LESSON: recursion must shrink toward a stop. One well-factored Subroutine call collapses the whole pile.',
    moves: [
      { name: 'Push Frame', msg: 'STACK OVERFLOW drops a loaded tray on you!', dmg: [8, 11], weight: 1 },
      { name: 'Self Call', msg: 'STACK OVERFLOW stacks another copy of itself. It looms taller!', self: 'atk+', weight: 1 },
      { name: 'Deep Stack', msg: 'The whole tower lurches and slams down across you!', dmg: [10, 14], weight: 1 },
    ],
    scan: 'A pile of pending work that only ever grows. Each layer is a call that never came back.',
  },
}
