import type { GameState } from './state.ts'
import { FLOORS } from './data/maps.ts'
import { CHALLENGES } from './data/challenges.ts'

/**
 * Floor progression: which floors exist, whether a floor is "cleared", and
 * unlocking the next one. A floor is cleared when all its terminal
 * challenges are certified AND (if it has one) its boss is defeated. Clearing
 * a floor unlocks travel to the next.
 */

export function floorIndex(floorId: string): number {
  return FLOORS.findIndex((f) => f.id === floorId)
}

export function challengesForFloor(floorId: string) {
  const idx = floorIndex(floorId)
  return CHALLENGES.filter((c) => c.floor === idx)
}

export function challengesCertified(gs: GameState, floorId: string): number {
  return challengesForFloor(floorId).filter((c) => gs.flags[c.doneFlag]).length
}

export function isFloorCleared(gs: GameState, floorId: string): boolean {
  const floor = FLOORS.find((f) => f.id === floorId)
  if (!floor) return false
  const chs = challengesForFloor(floorId)
  const allCertified = chs.length > 0 && chs.every((c) => gs.flags[c.doneFlag])
  const bossDown = !floor.bossFlag || !!gs.flags[floor.bossFlag]
  return allCertified && bossDown
}

export function nextFloorId(floorId: string): string | null {
  const idx = floorIndex(floorId)
  return idx >= 0 && idx + 1 < FLOORS.length ? FLOORS[idx + 1].id : null
}

/**
 * If the current floor is now cleared and the next floor exists but is not
 * yet unlocked, unlock it and return its FloorInfo (so the caller can
 * announce it). Otherwise returns null. Idempotent.
 */
export function tryUnlockNextFloor(gs: GameState, floorId: string) {
  if (!isFloorCleared(gs, floorId)) return null
  const nextId = nextFloorId(floorId)
  if (!nextId) return null
  if (gs.unlockedFloors.includes(nextId)) return null
  gs.unlockedFloors.push(nextId)
  return FLOORS.find((f) => f.id === nextId) ?? null
}
