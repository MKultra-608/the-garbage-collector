/**
 * Keyboard-only input. The game is deliberately playable with one hand:
 *   Arrows / WASD  — move & menu cursor
 *   Z / Space      — confirm / interact ("OK")
 *   X / Escape     — cancel / back
 *   Enter          — pause menu (overworld)
 *
 * The code editor takes over raw key events via `rawHandler` (returns true
 * to consume the event so game bindings don't also fire).
 */

export const K = {
  left: ['ArrowLeft', 'a', 'A'],
  right: ['ArrowRight', 'd', 'D'],
  up: ['ArrowUp', 'w', 'W'],
  down: ['ArrowDown', 's', 'S'],
  ok: ['z', 'Z', ' '],
  cancel: ['x', 'X', 'Escape'],
  menu: ['Enter'],
}

export type RawKeyHandler = (e: KeyboardEvent) => boolean | void

export class Input {
  private held = new Set<string>()
  private pressed = new Set<string>()
  /** When set (code editor), keydown events are offered here first. */
  rawHandler: RawKeyHandler | null = null
  /** Fired once on the very first key press (used to unlock WebAudio). */
  onFirstKey: (() => void) | null = null
  private firstKeyFired = false

  attach(target: Window): void {
    target.addEventListener('keydown', (e) => {
      if (!this.firstKeyFired) {
        this.firstKeyFired = true
        this.onFirstKey?.()
      }
      if (this.rawHandler && this.rawHandler(e)) {
        e.preventDefault()
        return
      }
      // Stop the browser scrolling / tabbing away mid-game.
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Tab'].includes(e.key)) {
        e.preventDefault()
      }
      if (!e.repeat) this.pressed.add(e.key)
      this.held.add(e.key)
    })
    target.addEventListener('keyup', (e) => this.held.delete(e.key))
    target.addEventListener('blur', () => this.held.clear())
  }

  isDown(...keys: string[]): boolean {
    return keys.some((k) => this.held.has(k))
  }

  wasPressed(...keys: string[]): boolean {
    return keys.some((k) => this.pressed.has(k))
  }

  /** True if any key at all was pressed this tick (skip screens). */
  anyPressed(): boolean {
    return this.pressed.size > 0
  }

  /** Call at end of each update tick to clear edge-triggered presses. */
  endFrame(): void {
    this.pressed.clear()
  }
}
