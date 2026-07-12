import type { Engine, Scene } from '../../engine/engine.ts'
import { VIEW_W, VIEW_H } from '../../engine/engine.ts'
import { K } from '../../engine/input.ts'
import { drawText, drawPanel, wrapText } from '../../ui/text.ts'
import { PAL } from '../../art/palette.ts'
import { drawArt } from '../../art/sprites.ts'
import type { GameState } from '../state.ts'
import { grantXp } from '../state.ts'
import { ENEMIES, type EnemyMove, type EnemySpec } from '../data/enemies.ts'
import { ABILITIES, type Ability } from '../data/abilities.ts'
import { FLOORS } from '../data/maps.ts'
import { saveGame } from '../../engine/save.ts'

function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

/** Rising, fading damage/heal number over the target it applies to. */
interface Floater {
  x: number
  y: number
  text: string
  color: string
  life: number
  scale: number
}

type MenuEntry = { ab: Ability } | { flee: true }

/**
 * Turn-based battle, EarthBound-style first person: the enemy fills the
 * screen, Wes is the hands holding the mop. Player turn -> enemy turn.
 * RAM regenerates +1 each round so ability use stays rhythmic.
 */
export class BattleScene implements Scene {
  private enemy: { hp: number; atkBonus: number; guard: boolean }
  private spec: EnemySpec
  private atkStack = 0
  private playerGuard = false
  private cursor = 0
  private phase: 'msg' | 'menu' | 'done' = 'msg'
  private msgs: string[] = []
  private shown = 0
  private charTimer = 0
  private afterMsgs: (() => void) | null = null
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private enemyFlash = 0
  private playerFlash = 0
  private bob = 0
  private enemyMoveCount = 0

  constructor(
    private eng: Engine,
    private gs: GameState,
    enemyId: string,
    private doneFlag?: string,
  ) {
    this.spec = ENEMIES[enemyId]
    this.enemy = { hp: this.spec.hp, atkBonus: 0, guard: false }
    const opener =
      this.spec.boss && this.spec.intro ? this.spec.intro : `A ${this.spec.name} lurches from the pile!`
    this.say([opener], () => this.toMenu())
  }

  private say(msgs: string[], after: (() => void) | null): void {
    this.msgs = msgs.flatMap((m) => {
      const lines = wrapText(m, VIEW_W - 32)
      const pages: string[] = []
      for (let i = 0; i < lines.length; i += 2) pages.push(lines.slice(i, i + 2).join('\n'))
      return pages
    })
    this.shown = 0
    this.phase = 'msg'
    this.afterMsgs = after
  }

  private toMenu(): void {
    this.gs.player.ram = Math.min(this.gs.player.maxRam, this.gs.player.ram + 1)
    this.phase = 'menu'
    this.cursor = 0
  }

  private menuEntries(): MenuEntry[] {
    const entries: MenuEntry[] = this.gs.abilities
      .map((id) => ABILITIES[id])
      .filter((ab): ab is Ability => !!ab)
      .map((ab) => ({ ab }))
    entries.push({ ab: ABILITIES.scan })
    if (!this.spec.boss) entries.push({ flee: true }) // no fleeing a boss
    return entries
  }

  private choose(entry: MenuEntry): void {
    const p = this.gs.player
    if ('flee' in entry) {
      if (Math.random() < 0.6) {
        this.say(['Wes slips away between the desks...'], () => this.end(false))
      } else {
        this.say(["Couldn't get away!"], () => this.enemyTurn())
      }
      return
    }
    const ab = entry.ab
    if (ab.cost > p.ram) {
      this.eng.audio.error()
      this.say(['Not enough RAM. It regenerates each round.'], () => this.toMenu())
      return
    }
    p.ram -= ab.cost
    switch (ab.kind) {
      case 'attack': {
        const hitCount = ab.hits ? rand(ab.hits[0], ab.hits[1]) : 1
        let total = 0
        let guarded = false
        for (let h = 0; h < hitCount; h++) {
          let dmg = rand(ab.power![0], ab.power![1]) + p.atk + this.atkStack
          if (this.enemy.guard) {
            dmg = Math.ceil(dmg / 2)
            this.enemy.guard = false
            guarded = true
          }
          total += dmg
        }
        const weak = !!this.spec.weakTo && this.spec.weakTo === ab.id
        if (weak) total = Math.round(total * 1.5)
        this.enemy.hp = Math.max(0, this.enemy.hp - total)
        this.eng.audio.hit()
        this.eng.shake = weak ? 5 : 3
        this.enemyFlash = 0.25
        this.burst(160, 55, ab.color, weak ? 22 : 14)
        this.floaters.push({ x: VIEW_W / 2 - 6, y: 44, text: `-${total}`, color: weak ? PAL.amber : PAL.white, life: 0.9, scale: weak ? 2 : 1 })
        const msgs = [`Wes uses ${ab.name}!`]
        if (hitCount > 1) {
          const word = ab.hitWord ?? 'hit'
          msgs.push(`${hitCount} ${word}s for ${total} total damage!`)
        } else {
          msgs.push(guarded ? `It braced — only ${total} damage.` : `${total} damage!`)
        }
        if (weak) msgs.push(`Exactly the right tool for the job — it can't defend! (super effective)`)
        this.say(msgs, () => (this.enemy.hp <= 0 ? this.win() : this.enemyTurn()))
        break
      }
      case 'buff': {
        this.atkStack = Math.min(3, this.atkStack + 1)
        this.eng.audio.confirm()
        this.say([`Wes mutters "atk++". ATK is now +${this.atkStack} this fight.`], () => this.enemyTurn())
        break
      }
      case 'guard': {
        this.playerGuard = true
        this.eng.audio.confirm()
        this.say(['Wes braces behind a conditional. The next hit will be halved.'], () => this.enemyTurn())
        break
      }
      case 'scan': {
        this.eng.audio.blip()
        const msgs = [this.spec.scan]
        if (this.spec.weakHint) msgs.push(this.spec.weakHint)
        this.say(msgs, () => this.enemyTurn())
        break
      }
    }
  }

  private enemyTurn(): void {
    let move: EnemyMove
    if (this.spec.script && this.spec.script.length > 0) {
      // Bosses telegraph a fixed rotation — readable, like tracing a switch.
      const idx = this.spec.script[this.enemyMoveCount % this.spec.script.length]
      move = this.spec.moves[idx] ?? this.spec.moves[0]
    } else {
      const total = this.spec.moves.reduce((s, m) => s + m.weight, 0)
      let roll = Math.random() * total
      move = this.spec.moves[0]
      for (const m of this.spec.moves) {
        roll -= m.weight
        if (roll <= 0) {
          move = m
          break
        }
      }
    }
    this.enemyMoveCount++
    const msgs = [move.msg]
    let after: () => void = () => this.toMenu()
    if (move.dmg) {
      let dmg = rand(move.dmg[0], move.dmg[1]) + this.enemy.atkBonus
      if (this.playerGuard) {
        dmg = Math.ceil(dmg / 2)
        this.playerGuard = false
        msgs.push(`The branch guard held! Only ${dmg} damage.`)
      } else {
        msgs.push(`Wes takes ${dmg} damage.`)
      }
      this.gs.player.hp = Math.max(0, this.gs.player.hp - dmg)
      this.eng.audio.hurt()
      this.eng.shake = 4
      this.playerFlash = 0.3
      this.burst(VIEW_W / 2, VIEW_H - 60, PAL.red, 10)
      this.floaters.push({ x: VIEW_W - 96, y: 96, text: `-${dmg}`, color: PAL.red, life: 0.9, scale: 1 })
      if (this.gs.player.hp <= 0) after = () => this.lose()
    } else if (move.self === 'atk+') {
      this.enemy.atkBonus++
    } else if (move.self === 'guard') {
      this.enemy.guard = true
    }
    this.say(msgs, after)
  }

  private win(): void {
    this.eng.audio.win()
    const msgs = this.spec.boss
      ? [this.spec.defeat ?? `${this.spec.name} shudders, comes apart, and is finally still.`]
      : [`The ${this.spec.name} collapses into ordinary, well-behaved trash.`]
    msgs.push(...grantXp(this.gs, this.spec.xp))
    this.gs.player.scrap += this.spec.scrap
    msgs.push(`Collected ${this.spec.scrap} scrap.`)
    if (this.doneFlag) this.gs.flags[this.doneFlag] = true
    saveGame(this.gs)
    this.say(msgs, () => this.end(true))
  }

  private lose(): void {
    const msgs = [
      'Wes blacks out...',
      '...and comes to beside the service elevator. Someone left a fresh mask on the floor.',
    ]
    this.gs.player.hp = this.gs.player.maxHp
    this.gs.player.ram = this.gs.player.maxRam
    // Respawn at the current floor's entry point (not always the closet).
    const floor = FLOORS.find((f) => f.id === this.gs.map)
    if (floor) {
      this.gs.tx = floor.spawn.x
      this.gs.ty = floor.spawn.y
      this.gs.facing = floor.spawn.facing
    }
    saveGame(this.gs)
    this.say(msgs, () => this.end(false))
  }

  private end(_won: boolean): void {
    this.phase = 'done'
    this.eng.transition(() => this.eng.pop())
  }

  private burst(x: number, y: number, color: string, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 20 + Math.random() * 50
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: 0.5, color })
    }
  }

  update(dt: number): void {
    this.bob = Math.sin(this.eng.time * 2) * 2
    this.enemyFlash = Math.max(0, this.enemyFlash - dt)
    this.playerFlash = Math.max(0, this.playerFlash - dt)
    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 80 * dt
      p.life -= dt
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 22 * dt // rise
      f.life -= dt
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)

    const inp = this.eng.input
    if (this.phase === 'msg') {
      const total = this.currentMsg().length
      if (this.shown < total) {
        this.charTimer += dt * 70
        while (this.charTimer >= 1 && this.shown < total) {
          this.charTimer -= 1
          this.shown++
        }
        if (inp.wasPressed(...K.ok)) this.shown = total
      } else if (inp.wasPressed(...K.ok)) {
        this.eng.audio.blip()
        this.msgs.shift()
        this.shown = 0
        if (this.msgs.length === 0) {
          const cb = this.afterMsgs
          this.afterMsgs = null
          cb?.()
        }
      }
      return
    }
    if (this.phase === 'menu') {
      const entries = this.menuEntries()
      if (inp.wasPressed(...K.up)) {
        this.cursor = (this.cursor + entries.length - 1) % entries.length
        this.eng.audio.cursor()
      }
      if (inp.wasPressed(...K.down)) {
        this.cursor = (this.cursor + 1) % entries.length
        this.eng.audio.cursor()
      }
      if (inp.wasPressed(...K.ok)) this.choose(entries[this.cursor])
    }
  }

  private currentMsg(): string {
    return this.msgs[0] ?? ''
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // arena: dark office at night, single cone of fluorescent light on the enemy
    ctx.fillStyle = PAL.black
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
    // red vignette pulse when Wes takes a hit
    if (this.playerFlash > 0) {
      ctx.globalAlpha = Math.min(0.4, this.playerFlash)
      ctx.fillStyle = PAL.red
      ctx.fillRect(0, 0, VIEW_W, 4)
      ctx.fillRect(0, VIEW_H - 4, VIEW_W, 4)
      ctx.fillRect(0, 0, 4, VIEW_H)
      ctx.fillRect(VIEW_W - 4, 0, 4, VIEW_H)
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = PAL.dark
    ctx.fillRect(0, 96, VIEW_W, VIEW_H - 96)
    ctx.fillStyle = PAL.gray1
    ctx.fillRect(96, 88, 128, 8) // lit floor strip under the enemy

    // enemy
    const ex = VIEW_W / 2 - 36
    const ey = 16 + this.bob
    if (this.enemyFlash <= 0 || Math.floor(this.eng.time * 30) % 2 === 0) {
      drawArt(ctx, this.spec.sprite, ex, ey, false, 3)
    }
    ctx.fillStyle = 'rgba(13,13,16,0.55)'
    ctx.fillRect(ex + 8, 92, 56, 4) // shadow

    for (const p of this.particles) {
      ctx.fillStyle = p.color
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2)
    }
    // rising damage numbers
    for (const f of this.floaters) {
      const a = Math.min(1, f.life * 2)
      ctx.globalAlpha = a
      drawText(ctx, f.text, Math.round(f.x), Math.round(f.y), f.color, f.scale)
      ctx.globalAlpha = 1
    }

    // enemy panel
    drawPanel(ctx, 8, 8, 118, 30)
    drawText(ctx, this.spec.name, 14, 14, PAL.white)
    this.bar(ctx, 14, 26, 104, this.enemy.hp / this.spec.hp, PAL.red)
    if (this.enemy.guard) drawText(ctx, 'BRACED', 90, 14, PAL.amber)

    // player panel
    const p = this.gs.player
    drawPanel(ctx, VIEW_W - 126, 96, 118, 40)
    drawText(ctx, `WES  LV${p.lvl}`, VIEW_W - 120, 102, PAL.white)
    if (this.atkStack > 0) drawText(ctx, `ATK+${this.atkStack}`, VIEW_W - 52, 102, PAL.crt)
    drawText(ctx, `HP ${String(p.hp).padStart(2, ' ')}`, VIEW_W - 120, 112, PAL.gray4)
    this.bar(ctx, VIEW_W - 84, 114, 70, p.hp / p.maxHp, PAL.crt)
    drawText(ctx, `RAM ${p.ram}`, VIEW_W - 120, 124, PAL.gray4)
    this.bar(ctx, VIEW_W - 84, 126, 70, p.ram / p.maxRam, PAL.cyan)
    if (this.playerGuard) drawText(ctx, 'GUARD', VIEW_W - 52, 124, PAL.amber)

    // bottom zone: menu or message
    if (this.phase === 'menu') {
      const entries = this.menuEntries()
      drawPanel(ctx, 8, 138, 168, 38)
      entries.forEach((e, i) => {
        const col = Math.floor(i / 3)
        const rowI = i % 3
        const x = 14 + col * 84
        const y = 144 + rowI * 10
        const sel = i === this.cursor
        const label = 'flee' in e ? 'FLEE' : e.ab.name
        const cost = 'flee' in e ? '' : e.ab.cost > 0 ? String(e.ab.cost) : ''
        if (sel) drawText(ctx, '>', x - 6, y, PAL.amber)
        const affordable = 'flee' in e || e.ab.cost <= p.ram
        drawText(ctx, label, x, y, sel ? PAL.white : affordable ? PAL.gray3 : PAL.gray2)
        if (cost) drawText(ctx, cost, x + 66, y, affordable ? PAL.cyan : PAL.red)
      })
      const sel = entries[this.cursor]
      if (!('flee' in sel)) {
        drawText(ctx, sel.ab.sig, 182, 144, sel.ab.color)
        wrapText(sel.ab.desc, 130).slice(0, 2).forEach((line, i) => {
          drawText(ctx, line, 182, 154 + i * 9, PAL.gray3)
        })
      }
    } else if (this.phase === 'msg') {
      drawPanel(ctx, 8, 138, VIEW_W - 16, 38)
      const lines = this.currentMsg().split('\n')
      let remaining = this.shown
      lines.forEach((line, i) => {
        const take = Math.max(0, Math.min(line.length, remaining))
        remaining -= line.length + 1
        drawText(ctx, line.slice(0, take), 16, 146 + i * 10, PAL.white)
      })
      if (this.shown >= this.currentMsg().length && Math.floor(this.eng.time * 2) % 2 === 0) {
        drawText(ctx, 'v', VIEW_W - 22, 166, PAL.crt)
      }
    }
  }

  private bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, frac: number, color: string): void {
    ctx.fillStyle = PAL.gray1
    ctx.fillRect(x, y, w, 4)
    ctx.fillStyle = color
    ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, frac))), 4)
    ctx.strokeStyle = PAL.black
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 3)
  }
}
