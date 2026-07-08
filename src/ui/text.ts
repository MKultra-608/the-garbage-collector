import { FONT, FONT_W, FONT_H, FONT_ADV } from './font.ts'

/** Typographic characters the bitmap font lacks, mapped to ASCII stand-ins. */
const ALIAS: Record<string, string> = {
  '—': '-', // em dash
  '–': '-', // en dash
  '’': "'",
  '‘': "'",
  '“': '"',
  '”': '"',
  '…': '.',
}

/** Pre-rendered (char, color, scale) glyphs so text costs one drawImage per char. */
const glyphCache = new Map<string, HTMLCanvasElement>()

function glyph(raw: string, color: string, scale: number): HTMLCanvasElement | null {
  const ch = ALIAS[raw] ?? raw
  const rows = FONT[ch] ?? FONT['?']
  if (!rows) return null
  const key = `${ch}|${color}|${scale}`
  let c = glyphCache.get(key)
  if (c) return c
  c = document.createElement('canvas')
  c.width = FONT_W * scale
  c.height = FONT_H * scale
  const g = c.getContext('2d')!
  g.fillStyle = color
  for (let y = 0; y < FONT_H; y++) {
    const bits = rows[y]
    for (let x = 0; x < FONT_W; x++) {
      if (bits & (1 << (FONT_W - 1 - x))) g.fillRect(x * scale, y * scale, scale, scale)
    }
  }
  glyphCache.set(key, c)
  return c
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = '#e8eaed',
  scale = 1,
): void {
  let cx = Math.round(x)
  const cy = Math.round(y)
  for (const ch of text) {
    if (ch !== ' ') {
      const img = glyph(ch, color, scale)
      if (img) ctx.drawImage(img, cx, cy)
    }
    cx += FONT_ADV * scale
  }
}

export function textWidth(text: string, scale = 1): number {
  return text.length === 0 ? 0 : text.length * FONT_ADV * scale - scale
}

export function drawTextCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  color = '#e8eaed',
  scale = 1,
): void {
  drawText(ctx, text, cx - textWidth(text, scale) / 2, y, color, scale)
}

/** Greedy word wrap by pixel width. Respects explicit \n. */
export function wrapText(text: string, maxWidth: number, scale = 1): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    for (const word of para.split(' ')) {
      const candidate = line ? line + ' ' + word : word
      if (textWidth(candidate, scale) <= maxWidth) {
        line = candidate
      } else {
        if (line) out.push(line)
        line = word
      }
    }
    out.push(line)
  }
  return out
}

/** Standard bordered panel used by every menu/dialog in the game. */
export function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { bg?: string; border?: string } = {},
): void {
  ctx.fillStyle = opts.bg ?? '#1a1c22'
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = opts.border ?? '#9aa0a8'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
  // inner shadow line for depth
  ctx.strokeStyle = '#0d0d10'
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3)
}
