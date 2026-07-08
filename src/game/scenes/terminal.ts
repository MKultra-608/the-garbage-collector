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

/** Wall terminal: pick a certification exercise for the current floor. */
export class TerminalScene implements Scene {
  readonly transparent = true
  private cursor = 0
  private list: Challenge[]

  constructor(
    private eng: Engine,
    private gs: GameState,
  ) {
    this.list = challengesForFloor(gs.map)
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
      this.eng.audio.cursor()
    }
    if (inp.wasPressed(...K.down)) {
      this.cursor = (this.cursor + 1) % n
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
    const w = 240
    const x = (VIEW_W - w) / 2
    drawPanel(ctx, x, 20, w, 140, { border: PAL.crtDim })
    drawText(ctx, 'MAINTENANCE TERMINAL', x + 8, 28, PAL.crt)
    drawText(ctx, 'CERTIFICATION EXERCISES', x + 8, 38, PAL.crtDim)

    if (this.list.length === 0) {
      drawText(ctx, 'NO EXERCISES ON THIS FLOOR.', x + 8, 60, PAL.gray3)
      drawText(ctx, 'X:CLOSE', x + 8, 148, PAL.gray2)
      return
    }

    this.list.forEach((ch, i) => {
      const y = 54 + i * 12
      const done = !!this.gs.flags[ch.doneFlag]
      const sel = i === this.cursor
      if (sel) drawText(ctx, '>', x + 8, y, PAL.amber)
      drawText(ctx, ch.title, x + 18, y, sel ? PAL.white : PAL.gray3)
      drawText(ctx, done ? '[CERTIFIED]' : '[ PENDING ]', x + w - 76, y, done ? PAL.crt : PAL.gray2)
    })

    const ch = this.list[this.cursor]
    const reward = ch.reward.ability
      ? `REWARD: ${ABILITIES[ch.reward.ability]?.name ?? ch.reward.ability}`
      : ch.reward.ramBonus
        ? `REWARD: +${ch.reward.ramBonus} MAX RAM`
        : 'REWARD: SCRAP'
    drawText(ctx, reward, x + 8, 112, PAL.amber)
    wrapText(ch.brief[ch.brief.length - 1] ?? '', w - 16).slice(0, 2).forEach((line, i) => {
      drawText(ctx, line, x + 8, 124 + i * 10, PAL.gray4)
    })
    drawText(ctx, 'Z:OPEN  X:CLOSE', x + 8, 148, PAL.gray2)
  }
}
