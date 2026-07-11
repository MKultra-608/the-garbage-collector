import type { Engine, Scene } from '../../engine/engine.ts'
import { VIEW_W, VIEW_H } from '../../engine/engine.ts'
import { drawText, drawPanel, wrapText, drawTextCentered, textWidth } from '../../ui/text.ts'
import { PAL } from '../../art/palette.ts'
import type { GameState } from '../state.ts'
import type { Challenge } from '../data/challenges.ts'
import { GLOSSARY } from '../data/glossary.ts'
import { ABILITIES } from '../data/abilities.ts'
import { validate, type ValidationResult } from '../code/validator.ts'
import { saveGame } from '../../engine/save.ts'

const KEYWORDS = new Set([
  'int', 'double', 'float', 'bool', 'char', 'string', 'long', 'if', 'else', 'while', 'for',
  'return', 'break', 'continue', 'using', 'namespace', 'void', 'const', 'true', 'false', 'auto',
  'switch', 'case', 'default', 'struct',
])
// The stdio library's functions get the same highlight as main.
const STREAM_WORDS = new Set(['printf', 'scanf', 'gets', 'puts', 'main', 'cout', 'cin', 'endl', 'std', 'flush'])

const MAX_LINES = 40
const MAX_COL = 120
const CODE_TOP = 62
const CODE_LINE_H = 8
const VISIBLE_LINES = 12

/**
 * Full-screen C editor at a wall terminal. Takes over the keyboard via
 * input.rawHandler (modal). Ctrl+Enter compiles & grades; passing awards
 * the challenge's reward exactly once (doneFlag guards re-certification).
 */
export class EditorScene implements Scene {
  private lines: string[]
  private row = 0
  private col = 0
  private scroll = 0
  private mode: 'edit' | 'result' | 'reward' | 'help' | 'solution' = 'edit'
  private result: ValidationResult | null = null
  private rewardMsg: string[] = []
  /** How many hints are currently revealed (0..hints.length). */
  private hintLevel = 0
  /** Which page of the F1 help is showing: solving hints, or the glossary. */
  private helpPage: 'hints' | 'terms' = 'hints'
  /** First visible line of the (scrollable) glossary page. */
  private termScroll = 0

  constructor(
    private eng: Engine,
    private gs: GameState,
    private ch: Challenge,
  ) {
    this.lines = (gs.code[ch.id] ?? ch.starter).replace(/\r\n/g, '\n').split('\n')
    this.hintLevel = Math.min(ch.hints.length, gs.hintsSeen[ch.id] ?? 0)
  }

  onEnter(): void {
    this.eng.input.rawHandler = this.onKey
  }

  onExit(): void {
    this.eng.input.rawHandler = null
    this.gs.code[this.ch.id] = this.text()
  }

  private text(): string {
    return this.lines.join('\n')
  }

  private onKey = (e: KeyboardEvent): boolean => {
    // F1 opens the "how to solve" help from anywhere except the reward screen.
    if (e.key === 'F1') {
      if (this.mode !== 'reward') this.openHelp()
      return true
    }
    // leave browser devtools shortcuts alone
    if (/^F\d+$/.test(e.key) || (e.ctrlKey && e.shiftKey)) return false

    if (this.mode === 'help') {
      this.onHelpKey(e)
      return true
    }
    if (this.mode === 'solution') {
      this.onSolutionKey(e)
      return true
    }

    if (this.mode === 'reward') {
      if (e.key === 'Enter' || e.key.toLowerCase() === 'z' || e.key === 'Escape') {
        this.eng.audio.confirm()
        this.eng.pop() // leave the editor entirely
      }
      return true
    }

    if (this.mode === 'result') {
      if (this.result?.allPass && (e.key === 'Enter' || e.key.toLowerCase() === 'z')) {
        this.applyReward()
      } else if (!this.result?.allPass && e.key.toLowerCase() === 'h') {
        this.openHelp()
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'x' || e.key === 'Backspace') {
        this.eng.audio.cancel()
        this.mode = 'edit'
      }
      return true
    }

    // ---- edit mode ----
    if (e.key === 'Escape') {
      this.eng.audio.cancel()
      this.eng.pop()
      return true
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      this.run()
      return true
    }
    const line = this.lines[this.row]
    switch (e.key) {
      case 'Enter': {
        if (this.lines.length >= MAX_LINES) return true
        const indent = (line.match(/^ */)?.[0] ?? '').slice(0, this.col)
        this.lines.splice(this.row + 1, 0, indent + line.slice(this.col))
        this.lines[this.row] = line.slice(0, this.col)
        this.row++
        this.col = indent.length
        this.eng.audio.key()
        break
      }
      case 'Backspace': {
        if (this.col > 0) {
          this.lines[this.row] = line.slice(0, this.col - 1) + line.slice(this.col)
          this.col--
        } else if (this.row > 0) {
          const prev = this.lines[this.row - 1]
          this.col = prev.length
          this.lines[this.row - 1] = prev + line
          this.lines.splice(this.row, 1)
          this.row--
        }
        this.eng.audio.key()
        break
      }
      case 'Delete': {
        if (this.col < line.length) {
          this.lines[this.row] = line.slice(0, this.col) + line.slice(this.col + 1)
        } else if (this.row < this.lines.length - 1) {
          this.lines[this.row] = line + this.lines[this.row + 1]
          this.lines.splice(this.row + 1, 1)
        }
        break
      }
      case 'Tab':
        if (line.length < MAX_COL - 2) {
          this.lines[this.row] = line.slice(0, this.col) + '  ' + line.slice(this.col)
          this.col += 2
        }
        break
      case 'ArrowLeft':
        if (this.col > 0) this.col--
        else if (this.row > 0) {
          this.row--
          this.col = this.lines[this.row].length
        }
        break
      case 'ArrowRight':
        if (this.col < line.length) this.col++
        else if (this.row < this.lines.length - 1) {
          this.row++
          this.col = 0
        }
        break
      case 'ArrowUp':
        if (this.row > 0) this.row--
        this.col = Math.min(this.col, this.lines[this.row].length)
        break
      case 'ArrowDown':
        if (this.row < this.lines.length - 1) this.row++
        this.col = Math.min(this.col, this.lines[this.row].length)
        break
      case 'Home':
        this.col = 0
        break
      case 'End':
        this.col = line.length
        break
      default: {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && line.length < MAX_COL) {
          this.lines[this.row] = line.slice(0, this.col) + e.key + line.slice(this.col)
          this.col++
          this.eng.audio.key()
        }
      }
    }
    // keep cursor on screen
    if (this.row < this.scroll) this.scroll = this.row
    if (this.row >= this.scroll + VISIBLE_LINES) this.scroll = this.row - VISIBLE_LINES + 1
    return true
  }

  private run(): void {
    this.gs.code[this.ch.id] = this.text()
    this.result = validate(this.ch, this.text())
    this.mode = 'result'
    if (this.result.allPass) this.eng.audio.unlockAbility()
    else this.eng.audio.error()
  }

  private applyReward(): void {
    const r = this.ch.reward
    this.rewardMsg = []
    if (this.gs.flags[this.ch.doneFlag]) {
      this.rewardMsg.push('RE-CERTIFIED. NO NEW REWARD.')
    } else {
      this.gs.flags[this.ch.doneFlag] = true
      if (r.ability && !this.gs.abilities.includes(r.ability)) {
        this.gs.abilities.push(r.ability)
        const ab = ABILITIES[r.ability]
        this.rewardMsg.push(`ABILITY UNLOCKED: ${ab?.name.toUpperCase() ?? r.ability}`)
        if (ab) this.rewardMsg.push(ab.sig)
      }
      if (r.ramBonus) {
        this.gs.player.maxRam += r.ramBonus
        this.gs.player.ram += r.ramBonus
        this.rewardMsg.push(`MAX RAM +${r.ramBonus}`)
      }
      if (r.scrap) {
        this.gs.player.scrap += r.scrap
        this.rewardMsg.push(`SCRAP +${r.scrap}`)
      }
      saveGame(this.gs)
    }
    this.mode = 'reward'
    this.eng.audio.unlockAbility()
  }

  // ------------------------------------------------------- learning helpers

  /** Opens the escalating-hint panel, revealing the first hint if none yet. */
  private openHelp(): void {
    if (this.hintLevel < 1) this.hintLevel = 1
    this.persistHints()
    this.mode = 'help'
    this.eng.audio.confirm()
  }

  private persistHints(): void {
    this.gs.hintsSeen[this.ch.id] = Math.max(this.gs.hintsSeen[this.ch.id] ?? 0, this.hintLevel)
    saveGame(this.gs)
  }

  private onHelpKey(e: KeyboardEvent): void {
    const k = e.key.toLowerCase()
    if (e.key === 'Escape' || k === 'x') {
      this.eng.audio.cancel()
      this.mode = 'edit'
      return
    }
    // Left/Right (or G) flips between the hints and the glossary.
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || k === 'g') {
      this.helpPage = this.helpPage === 'hints' ? 'terms' : 'hints'
      this.termScroll = 0
      this.eng.audio.blip()
      return
    }
    if (this.helpPage === 'terms') {
      const lines = this.termLines()
      const visible = this.termVisibleLines()
      if (e.key === 'ArrowDown') {
        this.termScroll = Math.min(Math.max(0, lines.length - visible), this.termScroll + 1)
        this.eng.audio.key()
      } else if (e.key === 'ArrowUp') {
        this.termScroll = Math.max(0, this.termScroll - 1)
        this.eng.audio.key()
      }
      return
    }
    if (e.key === 'Enter' || k === 'z') {
      if (this.hintLevel < this.ch.hints.length) {
        this.hintLevel++
        this.persistHints()
        this.eng.audio.blip()
      } else {
        // All hints shown -> offer the full worked solution.
        this.mode = 'solution'
        this.eng.audio.confirm()
      }
    }
  }

  /** The glossary page, flattened to colored lines for scrolling. */
  private termLines(): { text: string; color: string }[] {
    const w = VIEW_W - 28
    const lines: { text: string; color: string }[] = []
    for (const key of this.ch.terms) {
      const term = GLOSSARY[key]
      if (!term) continue
      lines.push({ text: term.t, color: PAL.crt })
      for (const l of wrapText(term.d, w - 24)) lines.push({ text: '  ' + l, color: PAL.gray4 })
      lines.push({ text: '', color: PAL.gray4 })
    }
    return lines
  }

  private termVisibleLines(): number {
    return Math.floor((VIEW_H - 30 - 52) / 9) - 1
  }

  private onSolutionKey(e: KeyboardEvent): void {
    const k = e.key.toLowerCase()
    if (e.key === 'Escape' || k === 'x') {
      this.eng.audio.cancel()
      this.mode = 'help'
      return
    }
    if (k === 'l') {
      // Load the worked solution into the editor to study and run it.
      this.lines = this.ch.solution.replace(/\r\n/g, '\n').split('\n')
      this.row = Math.min(this.row, this.lines.length - 1)
      this.col = 0
      this.scroll = 0
      this.gs.code[this.ch.id] = this.text()
      this.gs.flags[`sol-${this.ch.id}`] = true // analytics: solution was consulted
      saveGame(this.gs)
      this.eng.audio.key()
      this.mode = 'edit'
    }
  }

  update(): void {
    /* all interaction happens in onKey; nothing ticks */
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PAL.black
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)

    // brief panel
    drawPanel(ctx, 2, 2, VIEW_W - 4, 56, { border: PAL.crtDim })
    drawText(ctx, this.ch.title, 8, 7, PAL.crt)
    if (this.gs.flags[this.ch.doneFlag]) {
      drawText(ctx, '[CERTIFIED]', VIEW_W - 78, 7, PAL.crt)
    } else {
      const label = `TEACHES: ${this.ch.teaches}`
      drawText(ctx, label, VIEW_W - 8 - textWidth(label), 7, PAL.crtDim)
    }
    // The TASK paragraph must never be pushed off the 5-line panel (rule 7:
    // nobody gets stuck). If the brief is long, drop teaching lines from the
    // top and keep the tail, which by convention holds the TASK.
    const briefLines: string[] = []
    for (const para of this.ch.brief) briefLines.push(...wrapText(para, VIEW_W - 20))
    const taskIdx = briefLines.findIndex((l) => l.startsWith('TASK:'))
    let shown = briefLines
    if (briefLines.length > 5 && taskIdx >= 0) {
      const task = briefLines.slice(taskIdx)
      shown = [...briefLines.slice(0, Math.max(0, 5 - task.length)), ...task]
    }
    let amber = false
    shown.slice(0, 5).forEach((line, i) => {
      if (line.startsWith('TASK:')) amber = true
      drawText(ctx, line, 8, 17 + i * 8, amber ? PAL.amber : PAL.gray4)
    })

    // code area
    const xoff = Math.max(0, this.col - 44) * 6
    for (let i = 0; i < VISIBLE_LINES; i++) {
      const li = this.scroll + i
      if (li >= this.lines.length) break
      const y = CODE_TOP + i * CODE_LINE_H
      drawText(ctx, String(li + 1).padStart(2, ' '), 4, y, PAL.gray2)
      this.drawCodeLine(ctx, this.lines[li], 22 - xoff, y)
    }
    // cursor
    if (this.mode === 'edit' && Math.floor(this.eng.time * 2.5) % 2 === 0) {
      const cy = CODE_TOP + (this.row - this.scroll) * CODE_LINE_H
      ctx.fillStyle = PAL.crt
      ctx.fillRect(22 - xoff + this.col * 6, cy, 5, 7)
      const chUnder = this.lines[this.row][this.col]
      if (chUnder) drawText(ctx, chUnder, 22 - xoff + this.col * 6, cy, PAL.black)
    }

    // bottom bar
    ctx.fillStyle = PAL.dark
    ctx.fillRect(0, VIEW_H - 12, VIEW_W, 12)
    drawText(ctx, 'CTRL+ENTER: RUN   F1: HELP/GLOSSARY   ESC: LEAVE', 6, VIEW_H - 10, PAL.gray3)
    drawText(ctx, `${this.row + 1}:${this.col + 1}`, VIEW_W - 40, VIEW_H - 10, PAL.gray2)

    if (this.mode === 'result' && this.result) this.drawResult(ctx)
    if (this.mode === 'reward') this.drawReward(ctx)
    if (this.mode === 'help') this.drawHelp(ctx)
    if (this.mode === 'solution') this.drawSolution(ctx)
  }

  private drawCodeLine(ctx: CanvasRenderingContext2D, line: string, x: number, y: number): void {
    // tiny tokenizer for display only: strings, comments, numbers, keywords
    let i = 0
    let cx = x
    const put = (s: string, color: string) => {
      drawText(ctx, s, cx, y, color)
      cx += s.length * 6
    }
    if (line.trimStart().startsWith('#')) {
      put(line, PAL.gray3)
      return
    }
    while (i < line.length) {
      const c = line[i]
      if (c === '/' && line[i + 1] === '/') {
        put(line.slice(i), PAL.gray3)
        break
      }
      if (c === '"') {
        let j = i + 1
        while (j < line.length && line[j] !== '"') j += line[j] === '\\' ? 2 : 1
        put(line.slice(i, j + 1), PAL.amber)
        i = j + 1
        continue
      }
      if (/[A-Za-z_]/.test(c)) {
        let j = i
        while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j++
        const word = line.slice(i, j)
        put(word, KEYWORDS.has(word) ? PAL.cyan : STREAM_WORDS.has(word) ? PAL.crt : PAL.white)
        i = j
        continue
      }
      if (/[0-9]/.test(c)) {
        let j = i
        while (j < line.length && /[0-9.]/.test(line[j])) j++
        put(line.slice(i, j), PAL.crt)
        i = j
        continue
      }
      put(c, PAL.gray4)
      i++
    }
  }

  private drawResult(ctx: CanvasRenderingContext2D): void {
    const res = this.result!
    const h = 100
    const y = 46
    drawPanel(ctx, 20, y, VIEW_W - 40, h, { border: res.allPass ? PAL.crt : PAL.red })
    drawText(ctx, res.allPass ? 'ALL CHECKS PASSED' : 'NOT YET — READ THE CHECKS', 28, y + 6, res.allPass ? PAL.crt : PAL.red)
    let ly = y + 18
    for (const c of res.checks.slice(0, 5)) {
      drawText(ctx, `${c.pass ? '+' : 'x'} ${c.label}`, 28, ly, c.pass ? PAL.crt : PAL.red)
      ly += 9
      if (!c.pass && c.note) {
        for (const line of wrapText(c.note, VIEW_W - 96).slice(0, 2)) {
          drawText(ctx, line, 40, ly, PAL.gray4)
          ly += 9
        }
      }
    }
    const out = res.error ? `error: ${res.error}` : `output: ${res.output.replace(/\n/g, ' / ') || '(nothing)'}`
    wrapText(out, VIEW_W - 56).slice(0, 2).forEach((line, i) => {
      drawText(ctx, line, 28, y + h - 24 + i * 9, PAL.gray3)
    })
    if (res.allPass) {
      drawText(ctx, 'Z: CLAIM CERTIFICATION', 28, y + h - 4, PAL.amber)
    } else {
      drawText(ctx, 'X: BACK TO CODE', 28, y + h - 4, PAL.amber)
      drawText(ctx, 'H: HINTS', VIEW_W - 20 - textWidth('H: HINTS'), y + h - 4, PAL.crt)
    }
  }

  private drawReward(ctx: CanvasRenderingContext2D): void {
    drawPanel(ctx, 40, 60, VIEW_W - 80, 60, { border: PAL.crt })
    drawTextCentered(ctx, 'CERTIFIED', VIEW_W / 2, 68, PAL.crt, 2)
    this.rewardMsg.slice(0, 2).forEach((m, i) => {
      drawTextCentered(ctx, m, VIEW_W / 2, 88 + i * 10, i === 0 ? PAL.white : PAL.cyan)
    })
    drawTextCentered(ctx, 'Z: BACK TO WORK', VIEW_W / 2, 110, PAL.gray3)
  }

  private drawHelp(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(13,13,16,0.82)'
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
    const x = 14
    const w = VIEW_W - 28
    drawPanel(ctx, x, 12, w, VIEW_H - 30, { border: PAL.crt })
    // page tabs
    const onTerms = this.helpPage === 'terms'
    drawText(ctx, 'HINTS', x + 8, 18, onTerms ? PAL.gray2 : PAL.crt)
    drawText(ctx, '<->', x + 8 + textWidth('HINTS') + 6, 18, PAL.gray3)
    drawText(ctx, 'GLOSSARY', x + 8 + textWidth('HINTS <-> '), 18, onTerms ? PAL.crt : PAL.gray2)
    drawText(ctx, this.ch.title, x + 8, 28, PAL.white)
    drawText(ctx, `TEACHES: ${this.ch.teaches}`, x + 8, 38, PAL.crtDim)

    if (onTerms) {
      // every word/command in this challenge: what it does + why it is named that
      const lines = this.termLines()
      const visible = this.termVisibleLines()
      let y = 52
      for (const line of lines.slice(this.termScroll, this.termScroll + visible)) {
        drawText(ctx, line.text, x + 8, y, line.color)
        y += 9
      }
      const hasMore = this.termScroll + visible < lines.length
      const canUp = this.termScroll > 0
      const scrollHint = canUp && hasMore ? 'UP/DOWN: SCROLL' : hasMore ? 'DOWN: MORE' : canUp ? 'UP: BACK' : ''
      drawText(ctx, `${scrollHint}${scrollHint ? '    ' : ''}<-/->: HINTS    X: BACK TO CODE`, x + 8, VIEW_H - 24, PAL.amber)
      return
    }

    let y = 52
    for (let i = 0; i < this.hintLevel; i++) {
      drawText(ctx, `HINT ${i + 1}`, x + 8, y, PAL.amber)
      y += 10
      for (const line of wrapText(this.ch.hints[i], w - 24)) {
        drawText(ctx, line, x + 14, y, PAL.gray4)
        y += 9
      }
      y += 3
    }

    const more = this.hintLevel < this.ch.hints.length
    const prompt = more
      ? `Z: NEXT HINT (${this.hintLevel}/${this.ch.hints.length})    <-/->: GLOSSARY    X: BACK`
      : 'Z: SEE THE WORKED SOLUTION    <-/->: GLOSSARY    X: BACK'
    drawText(ctx, prompt, x + 8, VIEW_H - 24, PAL.amber)
    if (!more) {
      drawText(ctx, 'You have seen every hint. Try once more before revealing the answer.', x + 8, VIEW_H - 34, PAL.gray3)
    }
  }

  private drawSolution(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(13,13,16,0.9)'
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
    const x = 10
    const w = VIEW_W - 20
    drawPanel(ctx, x, 8, w, VIEW_H - 34, { border: PAL.amber })
    drawText(ctx, 'WORKED SOLUTION', x + 8, 14, PAL.amber)
    drawText(ctx, this.ch.title, x + 8, 24, PAL.gray4)

    const sol = this.ch.solution.replace(/\r\n/g, '\n').split('\n')
    let y = 38
    for (const line of sol) {
      if (y > VIEW_H - 34) break
      this.drawCodeLine(ctx, line, x + 10, y)
      y += CODE_LINE_H
    }
    drawText(ctx, 'Read it, then rebuild it yourself — that is where the learning sticks.', x + 8, VIEW_H - 24, PAL.gray3)
    drawText(ctx, 'L: LOAD INTO EDITOR    X: BACK TO HINTS', x + 8, VIEW_H - 14, PAL.amber)
  }
}
