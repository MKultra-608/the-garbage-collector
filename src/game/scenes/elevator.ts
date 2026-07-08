import type { Engine, Scene } from '../../engine/engine.ts'
import { VIEW_W } from '../../engine/engine.ts'
import { K } from '../../engine/input.ts'
import { drawText, drawPanel, drawTextCentered } from '../../ui/text.ts'
import { PAL } from '../../art/palette.ts'
import type { GameState } from '../state.ts'
import { FLOORS } from '../data/maps.ts'
import { challengesForFloor, challengesCertified } from '../progression.ts'

/**
 * Elevator panel: pick a floor to ride to. Unlocked floors are selectable;
 * locked ones show what's left to certify. Travel itself is delegated to the
 * overworld via `onTravel` (keeps this scene free of a map-swap import cycle).
 */
export class ElevatorScene implements Scene {
  readonly transparent = true
  private cursor: number

  constructor(
    private eng: Engine,
    private gs: GameState,
    private onTravel: (floorId: string) => void,
  ) {
    this.cursor = Math.max(0, FLOORS.findIndex((f) => f.id === gs.map))
  }

  private unlocked(floorId: string): boolean {
    return this.gs.unlockedFloors.includes(floorId)
  }

  update(): void {
    const inp = this.eng.input
    const n = FLOORS.length
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
      const floor = FLOORS[this.cursor]
      if (floor.id === this.gs.map) {
        this.eng.audio.cancel()
        this.eng.pop() // already here
      } else if (this.unlocked(floor.id)) {
        this.eng.audio.confirm()
        this.onTravel(floor.id)
      } else {
        this.eng.audio.error()
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const w = 200
    const x = (VIEW_W - w) / 2
    const h = 40 + FLOORS.length * 14
    drawPanel(ctx, x, 26, w, h, { border: PAL.amber })
    drawTextCentered(ctx, 'SERVICE ELEVATOR', VIEW_W / 2, 32, PAL.amber)

    FLOORS.forEach((floor, i) => {
      const y = 48 + i * 14
      const here = floor.id === this.gs.map
      const open = this.unlocked(floor.id)
      const sel = i === this.cursor
      if (sel) drawText(ctx, '>', x + 8, y, PAL.amber)
      const color = here ? PAL.white : open ? PAL.crt : PAL.gray2
      drawText(ctx, floor.name, x + 18, y, color)
      let tag: string
      let tagColor: string
      if (here) {
        tag = '[HERE]'
        tagColor = PAL.white
      } else if (open) {
        tag = 'READY'
        tagColor = PAL.crt
      } else {
        const done = challengesCertified(this.gs, floor.id)
        const total = challengesForFloor(floor.id).length
        tag = `LOCKED ${done}/${total}`
        tagColor = PAL.gray3
      }
      drawText(ctx, tag, x + w - tag.length * 6 - 8, y, tagColor)
    })

    const cur = FLOORS[this.cursor]
    const hint =
      cur.id === this.gs.map
        ? 'You are on this floor.'
        : this.unlocked(cur.id)
          ? 'Z: RIDE TO THIS FLOOR'
          : 'Certify every terminal here to unlock it.'
    drawText(ctx, hint, x + 8, 26 + h - 12, PAL.gray4)
  }
}
