import type { Engine, Scene } from '../../engine/engine.ts'
import { VIEW_W, VIEW_H } from '../../engine/engine.ts'
import { K } from '../../engine/input.ts'
import { drawText, drawPanel, wrapText } from '../../ui/text.ts'
import { PAL } from '../../art/palette.ts'

export interface DialogueLine {
  who?: string
  text: string
}

interface Page {
  who?: string
  lines: string[]
}

/**
 * The one dialogue box for the whole game: bottom panel, typewriter reveal,
 * Z to fast-forward then advance. Pushed as a transparent overlay on top of
 * whatever scene is talking.
 */
export class DialogueScene implements Scene {
  readonly transparent = true
  private pages: Page[] = []
  private page = 0
  private shown = 0
  private charTimer = 0

  constructor(
    private eng: Engine,
    lines: DialogueLine[],
    private onDone?: () => void,
  ) {
    for (const line of lines) {
      const wrapped = wrapText(line.text, 288)
      for (let i = 0; i < wrapped.length; i += 3) {
        this.pages.push({ who: line.who, lines: wrapped.slice(i, i + 3) })
      }
    }
    if (this.pages.length === 0) this.pages.push({ lines: [''] })
  }

  private pageText(): string {
    return this.pages[this.page].lines.join('\n')
  }

  update(dt: number): void {
    const total = this.pageText().length
    if (this.shown < total) {
      this.charTimer += dt * 55
      while (this.charTimer >= 1 && this.shown < total) {
        this.charTimer -= 1
        this.shown++
        if (this.shown % 3 === 0) this.eng.audio.blip()
      }
      if (this.eng.input.wasPressed(...K.ok)) this.shown = total
      return
    }
    if (this.eng.input.wasPressed(...K.ok, ...K.cancel)) {
      this.eng.audio.confirm()
      if (this.page < this.pages.length - 1) {
        this.page++
        this.shown = 0
      } else {
        this.eng.pop()
        this.onDone?.()
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const h = 46
    const y = VIEW_H - h - 6
    drawPanel(ctx, 6, y, VIEW_W - 12, h)
    const p = this.pages[this.page]
    if (p.who) {
      drawPanel(ctx, 10, y - 8, p.who.length * 6 + 10, 13, { border: PAL.gray3 })
      drawText(ctx, p.who, 15, y - 5, PAL.amber)
    }
    let remaining = this.shown
    for (let i = 0; i < p.lines.length; i++) {
      const line = p.lines[i]
      const take = Math.max(0, Math.min(line.length, remaining))
      remaining -= line.length + 1 // +1 accounts for the \n in pageText()
      drawText(ctx, line.slice(0, take), 14, y + 8 + i * 10, PAL.white)
    }
    if (this.shown >= this.pageText().length && Math.floor(this.eng.time * 2) % 2 === 0) {
      drawText(ctx, 'v', VIEW_W - 20, y + h - 10, PAL.crt)
    }
  }
}
