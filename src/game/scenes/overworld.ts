import type { Engine, Scene } from '../../engine/engine.ts'
import { VIEW_W, VIEW_H } from '../../engine/engine.ts'
import { K } from '../../engine/input.ts'
import { drawText, drawPanel } from '../../ui/text.ts'
import { PAL } from '../../art/palette.ts'
import { TILES, TILE } from '../../art/tiles.ts'
import { JANITOR, PRAM, COURIER, CLERK, TRASH_PILE, drawArt } from '../../art/sprites.ts'
import type { PixelArt } from '../../art/sprites.ts'
import type { GameState, Facing } from '../state.ts'
import { MAPS, INTRO_LINES, FLOORS, IS_DEMO, type EntityDef, type MapDef } from '../data/maps.ts'
import { ENEMIES } from '../data/enemies.ts'
import { isFloorCleared, tryUnlockNextFloor, nextFloorId } from '../progression.ts'
import { DialogueScene } from './dialogue.ts'
import { PauseScene } from './pause.ts'
import { TerminalScene } from './terminal.ts'
import { BattleScene } from './battle.ts'
import { ElevatorScene } from './elevator.ts'
import { saveGame } from '../../engine/save.ts'

/** NPC sprite by name (all masked; hard art rule). */
const NPC_SPRITE: Record<string, PixelArt> = { PRAM, COURIER, CLERK }

const MOVE_TIME = 0.16 // seconds per tile, Pokemon-ish walk speed

const DIRS: Record<Facing, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}

/**
 * Grid-based overworld: hold a direction to walk tile-to-tile, Z interacts
 * with whatever you face, walking into trash starts a battle. Defeated
 * trash piles are hidden via their flags, so the floor visibly gets cleaner
 * as you play — the core fantasy.
 */
export class OverworldScene implements Scene {
  private map: MapDef
  private moving = false
  private moveT = 0
  private fromX = 0
  private fromY = 0
  private bumpCooldown = 0
  private npcBob = 0

  constructor(
    private eng: Engine,
    private gs: GameState,
  ) {
    this.map = MAPS[gs.map] ?? MAPS.floor0
    // debug hooks for verification and future tooling (documented in CLAUDE.md)
    const w = window as unknown as { __gc?: Record<string, unknown> }
    w.__gc = {
      ...(w.__gc ?? {}),
      state: gs,
      warp: (x: number, y: number) => {
        gs.tx = x
        gs.ty = y
        this.moving = false
      },
    }
  }

  onEnter(): void {
    if (!this.gs.flags['intro-done']) {
      this.gs.flags['intro-done'] = true
      this.eng.push(
        new DialogueScene(this.eng, INTRO_LINES, () => saveGame(this.gs)),
      )
    }
  }

  private tileSolid(x: number, y: number): boolean {
    const row = this.map.grid[y]
    if (!row || x < 0 || x >= row.length) return true
    const t = TILES[row[x]]
    return !t || t.solid
  }

  /** Live entities only (anything with a defeated flag is filtered out). */
  private entities(): EntityDef[] {
    return this.map.entities.filter((e) => !('flag' in e) || !this.gs.flags[e.flag])
  }

  private entityAt(x: number, y: number): EntityDef | undefined {
    return this.entities().find((e) => e.x === x && e.y === y)
  }

  private facingTarget(): [number, number] {
    const [dx, dy] = DIRS[this.gs.facing]
    return [this.gs.tx + dx, this.gs.ty + dy]
  }

  update(dt: number): void {
    this.bumpCooldown = Math.max(0, this.bumpCooldown - dt)
    this.npcBob += dt

    if (this.moving) {
      this.moveT += dt / MOVE_TIME
      if (this.moveT >= 1) {
        this.moving = false
        this.moveT = 0
        this.eng.audio.step()
      }
      return
    }

    // A cleared floor may unlock the next one; announce it once on return.
    if (this.maybeAnnounceProgress()) return

    const inp = this.eng.input
    if (inp.wasPressed(...K.menu)) {
      this.eng.audio.confirm()
      this.eng.push(new PauseScene(this.eng, this.gs))
      return
    }
    if (inp.wasPressed(...K.ok)) {
      this.interact()
      return
    }

    let dir: Facing | null = null
    if (inp.isDown(...K.up)) dir = 'up'
    else if (inp.isDown(...K.down)) dir = 'down'
    else if (inp.isDown(...K.left)) dir = 'left'
    else if (inp.isDown(...K.right)) dir = 'right'
    if (!dir) return

    this.gs.facing = dir
    const [dx, dy] = DIRS[dir]
    const nx = this.gs.tx + dx
    const ny = this.gs.ty + dy
    const ent = this.entityAt(nx, ny)
    if (ent?.kind === 'trash') {
      this.startBattle(ent.enemy, ent.flag)
      return
    }
    if (ent?.kind === 'boss') {
      this.startBoss(ent)
      return
    }
    if (this.tileSolid(nx, ny) || ent?.kind === 'npc') {
      if (this.bumpCooldown <= 0) {
        this.eng.audio.bump()
        this.bumpCooldown = 0.3
      }
      return
    }
    this.fromX = this.gs.tx
    this.fromY = this.gs.ty
    this.gs.tx = nx
    this.gs.ty = ny
    this.moving = true
    this.moveT = 0
  }

  private interact(): void {
    const [fx, fy] = this.facingTarget()
    const ent = this.entityAt(fx, fy)
    if (!ent) return
    switch (ent.kind) {
      case 'sign':
        this.eng.audio.blip()
        this.eng.push(new DialogueScene(this.eng, [{ who: 'NOTICE', text: ent.text }]))
        break
      case 'npc':
        this.eng.audio.blip()
        this.eng.push(
          new DialogueScene(this.eng, ent.lines.map((text) => ({ who: ent.name, text }))),
        )
        break
      case 'terminal':
        this.eng.audio.confirm()
        this.eng.push(new TerminalScene(this.eng, this.gs))
        break
      case 'trash':
        this.startBattle(ent.enemy, ent.flag)
        break
      case 'boss':
        this.startBoss(ent)
        break
      case 'elevator':
        this.eng.audio.confirm()
        this.eng.push(new ElevatorScene(this.eng, this.gs, (floorId) => this.travelTo(floorId)))
        break
    }
  }

  private startBattle(enemy: string, flag?: string): void {
    this.eng.audio.hurt()
    this.eng.shake = 3
    this.eng.transition(() => this.eng.push(new BattleScene(this.eng, this.gs, enemy, flag)), 0.4)
  }

  /** Boss encounter: play the overworld intro, then drop into the battle. */
  private startBoss(ent: EntityDef & { kind: 'boss' }): void {
    this.eng.audio.blip()
    const intro = ent.intro ?? []
    const lines = intro.map((text) => ({ who: 'DOCK', text }))
    this.eng.push(
      new DialogueScene(this.eng, lines, () => {
        this.startBattle(ent.enemy, ent.flag)
      }),
    )
  }

  private travelTo(floorId: string): void {
    const floor = FLOORS.find((f) => f.id === floorId)
    if (!floor) return
    this.eng.transition(() => {
      this.gs.map = floorId
      this.gs.tx = floor.spawn.x
      this.gs.ty = floor.spawn.y
      this.gs.facing = floor.spawn.facing
      saveGame(this.gs)
      this.eng.replace(new OverworldScene(this.eng, this.gs))
    })
  }

  /**
   * If the current floor just got cleared, unlock the next floor (or, on the
   * top built floor, deliver the end-of-content beat) exactly once. Returns
   * true if it opened a dialogue, so update() can yield this frame.
   */
  private maybeAnnounceProgress(): boolean {
    if (!isFloorCleared(this.gs, this.gs.map)) return false
    const unlocked = tryUnlockNextFloor(this.gs, this.gs.map)
    if (unlocked) {
      saveGame(this.gs)
      this.eng.audio.unlockAbility()
      this.eng.push(
        new DialogueScene(this.eng, [
          { who: 'PRAM', text: `*krzzt* Floor's clean. I'm calling the elevator down for you.` },
          { who: 'PRAM', text: `${unlocked.name.trim()} is unlocked. Ride up whenever you're ready. Keep the mask on.` },
        ]),
      )
      return true
    }
    // Cleared, but nothing built above it yet: one-time slice-complete note.
    if (!nextFloorId(this.gs.map) && !this.gs.flags['content-end-msg']) {
      this.gs.flags['content-end-msg'] = true
      saveGame(this.gs)
      this.eng.push(
        new DialogueScene(this.eng, [
          { who: 'PRAM', text: `*krzzt* That's every floor I have keys for tonight. Good work down here, kid. Go get some air.` },
          {
            who: 'NOTICE',
            text: IS_DEMO
              ? 'END OF DEMO — thanks for playing THE GARBAGE COLLECTOR. The full game keeps climbing: the Archives, the cubicles, and whatever is leaking at the top.'
              : 'END OF THE CURRENT BUILD — Floor 3 (the Cubicle Maze, functions) is next. See docs/ROADMAP.md.',
          },
        ]),
      )
      return true
    }
    return false
  }

  // ------------------------------------------------------------- drawing

  private playerPixel(): [number, number] {
    let px = this.gs.tx * TILE
    let py = this.gs.ty * TILE
    if (this.moving) {
      px = (this.fromX + (this.gs.tx - this.fromX) * this.moveT) * TILE
      py = (this.fromY + (this.gs.ty - this.fromY) * this.moveT) * TILE
    }
    return [px, py]
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const [px, py] = this.playerPixel()
    const mapW = this.map.grid[0].length * TILE
    const mapH = this.map.grid.length * TILE
    const camX = Math.round(Math.max(0, Math.min(mapW - VIEW_W, px - VIEW_W / 2 + TILE / 2)))
    const camY = Math.round(Math.max(0, Math.min(mapH - VIEW_H, py - VIEW_H / 2 + TILE / 2)))

    // tiles
    const x0 = Math.floor(camX / TILE)
    const y0 = Math.floor(camY / TILE)
    for (let y = y0; y <= y0 + Math.ceil(VIEW_H / TILE); y++) {
      const row = this.map.grid[y]
      if (!row) continue
      for (let x = x0; x <= x0 + Math.ceil(VIEW_W / TILE); x++) {
        const t = TILES[row[x]]
        if (t) ctx.drawImage(t.canvas, x * TILE - camX, y * TILE - camY)
      }
    }

    // entities + player, y-sorted so sprites overlap correctly
    type Drawable = { y: number; draw: () => void }
    const drawables: Drawable[] = []
    for (const e of this.entities()) {
      if (e.kind === 'trash') {
        drawables.push({ y: e.y, draw: () => drawArt(ctx, TRASH_PILE, e.x * TILE - camX, e.y * TILE - camY) })
      } else if (e.kind === 'boss') {
        // Boss looms: its 24x24 battle sprite, centred over the tile.
        const sprite = ENEMIES[e.enemy]?.sprite
        const bob = Math.floor(this.npcBob * 1.5) % 2
        if (sprite) drawables.push({ y: e.y, draw: () => drawArt(ctx, sprite, e.x * TILE - camX - 4, e.y * TILE - camY - 8 - bob) })
      } else if (e.kind === 'npc') {
        const sprite = NPC_SPRITE[e.name] ?? PRAM
        const bob = Math.floor(this.npcBob * 2) % 2
        drawables.push({ y: e.y, draw: () => drawArt(ctx, sprite, e.x * TILE - camX, e.y * TILE - camY - bob) })
      }
    }
    const frames = this.gs.facing === 'up' ? JANITOR.up : this.gs.facing === 'down' ? JANITOR.down : JANITOR.side
    const frame = this.moving ? frames[Math.floor(this.moveT * 2) % 2] : frames[0]
    const flip = this.gs.facing === 'right'
    drawables.push({
      y: this.moving ? Math.max(this.fromY, this.gs.ty) : this.gs.ty,
      draw: () => drawArt(ctx, frame, px - camX, py - camY, flip),
    })
    drawables.sort((a, b) => a.y - b.y)
    for (const d of drawables) d.draw()

    // location banner + interact hint
    drawText(ctx, this.map.name, 6, 4, PAL.gray2)
    const [fx, fy] = this.facingTarget()
    const facingEnt = this.entityAt(fx, fy)
    if (facingEnt && !this.moving) {
      const verb =
        facingEnt.kind === 'npc' ? 'TALK'
        : facingEnt.kind === 'terminal' ? 'USE TERMINAL'
        : facingEnt.kind === 'trash' ? 'CLEAN'
        : facingEnt.kind === 'boss' ? 'CONFRONT'
        : facingEnt.kind === 'elevator' ? 'RIDE'
        : 'READ'
      const label = `Z:${verb}`
      drawPanel(ctx, VIEW_W - label.length * 6 - 16, VIEW_H - 16, label.length * 6 + 10, 12, { border: PAL.gray2 })
      drawText(ctx, label, VIEW_W - label.length * 6 - 11, VIEW_H - 13, PAL.amber)
    }
  }
}
