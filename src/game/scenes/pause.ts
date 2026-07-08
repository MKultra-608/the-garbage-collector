import type { Engine, Scene } from '../../engine/engine.ts'
import { VIEW_W } from '../../engine/engine.ts'
import { K } from '../../engine/input.ts'
import { drawText, drawPanel, wrapText } from '../../ui/text.ts'
import { PAL } from '../../art/palette.ts'
import type { GameState } from '../state.ts'
import { xpForLevel } from '../state.ts'
import { ABILITIES } from '../data/abilities.ts'
import { saveGame } from '../../engine/save.ts'
import { TitleScene } from './title.ts'

/** The janitor's kit: stats, abilities (with their C++ signatures), save. */
export class PauseScene implements Scene {
  readonly transparent = true
  private cursor = 0
  private tab: 'menu' | 'abilities' = 'menu'
  private abilityCursor = 0
  private toast = ''
  private toastT = 0
  private readonly items = ['RESUME', 'ABILITIES', 'SAVE', 'QUIT TO TITLE']

  constructor(
    private eng: Engine,
    private gs: GameState,
  ) {}

  update(dt: number): void {
    this.toastT = Math.max(0, this.toastT - dt)
    const inp = this.eng.input
    if (this.tab === 'abilities') {
      const n = this.gs.abilities.length
      if (inp.wasPressed(...K.up)) {
        this.abilityCursor = (this.abilityCursor + n - 1) % n
        this.eng.audio.cursor()
      }
      if (inp.wasPressed(...K.down)) {
        this.abilityCursor = (this.abilityCursor + 1) % n
        this.eng.audio.cursor()
      }
      if (inp.wasPressed(...K.cancel, ...K.ok)) {
        this.tab = 'menu'
        this.eng.audio.cancel()
      }
      return
    }
    if (inp.wasPressed(...K.up)) {
      this.cursor = (this.cursor + this.items.length - 1) % this.items.length
      this.eng.audio.cursor()
    }
    if (inp.wasPressed(...K.down)) {
      this.cursor = (this.cursor + 1) % this.items.length
      this.eng.audio.cursor()
    }
    if (inp.wasPressed(...K.cancel, ...K.menu)) {
      this.eng.audio.cancel()
      this.eng.pop()
      return
    }
    if (inp.wasPressed(...K.ok)) {
      const item = this.items[this.cursor]
      if (item === 'RESUME') {
        this.eng.audio.cancel()
        this.eng.pop()
      } else if (item === 'ABILITIES') {
        this.eng.audio.confirm()
        this.tab = 'abilities'
        this.abilityCursor = 0
      } else if (item === 'SAVE') {
        saveGame(this.gs)
        this.eng.audio.confirm()
        this.toast = 'PROGRESS SAVED'
        this.toastT = 1.4
      } else {
        this.eng.audio.confirm()
        this.eng.transition(() => this.eng.replace(new TitleScene(this.eng)))
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const p = this.gs.player
    // stats panel
    drawPanel(ctx, 8, 8, 120, 92)
    drawText(ctx, 'WES', 16, 16, PAL.white)
    drawText(ctx, `LV ${p.lvl}`, 90, 16, PAL.crt)
    drawText(ctx, `HP   ${p.hp}/${p.maxHp}`, 16, 30, PAL.gray4)
    drawText(ctx, `RAM  ${p.ram}/${p.maxRam}`, 16, 40, PAL.gray4)
    drawText(ctx, `ATK  ${p.atk}`, 16, 50, PAL.gray4)
    drawText(ctx, `XP   ${p.xp}/${xpForLevel(p.lvl)}`, 16, 60, PAL.gray4)
    drawText(ctx, `SCRAP ${p.scrap}`, 16, 70, PAL.amber)
    drawText(ctx, this.gs.map.toUpperCase(), 16, 86, PAL.gray2)

    if (this.tab === 'menu') {
      drawPanel(ctx, VIEW_W - 110, 8, 102, 14 + this.items.length * 12)
      this.items.forEach((item, i) => {
        const sel = i === this.cursor
        if (sel) drawText(ctx, '>', VIEW_W - 102, 16 + i * 12, PAL.amber)
        drawText(ctx, item, VIEW_W - 94, 16 + i * 12, sel ? PAL.white : PAL.gray3)
      })
    } else {
      drawPanel(ctx, 136, 8, 176, 150)
      drawText(ctx, 'ABILITIES', 144, 16, PAL.crt)
      this.gs.abilities.forEach((id, i) => {
        const ab = ABILITIES[id]
        if (!ab) return
        const sel = i === this.abilityCursor
        if (sel) drawText(ctx, '>', 144, 30 + i * 12, PAL.amber)
        drawText(ctx, ab.name, 152, 30 + i * 12, sel ? PAL.white : PAL.gray3)
        drawText(ctx, `${ab.cost} RAM`, 260, 30 + i * 12, PAL.gray2)
      })
      const ab = ABILITIES[this.gs.abilities[this.abilityCursor]]
      if (ab) {
        drawText(ctx, ab.sig, 144, 106, ab.color)
        wrapText(ab.desc, 160).forEach((line, i) => {
          drawText(ctx, line, 144, 120 + i * 10, PAL.gray4)
        })
      }
    }

    if (this.toastT > 0) {
      drawPanel(ctx, VIEW_W / 2 - 50, 160, 100, 14, { border: PAL.crt })
      drawText(ctx, this.toast, VIEW_W / 2 - 42, 163, PAL.crt)
    }
  }
}
