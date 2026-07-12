import type { Engine, Scene } from '../../engine/engine.ts'
import { VIEW_W, VIEW_H } from '../../engine/engine.ts'
import { K } from '../../engine/input.ts'
import { drawTextCentered, drawText } from '../../ui/text.ts'
import { PAL } from '../../art/palette.ts'
import { drawArt, BAG_ICON } from '../../art/sprites.ts'
import { hasSave, loadGame } from '../../engine/save.ts'
import { IS_DEMO } from '../data/maps.ts'
import { newGame } from '../state.ts'
import { OverworldScene } from './overworld.ts'

export class TitleScene implements Scene {
  private cursor = 0
  private options: string[] = []

  private cleared = false

  constructor(private eng: Engine) {
    this.options = hasSave() ? ['CONTINUE', 'NEW GAME'] : ['NEW GAME']
    // Show a CLEARED badge once the player has finished the whole complex.
    this.cleared = !!loadGame()?.flags['game-cleared']
  }

  update(): void {
    const inp = this.eng.input
    if (inp.wasPressed(...K.up)) {
      this.cursor = (this.cursor + this.options.length - 1) % this.options.length
      this.eng.audio.cursor()
    }
    if (inp.wasPressed(...K.down)) {
      this.cursor = (this.cursor + 1) % this.options.length
      this.eng.audio.cursor()
    }
    if (inp.wasPressed(...K.ok)) {
      this.eng.audio.confirm()
      const choice = this.options[this.cursor]
      const gs = choice === 'CONTINUE' ? (loadGame() ?? newGame()) : newGame()
      this.eng.transition(() => this.eng.replace(new OverworldScene(this.eng, gs)))
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // fluorescent flicker: rare, subtle dips — the game's only "music" is light
    const flick = Math.random() < 0.02 ? 0.75 : 1
    ctx.globalAlpha = flick

    drawArt(ctx, BAG_ICON, VIEW_W / 2 - 24, 22, false, 3)

    drawTextCentered(ctx, 'THE', VIEW_W / 2, 78, PAL.gray4, 1)
    drawTextCentered(ctx, 'GARBAGE COLLECTOR', VIEW_W / 2, 88, PAL.crt, 2)
    drawTextCentered(ctx, 'no one else is coming to clean this up', VIEW_W / 2, 108, PAL.gray3)

    if (this.cleared) {
      drawTextCentered(ctx, '* COMPLEX 7 CLEAN *', VIEW_W / 2, 118, PAL.amber)
    }

    this.options.forEach((opt, i) => {
      const y = 130 + i * 12
      const sel = i === this.cursor
      if (sel) drawText(ctx, '>', VIEW_W / 2 - 46, y, PAL.amber)
      drawTextCentered(ctx, opt, VIEW_W / 2, y, sel ? PAL.white : PAL.gray3)
    })

    drawText(ctx, 'Z:OK  X:BACK  ARROWS:MOVE', 8, VIEW_H - 12, PAL.gray2)
    drawText(ctx, IS_DEMO ? 'DEMO' : 'v0.2', VIEW_W - 34, VIEW_H - 12, IS_DEMO ? PAL.amber : PAL.gray2)
    ctx.globalAlpha = 1
  }
}
