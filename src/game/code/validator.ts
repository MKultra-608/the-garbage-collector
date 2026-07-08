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

  for (const v of ch.variants ?? []) {
    const [from, to] = v.replace
    const rx = flexibleRegex(from)
    if (!rx.test(code)) {
      checks.push({ label: v.label, pass: false, note: `keep the line containing '${from}' from the starter code` })
      continue
    }
    const res = runCpp(code.replace(rx, to), v.stdin ?? '')
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
    const pass = r.pattern.test(code)
    checks.push({ label: r.label, pass, note: pass ? undefined : r.hint })
  }

  for (const f of ch.forbid ?? []) {
    const pass = !f.pattern.test(code)
    checks.push({ label: f.label, pass, note: pass ? undefined : f.hint })
  }

  return { checks, allPass: checks.length > 0 && checks.every((c) => c.pass), output, error }
}
