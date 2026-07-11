import { PAL } from '../../art/palette.ts'

/**
 * Combat abilities. Each one is themed as a piece of C the player has
 * literally written at a terminal — `sig` is shown in menus so the code and
 * the power stay linked in the player's head.
 *
 * To add an ability: add it here, then have a challenge reward it
 * (game/data/challenges.ts) — never grant abilities any other way.
 */
export interface Ability {
  id: string
  name: string
  /** The line of C this power "is". */
  sig: string
  desc: string
  cost: number
  kind: 'attack' | 'buff' | 'guard' | 'scan'
  /** [min,max] damage before ATK is added (attack kind only). */
  power?: [number, number]
  /** Multi-hit attacks roll [min,max] separate strikes (each uses `power`). */
  hits?: [number, number]
  /** Noun for one strike of a multi-hit, e.g. "case" or "iteration". Default "hit". */
  hitWord?: string
  color: string
}

export const ABILITIES: Record<string, Ability> = {
  sweep: {
    id: 'sweep',
    name: 'Sweep',
    sig: 'wes.sweep(); // trusty mop',
    desc: 'A broad mop arc. Free, dependable.',
    cost: 0,
    kind: 'attack',
    power: [3, 5],
    color: PAL.gray4,
  },
  flush: {
    id: 'flush',
    name: 'Flush',
    sig: 'printf("%s", torrent); fflush(stdout);',
    desc: 'Blast the target with a pressurized output stream.',
    cost: 2,
    kind: 'attack',
    power: [6, 9],
    color: PAL.cyan,
  },
  increment: {
    id: 'increment',
    name: 'Increment',
    sig: 'atk++;',
    desc: 'Psych yourself up. +1 ATK this battle (stacks up to 3).',
    cost: 1,
    kind: 'buff',
    color: PAL.crt,
  },
  guard: {
    id: 'guard',
    name: 'Branch Guard',
    sig: 'if (hit) dmg /= 2;',
    desc: 'Brace behind a conditional. Next hit is halved.',
    cost: 1,
    kind: 'guard',
    color: PAL.amber,
  },
  switchcase: {
    id: 'switchcase',
    name: 'Switch Case',
    sig: 'switch(t){case..:} // per type',
    desc: 'Run a strike for each case. Hits 2-4 times — perfect against things pretending to be one type.',
    cost: 3,
    kind: 'attack',
    power: [2, 4],
    hits: [2, 4],
    hitWord: 'case',
    color: PAL.crt,
  },
  looplash: {
    id: 'looplash',
    name: 'Loop Lash',
    sig: 'for(i=0;i<n;i++) hit();',
    desc: 'A correctly counted flurry — exactly 3 strikes, no overrun. Cuts through things that count wrong.',
    cost: 4,
    kind: 'attack',
    power: [3, 5],
    hits: [3, 3],
    hitWord: 'iteration',
    color: PAL.cyan,
  },
  subroutine: {
    id: 'subroutine',
    name: 'Subroutine',
    sig: 'int clean(int mess); // reusable',
    desc: 'Call the routine you wrote once and trust: a single heavy, well-factored strike.',
    cost: 4,
    kind: 'attack',
    power: [10, 14],
    color: PAL.amber,
  },
  scan: {
    id: 'scan',
    name: 'Scan',
    sig: 'inspect(target); // read the docs',
    desc: "Read the enemy's documentation. Free, but takes your turn.",
    cost: 0,
    kind: 'scan',
    color: PAL.gray3,
  },
}
