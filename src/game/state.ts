export type Facing = 'up' | 'down' | 'left' | 'right'

export interface PlayerStats {
  hp: number
  maxHp: number
  /** RAM is the ability resource ("mana"). Regenerates a little each battle turn. */
  ram: number
  maxRam: number
  atk: number
  lvl: number
  xp: number
  /** Scrap is currency (future vending machines / upgrades). */
  scrap: number
}

export interface GameState {
  version: 1
  player: PlayerStats
  /** Ability ids in acquisition order. See game/data/abilities.ts */
  abilities: string[]
  /** World flags: defeated trash piles, completed challenges, story beats. */
  flags: Record<string, boolean>
  /** Last code written per challenge id, so players resume where they left off. */
  code: Record<string, string>
  /** How many hints the player has revealed per challenge id (persisted). */
  hintsSeen: Record<string, number>
  /** Floors the elevator will travel to. Grows as floors are cleared. */
  unlockedFloors: string[]
  map: string
  tx: number
  ty: number
  facing: Facing
}

export function newGame(): GameState {
  return {
    version: 1,
    player: { hp: 20, maxHp: 20, ram: 6, maxRam: 6, atk: 2, lvl: 1, xp: 0, scrap: 0 },
    abilities: ['sweep'],
    flags: {},
    code: {},
    hintsSeen: {},
    unlockedFloors: ['floor0'],
    map: 'floor0',
    tx: 3,
    ty: 4,
    facing: 'down',
  }
}

export function xpForLevel(lvl: number): number {
  return lvl * 12
}

/** Grants XP; returns human-readable messages (level ups etc.) for the battle log. */
export function grantXp(gs: GameState, xp: number): string[] {
  const msgs: string[] = []
  const p = gs.player
  p.xp += xp
  msgs.push(`Gained ${xp} XP.`)
  while (p.xp >= xpForLevel(p.lvl)) {
    p.xp -= xpForLevel(p.lvl)
    p.lvl++
    p.maxHp += 4
    p.maxRam += 1
    p.atk += 1
    p.hp = p.maxHp
    p.ram = p.maxRam
    msgs.push(`LEVEL UP! Wes is now level ${p.lvl}.`)
  }
  return msgs
}
