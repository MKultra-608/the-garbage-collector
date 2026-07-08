import type { Engine, Scene } from '../../engine/engine.ts'
import { drawText } from '../../ui/text.ts'
import { PAL } from '../../art/palette.ts'
import { TitleScene } from './title.ts'

const LOG = [
  'COMPLEX 7 MAINTENANCE OS v0.9.1',
  '(c) 1987 THE ARCHITECTS. ALL RIGHTS WAIVED.',
  '',
  'MEMORY CHECK ......... 640K (LEAKING)',
  'FLUORESCENT GRID ..... HUMMING',
  'GC DAEMON ............ NOT RESPONDING',
  'GC DAEMON ............ NOT RESPONDING',
  'GC DAEMON ............ GAVE UP',
  'JANITORIAL UNITS ..... 1 (YOU)',
  '',
  'NIGHT SHIFT BEGINS.',
]

/** CRT boot log. Any key skips. Sets the tone: silent building, humming lights. */
export class BootScene implements Scene {
  private t = 0
  constructor(private eng: Engine) {}

  update(dt: number): void {
    this.t += dt
    if (this.eng.input.anyPressed() || this.t > LOG.length * 0.38 + 1.6) {
      this.eng.transition(() => this.eng.replace(new TitleScene(this.eng)))
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const visible = Math.floor(this.t / 0.38)
    for (let i = 0; i <= Math.min(visible, LOG.length - 1); i++) {
      const line = LOG[i]
      const failed = line.includes('NOT RESPONDING') || line.includes('GAVE UP') || line.includes('LEAKING')
      drawText(ctx, line, 12, 12 + i * 10, failed ? PAL.amber : PAL.crt)
    }
    if (visible < LOG.length && Math.floor(this.t * 4) % 2 === 0) {
      drawText(ctx, '_', 12, 12 + Math.min(visible, LOG.length - 1) * 10 + 10, PAL.crt)
    }
  }
}
