import { runCpp } from './interp.ts'
import type { Challenge } from '../data/challenges.ts'

export interface Check {
  label: string
  pass: boolean
  note?: string
}

export interface ValidationResult {
  checks: Check[]
  allPass: boolean
  /** Output of the primary run, shown to the player. */
  output: string
  error?: string
}

function normalize(s: string): string {
  return s.replace(/\r\n/g, '\n').trimEnd()
}

/**
 * Blanks out // and /* comments (string-literal aware, newlines preserved so
 * error line numbers stay right). Patterns and variant substitutions must not
 * see comment text: a player note quoting the starter line would otherwise
 * soak up the variant's replacement — or satisfy a require — and mis-grade
 * perfectly correct code.
 */
function stripComments(src: string): string {
  let out = ''
  let i = 0
  const n = src.length
  while (i < n) {
    const c = src[i]
    if (c === '"' || c === "'") {
      // copy the whole literal, honoring escapes
      out += c
      i++
      while (i < n && src[i] !== c) {
        out += src[i]
        if (src[i] === '\\' && i + 1 < n) {
          out += src[i + 1]
          i++
        }
        i++
      }
      if (i < n) {
        out += src[i]
        i++
      }
      continue
    }
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      i += 2
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') out += '\n'
        i++
      }
      i += 2
      continue
    }
    out += c
    i++
  }
  return out
}

/**
 * Turns a variant's literal `from` (e.g. "= 3") into a whitespace-tolerant
 * matcher, so a correct answer written "int bags=3" isn't rejected just for
 * spacing. A trailing digit gets a boundary so "= 3" doesn't match "= 30".
 */
function flexibleRegex(from: string): RegExp {
  const esc = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const body = esc.replace(/\s+/g, '\\s*')
  const tail = /[0-9]$/.test(from) ? '(?![0-9])' : ''
  return new RegExp(body + tail)
}

/**
 * Grades a challenge attempt. The philosophy: run the program for real and
 * judge behavior first; use require/forbid patterns only to steer toward
 * the concept being taught (e.g. "must actually use a loop").
 */
export function validate(ch: Challenge, code: string): ValidationResult {
  const checks: Check[] = []
  let output = ''
  let error: string | undefined

  for (const [i, cse] of (ch.expect ?? []).entries()) {
    const res = runCpp(code, cse.stdin ?? '')
    if (i === 0) {
      output = res.output
      error = res.error
    }
    if (res.error) {
      checks.push({ label: cse.label ?? 'program compiles and runs', pass: false, note: res.error })
      continue
    }
    const pass = normalize(res.output) === normalize(cse.output)
    checks.push({
      label: cse.label ?? `output is exactly "${cse.output.replace(/\n/g, '\\n')}"`,
      pass,
      note: pass ? undefined : `got "${normalize(res.output).replace(/\n/g, '\\n')}"`,
    })
  }

  // patterns and substitutions look at code only, never at comment text
  const bare = stripComments(code)

  for (const v of ch.variants ?? []) {
    const [from, to] = v.replace
    const rx = flexibleRegex(from)
    if (!rx.test(bare)) {
      checks.push({ label: v.label, pass: false, note: `keep the line containing '${from}' from the starter code` })
      continue
    }
    const res = runCpp(bare.replace(rx, to), v.stdin ?? '')
    if (res.error) {
      checks.push({ label: v.label, pass: false, note: res.error })
      continue
    }
    const pass = normalize(res.output) === normalize(v.output)
    checks.push({
      label: v.label,
      pass,
      note: pass ? undefined : `got "${normalize(res.output).replace(/\n/g, '\\n')}"`,
    })
  }

  for (const r of ch.require ?? []) {
    const pass = r.pattern.test(bare)
    checks.push({ label: r.label, pass, note: pass ? undefined : r.hint })
  }

  for (const f of ch.forbid ?? []) {
    const pass = !f.pattern.test(bare)
    checks.push({ label: f.label, pass, note: pass ? undefined : f.hint })
  }

  return { checks, allPass: checks.length > 0 && checks.every((c) => c.pass), output, error }
}
