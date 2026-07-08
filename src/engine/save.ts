import type { GameState } from '../game/state.ts'

const KEY = 'gc-save-v1'

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage may be unavailable; play continues unsaved */
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GameState
    if (parsed.version !== 1) return null // future migrations go here
    // Backfill fields added after a save was written (forward compatibility).
    if (!Array.isArray(parsed.unlockedFloors) || parsed.unlockedFloors.length === 0) {
      parsed.unlockedFloors = ['floor0']
    }
    if (!parsed.hintsSeen || typeof parsed.hintsSeen !== 'object') {
      parsed.hintsSeen = {}
    }
    return parsed
  } catch {
    return null
  }
}

export function hasSave(): boolean {
  return loadGame() !== null
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
