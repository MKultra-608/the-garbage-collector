import type { Engine, Scene } from '../../engine/engine.ts'
import { VIEW_W } from '../../engine/engine.ts'
import { K } from '../../engine/input.ts'
import { drawText, drawPanel, wrapText } from '../../ui/text.ts'
import { PAL } from '../../art/palette.ts'
import type { GameState } from '../state.ts'
import type { Challenge } from '../data/challenges.ts'
import { ABILITIES } from '../data/abilities.ts'
import { challengesForFloor } from '../progression.ts'
import { EditorScene } from './editor.ts'

const PANEL_W = 240
const LIST_TOP = 52
const ROW_H = 12
/** Rows visible at once; longer lists scroll (Floor 3 carries six). */
const VISIBLE = 5

/** Wall terminal: pick a certification exercise for the current floor. */
export class TerminalScene implements Scene {
  readonly transparent = true
  private cursor = 0
  /** First visible row — the list scrolls to keep the cursor on screen. */
  private scroll = 0
  private list: Challenge[]

  constructor(
    private eng: Engine,
    private gs: GameState,
  ) {
    this.list = challengesForFloor(gs.map)
    // open on the first exercise still awaiting certification
    const firstPending = this.list.findIndex((c) => !this.gs.flags[c.doneFlag])
    if (firstPending >= 0) this.cursor = firstPending
    this.clampScroll()
  }

  /** Keep the cursor within the visible window and the window within bounds. */
  private clampScroll(): void {
    if (this.cursor < this.scroll) this.scroll = this.cursor
    if (this.cursor >= this.scroll + VISIBLE) this.scroll = this.cursor - VISIBLE + 1
    const max = Math.max(0, this.list.length - VISIBLE)
    this.scroll = Math.min(max, Math.max(0, this.scroll))
  }

  update(): void {
    const inp = this.eng.input
    const n = this.list.length
    if (n === 0) {
      if (inp.wasPressed(...K.cancel, ...K.ok)) {
        this.eng.audio.cancel()
        this.eng.pop()
      }
      return
    }
    if (inp.wasPressed(...K.up)) {
      this.cursor = (this.cursor + n - 1) % n
      this.clampScroll()
      this.eng.audio.cursor()
    }
    if (inp.wasPressed(...K.down)) {
      this.cursor = (this.cursor + 1) % n
      this.clampScroll()
      this.eng.audio.cursor()
    }
    if (inp.wasPressed(...K.cancel)) {
      this.eng.audio.cancel()
      this.eng.pop()
      return
    }
    if (inp.wasPressed(...K.ok)) {
      this.eng.audio.confirm()
      this.eng.push(new EditorScene(this.eng, this.gs, this.list[this.cursor]))
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const w = PANEL_W
    const x = (VIEW_W - w) / 2
    drawPanel(ctx, x, 20, w, 140, { border: PAL.crtDim })
    drawText(ctx, 'MAINTENANCE TERMINAL', x + 8, 28, PAL.crt)
    drawText(ctx, 'CERTIFICATION EXERCISES', x + 8, 38, PAL.crtDim)

    if (this.list.length === 0) {
      drawText(ctx, 'NO EXERCISES ON THIS FLOOR.', x + 8, 60, PAL.gray3)
      drawText(ctx, 'X:CLOSE', x + 8, 150, PAL.gray2)
      return
    }

    // header progress — n/m certified, greened once the floor is complete
    const done = this.list.filter((c) => this.gs.flags[c.doneFlag]).length
    const total = this.list.length
    const prog = `${done}/${total} CERTIFIED`
    drawText(ctx, prog, x + w - prog.length * 6 - 8, 38, done === total ? PAL.crt : PAL.gray3)

    // scrolling list window
    const end = Math.min(this.list.length, this.scroll + VISIBLE)
    for (let i = this.scroll; i < end; i++) {
      const ch = this.list[i]
      const y = LIST_TOP + (i - this.scroll) * ROW_H
      const cert = !!this.gs.flags[ch.doneFlag]
      const sel = i === this.cursor
      if (sel) drawText(ctx, '>', x + 8, y, PAL.amber)
      drawText(ctx, ch.title, x + 18, y, sel ? PAL.white : cert ? PAL.crtDim : PAL.gray3)
      drawText(ctx, cert ? '[CERTIFIED]' : '[ PENDING ]', x + w - 74, y, cert ? PAL.crt : PAL.gray2)
    }

    // scrollbar: track + proportional thumb, only when the list overflows
    if (this.list.length > VISIBLE) {
      const trackTop = LIST_TOP - 2
      const trackH = VISIBLE * ROW_H
      const barX = x + w - 4
      ctx.fillStyle = PAL.gray1
      ctx.fillRect(barX, trackTop, 2, trackH)
      const thumbH = Math.max(6, Math.round((VISIBLE / this.list.length) * trackH))
      const range = trackH - thumbH
      const thumbY = trackTop + Math.round((this.scroll / (this.list.length - VISIBLE)) * range)
      ctx.fillStyle = PAL.crtDim
      ctx.fillRect(barX, thumbY, 2, thumbH)
    }

    // detail block for the highlighted exercise
    ctx.fillStyle = PAL.gray1
    ctx.fillRect(x + 8, 114, w - 16, 1)
    const ch = this.list[this.cursor]
    const teaches = wrapText(`TEACHES: ${ch.teaches}`, w - 16)[0] ?? ''
    drawText(ctx, teaches, x + 8, 119, PAL.cyan)
    const reward = ch.reward.ability
      ? `REWARD: ${ABILITIES[ch.reward.ability]?.name ?? ch.reward.ability}`
      : ch.reward.ramBonus
        ? `REWARD: +${ch.reward.ramBonus} MAX RAM`
        : 'REWARD: SCRAP'
    drawText(ctx, reward, x + 8, 131, PAL.amber)
    const task = wrapText(ch.brief[ch.brief.length - 1] ?? '', w - 16)[0] ?? ''
    drawText(ctx, task, x + 8, 143, PAL.gray4)
    drawText(ctx, 'Z:OPEN  X:CLOSE', x + 8, 153, PAL.gray2)
  }
}
