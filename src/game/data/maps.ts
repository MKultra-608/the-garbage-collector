/**
 * Maps are string grids — one char per tile (legend in art/tiles.ts) — plus
 * an entity list. Interactive/solid things that can appear, disappear, or
 * talk are entities; everything static is a tile.
 *
 * FLOOR 0 layout: janitor closet (top-left, the start), open hallway with
 * desks, break room (top-right, carpet), terminal alcove (bottom-right),
 * elevator embedded in the east wall. Trash piles are fixed encounters
 * keyed to flags, so defeated garbage stays gone.
 */

import type { Facing } from '../state.ts'

export type EntityDef =
  | { kind: 'npc'; x: number; y: number; name: string; lines: string[] }
  | { kind: 'sign'; x: number; y: number; text: string }
  | { kind: 'terminal'; x: number; y: number }
  | { kind: 'trash'; x: number; y: number; enemy: string; flag: string }
  | { kind: 'boss'; x: number; y: number; enemy: string; flag: string; intro?: string[] }
  | { kind: 'elevator'; x: number; y: number }

export interface MapDef {
  id: string
  name: string
  grid: string[]
  entities: EntityDef[]
}

/** Elevator-reachable floor: its map, arrival spawn, and optional boss gate. */
export interface FloorInfo {
  id: string
  /** Short label shown in the elevator panel. */
  name: string
  spawn: { x: number; y: number; facing: Facing }
  /** If set, this flag must be true (boss defeated) for the floor to count as cleared. */
  bossFlag?: string
}

const floor0: MapDef = {
  id: 'floor0',
  name: 'SUB-BASEMENT — ORIENTATION',
  grid: [
    'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    'V#########G##################V',
    'V#SSSS#.............#,,,,,,W#V',
    'V#....#.............#,,,,,,,#V',
    'V#...............P..#,,,,,,,#V',
    'V#....#.............#,,,,,,,#V',
    'V#SSSS#.............#,,,,,,,#V',
    'V######.............###.#####V',
    'V#..........DD..DD..........EV',
    'V#..........DD..DD..........EV',
    'V#..........DD..DD..#####.###V',
    'V#..................#.......#V',
    'V#..................#.......#V',
    'V#..................#.......#V',
    'V#..................#..MMM..#V',
    'V############################V',
    'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
  ],
  entities: [
    {
      kind: 'npc',
      x: 23,
      y: 4,
      name: 'PRAM',
      lines: [
        'Terminals are in the south alcove, past the desks. The building only respects C++.',
        "Learn a line, earn a power. That's the deal the architects left us.",
        "Filter's itchy tonight. Keep yours on anyway. The particulate is... ambitious.",
      ],
    },
    {
      kind: 'sign',
      x: 10,
      y: 1,
      text: 'CUSTODIAL NOTICE: Move with ARROWS or WASD. Z inspects, talks, and confirms. X backs out. ENTER opens your kit. Certify at a terminal before touching anything that drips.',
    },
    { kind: 'terminal', x: 24, y: 14 },
    { kind: 'trash', x: 10, y: 5, enemy: 'crumple', flag: 'f0-trash-1' },
    { kind: 'trash', x: 15, y: 9, enemy: 'crumple', flag: 'f0-trash-2' },
    { kind: 'trash', x: 8, y: 13, enemy: 'lintgolem', flag: 'f0-trash-3' },
    { kind: 'trash', x: 24, y: 12, enemy: 'sludgecone', flag: 'f0-trash-4' },
    { kind: 'elevator', x: 28, y: 8 },
    { kind: 'elevator', x: 28, y: 9 },
  ],
}

// ------------------------------------------------------------------ Floor 1
// Built with a row helper so every row is guaranteed 30 wide. Interiors are
// 26 chars (cols 2..27); `mrow` pads short interiors with floor and wraps
// them in the border walls. Elevator rows override the left wall with 'E'.

const FW = 26
function mrow(interior: string, left = '#', right = '#'): string {
  const inner = interior.padEnd(FW, '.').slice(0, FW)
  return 'V' + left + inner + right + 'V'
}
function topWall(signCol: number): string {
  let wall = ''
  for (let i = 0; i < 28; i++) wall += i + 1 === signCol ? 'G' : '#'
  return 'V' + wall + 'V'
}
const BORDER = 'V'.repeat(30)
const BOTTOM = 'V' + '#'.repeat(28) + 'V'

const floor1: MapDef = {
  id: 'floor1',
  name: 'FLOOR 1 — MAILROOM',
  grid: [
    BORDER,
    topWall(14),
    mrow('HHHHH..............#,,,,,,'), // pigeonholes | break room (carpet)
    mrow('H...H...............,,,,,,'), //  door into break room at col21
    mrow('H...H..............#,,W,,,'), //  cooler in break room
    mrow('HHHHH..............#,,,,,,'),
    mrow(''), // open hall
    mrow('.....CCCCCCCCCCCCC', 'E'), //  elevator (west) + conveyor
    mrow('.....C...DD..DD...C', 'E'), //  sorting desks between conveyor rails
    mrow('.....CCCCCCCCCCCCC'),
    mrow(''),
    mrow(''),
    mrow('.........######'), //  terminal nook (top)
    mrow('.........#M..M#'), //  two terminals
    mrow(''), // approach to terminals / back dock
    BOTTOM,
    BORDER,
  ],
  entities: [
    { kind: 'elevator', x: 1, y: 7 },
    { kind: 'elevator', x: 1, y: 8 },
    {
      kind: 'sign',
      x: 14,
      y: 1,
      text: 'MAILROOM NOTICE: Sorting terminals now teach cin (read what the world gives you) and switch (one branch per label). The back dock is jammed with something that will not declare its type. Do not sign for it.',
    },
    {
      kind: 'npc',
      x: 5,
      y: 11,
      name: 'COURIER',
      lines: [
        'You are the new collector? Then you take the dock. I only deliver.',
        'Everything down here lies about what it is. FRAGILE, PERISHABLE, EMPTY — same box, three stickers.',
        'The terminals taught me one trick: stop trusting the label. switch on what it actually IS.',
      ],
    },
    { kind: 'terminal', x: 12, y: 13 },
    { kind: 'terminal', x: 15, y: 13 },
    { kind: 'trash', x: 16, y: 6, enemy: 'shredling', flag: 'f1-trash-1' },
    { kind: 'trash', x: 9, y: 10, enemy: 'junkfax', flag: 'f1-trash-2' },
    { kind: 'trash', x: 21, y: 10, enemy: 'shredling', flag: 'f1-trash-3' },
    {
      kind: 'boss',
      x: 24,
      y: 8,
      enemy: 'mislabel',
      flag: 'f1-boss',
      intro: [
        'The jammed parcel at the back dock shudders and stands.',
        'Its labels flicker: FRAGILE. PERISHABLE. EMPTY. RETURN TO SENDER.',
        'It will not say what it is. You will have to sort it yourself.',
      ],
    },
  ],
}

// ------------------------------------------------------------------ Floor 2
// The Archives. Long identical aisles of filing cabinets (repetition = loops),
// archive boxes, a reading nook, and OFF-BY-ONE waiting in the open east.

const floor2: MapDef = {
  id: 'floor2',
  name: 'FLOOR 2 — THE ARCHIVES',
  grid: [
    BORDER,
    topWall(14),
    mrow('AAA................AAA'), // archive boxes in the corners
    mrow('FF.FF.FF.FF.FF.FF.FF.FF'), // cabinet aisle
    mrow(''),
    mrow('FF.FF.FF.FF.FF.FF.FF.FF'), // cabinet aisle
    mrow(''),
    mrow('', 'E'), // elevator (west) + arrival aisle
    mrow('', 'E'),
    mrow(''),
    mrow('FF.FF.FF.......FF.FF.FF'), // aisle with a central gap toward the vault
    mrow('..............,,,,,,,'), // reading nook (carpet) on the right
    mrow('.........######...,,,,,'),
    mrow('.........#M..M#...,,W,,'), // two terminals + a cooler in the nook
    mrow(''),
    BOTTOM,
    BORDER,
  ],
  entities: [
    { kind: 'elevator', x: 1, y: 7 },
    { kind: 'elevator', x: 1, y: 8 },
    {
      kind: 'sign',
      x: 14,
      y: 1,
      text: 'ARCHIVE NOTICE: These terminals teach loops — while and for — and the discipline of counting. Records are stored in aisles that repeat. The unit in the vault counts them for a living. It has never once counted right.',
    },
    {
      kind: 'npc',
      x: 5,
      y: 11,
      name: 'CLERK',
      lines: [
        'Careful in the aisles. They repeat. If you lose your count you will walk them forever, like the wheel-file does.',
        'A loop is a promise you make and a promise you keep: it will end. Give it a way to end. Please.',
        'The thing in the vault counts one too many. Always has. Count it out honestly and it comes apart.',
      ],
    },
    { kind: 'terminal', x: 12, y: 13 },
    { kind: 'terminal', x: 15, y: 13 },
    { kind: 'trash', x: 10, y: 4, enemy: 'tallymore', flag: 'f2-trash-1' },
    { kind: 'trash', x: 16, y: 6, enemy: 'rolo', flag: 'f2-trash-2' },
    { kind: 'trash', x: 20, y: 9, enemy: 'tallymore', flag: 'f2-trash-3' },
    {
      kind: 'boss',
      x: 24,
      y: 8,
      enemy: 'offbyone',
      flag: 'f2-boss',
      intro: [
        'The vault door rolls back. A tower of file drawers unfolds and begins to count.',
        '"ZERO. ONE. TWO. THREE." Its topmost drawer juts out one notch too far, glowing.',
        'It reaches for a fourth intruder that is not there. It will keep reaching.',
      ],
    },
  ],
}

// ------------------------------------------------------------------ Floor 3
// The Cubicle Maze. Fabric partitions turn the open plan into a labyrinth of
// little scopes; every pod is somebody's whole world. STACK OVERFLOW is piled
// up in the corner office, still adding trays to itself.

const floor3: MapDef = {
  id: 'floor3',
  name: 'FLOOR 3 — CUBICLE MAZE',
  grid: [
    BORDER,
    topWall(14),
    mrow('UUUU.UUUUUU.UUUUUU.UUU'), // partition maze, north pods
    mrow('...U....U......U......'),
    mrow('U..U.DD.U.DD...U.DD...'),
    mrow('U.......U......U......'),
    mrow('UUUU.UUUUUUUU.UUUUUUU.'),
    mrow('', 'E'), // elevator (west) + main corridor
    mrow('', 'E'),
    mrow('UUUUU.UUUUUU.UUUUUUUU.'),
    mrow('.....U......U....,,,,,'), // south pods | corner office (carpet)
    mrow('.DD..U..DD..U....,,,,,'),
    mrow('.....U....######.,,,,,'),
    mrow('.....U....#M..M#.,,W,,'), // terminal pod
    mrow(''),
    BOTTOM,
    BORDER,
  ],
  entities: [
    { kind: 'elevator', x: 1, y: 7 },
    { kind: 'elevator', x: 1, y: 8 },
    {
      kind: 'sign',
      x: 14,
      y: 1,
      text: 'FLOOR 3 NOTICE: These terminals teach the tools of organization — arrays and grids for data, functions for work you refuse to write twice, structs for records. The corner office is buried under work it keeps assigning to itself. Do not take a message.',
    },
    {
      kind: 'npc',
      x: 8,
      y: 11,
      name: 'TEMP',
      lines: [
        'I have been a temp here eleven years. No desk of my own. I just get copied wherever there is a gap.',
        'That is the whole disease of this floor: nobody writes a function. They copy the work and paste it into another cubicle.',
        'The thing in the corner office delegates to itself. No base case. It has been "almost done" since before I started.',
      ],
    },
    { kind: 'terminal', x: 13, y: 13 },
    { kind: 'terminal', x: 16, y: 13 },
    { kind: 'trash', x: 8, y: 3, enemy: 'copypasta', flag: 'f3-trash-1' },
    { kind: 'trash', x: 20, y: 5, enemy: 'scopecreep', flag: 'f3-trash-2' },
    { kind: 'trash', x: 9, y: 10, enemy: 'copypasta', flag: 'f3-trash-3' },
    {
      kind: 'boss',
      x: 22,
      y: 11,
      enemy: 'stackoverflow',
      flag: 'f3-boss',
      intro: [
        'The corner office is not an office anymore. It is a tower of letter trays, floor to ceiling, swaying.',
        'A tray near the top slides out, hesitates, and stacks itself on the very top. The tower grows by one.',
        'Somewhere deep inside, a first call is still waiting for an answer that never comes.',
      ],
    },
  ],
}

export const MAPS: Record<string, MapDef> = { floor0, floor1, floor2, floor3 }

/** All floors, in ride order. Index doubles as floor number. */
const ALL_FLOORS: FloorInfo[] = [
  { id: 'floor0', name: 'B  ORIENTATION', spawn: { x: 27, y: 8, facing: 'left' } },
  { id: 'floor1', name: '1  MAILROOM', spawn: { x: 2, y: 8, facing: 'right' }, bossFlag: 'f1-boss' },
  { id: 'floor2', name: '2  ARCHIVES', spawn: { x: 2, y: 8, facing: 'right' }, bossFlag: 'f2-boss' },
  { id: 'floor3', name: '3  CUBICLES', spawn: { x: 2, y: 8, facing: 'right' }, bossFlag: 'f3-boss' },
]

/**
 * Elevator-reachable floors. The demo build caps this at Floor 1 via
 * __DEMO_MAX_FLOOR__ (see vite.config.ts); in dev/tests the cap is absent, so
 * every floor is reachable. Floors beyond the cap stay in MAPS but are gated
 * out here, so the game naturally ends after the last reachable floor.
 */
const MAX_FLOOR = typeof __DEMO_MAX_FLOOR__ !== 'undefined' ? __DEMO_MAX_FLOOR__ : 999
export const FLOORS: FloorInfo[] = ALL_FLOORS.filter((_, i) => i <= MAX_FLOOR)

/** True in the public demo build (used for end-of-content messaging). */
export const IS_DEMO = typeof __DEMO__ !== 'undefined' ? __DEMO__ : false

/** Pram's radio call that opens a new game. */
export const INTRO_LINES: { who?: string; text: string }[] = [
  { who: 'PRAM', text: '*krzzt* New kid. You awake? Good. Radio check, one two.' },
  {
    who: 'PRAM',
    text: "Night shift rules. Rule one: the GARBAGE COLLECTOR is down. Has been for years. Nobody is coming to clean this place up.",
  },
  {
    who: 'PRAM',
    text: 'The trash took the hint. It got organized. Your mop handles the small stuff — for everything else, there are the wall terminals.',
  },
  {
    who: 'PRAM',
    text: "They teach C++. The building's maintenance language. Learn a line, earn a power. That's how it works down here.",
  },
  { who: 'PRAM', text: 'Certify on all four terminal exercises and I will call the elevator. And kid — keep the mask on. Always.' },
]
