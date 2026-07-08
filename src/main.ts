import { Engine } from './engine/engine.ts'
import { BootScene } from './game/scenes/boot.ts'

const canvas = document.getElementById('screen') as HTMLCanvasElement
const engine = new Engine(canvas)

// Debug/verification API — used by developers and automated agents.
// Documented in CLAUDE.md ("Debug API"). Extended by OverworldScene with
// `state` and `warp(x, y)` once a game is running.
const w = window as unknown as { __gc?: Record<string, unknown> }
w.__gc = {
  ...(w.__gc ?? {}),
  engine,
  scene: () => engine.top()?.constructor.name,
  /** Simulate a key press (keydown+keyup), e.g. __gc.key('z') or __gc.key('Enter', {ctrl:true}). */
  key: (key: string, mods: { ctrl?: boolean } = {}) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: !!mods.ctrl }))
    window.dispatchEvent(new KeyboardEvent('keyup', { key, ctrlKey: !!mods.ctrl }))
  },
  /** Hold/release a key for movement testing. */
  keyDown: (key: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key })),
  keyUp: (key: string) => window.dispatchEvent(new KeyboardEvent('keyup', { key })),
}

engine.start(new BootScene(engine))
