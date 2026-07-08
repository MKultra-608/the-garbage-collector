import { Input } from './input.ts'
import { AudioSys } from './audio.ts'

/** Internal render resolution. Everything is drawn in this pixel space. */
export const VIEW_W = 320
export const VIEW_H = 180

export interface Scene {
  /** Transparent scenes (dialogue, pause, terminal list) draw the scenes beneath them first. */
  readonly transparent?: boolean
  onEnter?(): void
  onExit?(): void
  update(dt: number): void
  draw(ctx: CanvasRenderingContext2D): void
}

interface Wipe {
  phase: 'out' | 'in'
  t: number
  dur: number
  swap?: () => void
}

/**
 * Owns the fixed-timestep loop, the scene stack, screen transitions,
 * screen shake, and the pixel-perfect integer upscale to the display canvas.
 * Scenes never touch the display canvas — they draw into a 320x180 buffer.
 */
export class Engine {
  readonly input = new Input()
  readonly audio = new AudioSys()
  /** Global clock in seconds, for idle animations. */
  time = 0
  /** Screen shake magnitude in internal pixels; decays automatically. */
  shake = 0

  private buffer: HTMLCanvasElement
  private bctx: CanvasRenderingContext2D
  private display: HTMLCanvasElement
  private dctx: CanvasRenderingContext2D
  private stack: Scene[] = []
  private wipe: Wipe | null = null
  private last = performance.now()
  private acc = 0

  constructor(display: HTMLCanvasElement) {
    this.display = display
    this.buffer = document.createElement('canvas')
    this.buffer.width = VIEW_W
    this.buffer.height = VIEW_H
    this.bctx = this.buffer.getContext('2d')!
    this.dctx = display.getContext('2d')!
    this.input.attach(window)
    this.input.onFirstKey = () => this.audio.unlock()
    window.addEventListener('resize', () => this.fit())
    this.fit()
  }

  private fit(): void {
    const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H)))
    this.display.width = VIEW_W * scale
    this.display.height = VIEW_H * scale
    this.dctx.imageSmoothingEnabled = false
  }

  start(initial: Scene): void {
    this.push(initial)
    requestAnimationFrame(this.frame)
  }

  push(scene: Scene): void {
    this.stack.push(scene)
    scene.onEnter?.()
  }

  pop(): void {
    const s = this.stack.pop()
    s?.onExit?.()
  }

  replace(scene: Scene): void {
    while (this.stack.length) this.pop()
    this.push(scene)
  }

  top(): Scene | undefined {
    return this.stack[this.stack.length - 1]
  }

  /** Fade to black, run `swap` (push/pop/replace scenes), fade back in. */
  transition(swap: () => void, dur = 0.3): void {
    if (this.wipe) return
    this.wipe = { phase: 'out', t: 0, dur, swap }
  }

  private frame = (now: number): void => {
    const elapsed = Math.min(0.25, (now - this.last) / 1000)
    this.last = now
    this.acc += elapsed
    const STEP = 1 / 60
    let steps = 0
    while (this.acc >= STEP && steps < 5) {
      this.tick(STEP)
      this.acc -= STEP
      steps++
    }
    this.render()
    requestAnimationFrame(this.frame)
  }

  private tick(dt: number): void {
    this.time += dt
    this.shake = Math.max(0, this.shake - dt * 20)
    if (this.wipe) {
      // Freeze gameplay during transitions so input can't fire mid-wipe.
      this.wipe.t += dt
      if (this.wipe.phase === 'out' && this.wipe.t >= this.wipe.dur) {
        this.wipe.swap?.()
        this.wipe = { phase: 'in', t: 0, dur: this.wipe.dur }
      } else if (this.wipe.phase === 'in' && this.wipe.t >= this.wipe.dur) {
        this.wipe = null
      }
      this.input.endFrame()
      return
    }
    this.top()?.update(dt)
    this.input.endFrame()
  }

  private render(): void {
    const ctx = this.bctx
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = '#0d0d10'
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)

    // Draw stack from the deepest opaque scene upward.
    let start = this.stack.length - 1
    while (start > 0 && this.stack[start].transparent) start--
    ctx.save()
    if (this.shake > 0) {
      ctx.translate(
        Math.round((Math.random() - 0.5) * this.shake * 2),
        Math.round((Math.random() - 0.5) * this.shake * 2),
      )
    }
    for (let i = start; i < this.stack.length; i++) this.stack[i].draw(ctx)
    ctx.restore()

    // Transition curtain.
    if (this.wipe) {
      const p = Math.min(1, this.wipe.t / this.wipe.dur)
      ctx.fillStyle = '#0d0d10'
      ctx.globalAlpha = this.wipe.phase === 'out' ? p : 1 - p
      ctx.fillRect(0, 0, VIEW_W, VIEW_H)
      ctx.globalAlpha = 1
    }

    // Integer upscale + subtle scanlines (the whole game is a CRT terminal).
    const scale = this.display.width / VIEW_W
    this.dctx.imageSmoothingEnabled = false
    this.dctx.drawImage(this.buffer, 0, 0, this.display.width, this.display.height)
    if (scale >= 3) {
      this.dctx.fillStyle = 'rgba(0,0,0,0.10)'
      for (let y = 0; y < this.display.height; y += scale) {
        this.dctx.fillRect(0, y, this.display.width, 1)
      }
    }
  }
}
