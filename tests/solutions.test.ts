/**
 * End-to-end checks that don't need a browser:
 *  1. Every challenge has a reference solution that the validator fully
 *     accepts (proves challenges are solvable AND the grader is correct).
 *  2. Floor progression unlocks the next floor exactly when a floor is
 *     cleared (all its challenges certified + boss down).
 * Run with:  npm test
 */
import { CHALLENGES } from '../src/game/data/challenges.ts'
import { GLOSSARY } from '../src/game/data/glossary.ts'
import { validate } from '../src/game/code/validator.ts'
import { newGame } from '../src/game/state.ts'
import { isFloorCleared, tryUnlockNextFloor, challengesForFloor } from '../src/game/progression.ts'

let failures = 0
function check(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`ok   ${msg}`)
  } else {
    console.error(`FAIL ${msg}`)
    failures++
  }
}

for (const ch of CHALLENGES) {
  // Learning content must be present so the in-editor help is never empty.
  check(!!ch.teaches, `${ch.id}: has a "teaches" concept label`)
  check(Array.isArray(ch.hints) && ch.hints.length >= 2, `${ch.id}: has at least 2 escalating hints`)
  check(!!ch.solution, `${ch.id}: has a worked solution`)
  // Every word/command must be defined in the glossary (with why it is named that).
  check(Array.isArray(ch.terms) && ch.terms.length >= 3, `${ch.id}: has at least 3 glossary terms`)
  const badKeys = ch.terms.filter((k) => !GLOSSARY[k])
  check(badKeys.length === 0, `${ch.id}: every glossary key exists${badKeys.length ? ` (missing: ${badKeys.join(', ')})` : ''}`)

  // The worked solution shown to the player must actually pass the grader.
  const res = validate(ch, ch.solution)
  if (!res.allPass) {
    const failed = res.checks.filter((c) => !c.pass).map((c) => `${c.label}${c.note ? ` (${c.note})` : ''}`)
    console.error(`FAIL ${ch.id}: worked solution rejected -> ${failed.join('; ')}`)
    failures++
  } else {
    console.log(`ok   ${ch.id}: worked solution certified`)
  }

  // The starter must NOT already pass (otherwise there's nothing to learn).
  if (validate(ch, ch.starter).allPass) {
    console.error(`FAIL ${ch.id}: starter code already passes — the task is trivial`)
    failures++
  }
}

// ---- comments must never affect grading ----
// A player note quoting the starter line used to soak up the variant
// substitution (or satisfy a require) and mis-grade correct code.
for (const ch of CHALLENGES) {
  if (!ch.variants?.length) continue
  const from = ch.variants[0].replace[0]
  const commented = `// note: the line "${from}" matters\n` + ch.solution
  check(validate(ch, commented).allPass, `${ch.id}: solution still passes with a comment quoting '${from}'`)
}

// ---- progression ----
const gs = newGame()
check(!isFloorCleared(gs, 'floor0'), 'fresh floor0 is not cleared')
check(tryUnlockNextFloor(gs, 'floor0') === null, 'nothing unlocks before floor0 is cleared')

for (const ch of challengesForFloor('floor0')) gs.flags[ch.doneFlag] = true
check(isFloorCleared(gs, 'floor0'), 'floor0 clears once all its challenges are certified')
const unlocked = tryUnlockNextFloor(gs, 'floor0')
check(unlocked?.id === 'floor1', 'clearing floor0 unlocks floor1')
check(gs.unlockedFloors.includes('floor1'), 'floor1 is now in unlockedFloors')
check(tryUnlockNextFloor(gs, 'floor0') === null, 'unlocking is idempotent (no double unlock)')

for (const ch of challengesForFloor('floor1')) gs.flags[ch.doneFlag] = true
check(!isFloorCleared(gs, 'floor1'), 'floor1 is NOT cleared while its boss still stands')
gs.flags['f1-boss'] = true
check(isFloorCleared(gs, 'floor1'), 'floor1 clears once challenges done AND boss defeated')
check(tryUnlockNextFloor(gs, 'floor1')?.id === 'floor2', 'clearing floor1 unlocks floor2')

for (const ch of challengesForFloor('floor2')) gs.flags[ch.doneFlag] = true
check(!isFloorCleared(gs, 'floor2'), 'floor2 is NOT cleared while OFF-BY-ONE still stands')
gs.flags['f2-boss'] = true
check(isFloorCleared(gs, 'floor2'), 'floor2 clears once challenges done AND boss defeated')
check(tryUnlockNextFloor(gs, 'floor2')?.id === 'floor3', 'clearing floor2 unlocks floor3')

check(challengesForFloor('floor2').length === 5, 'floor2 carries five challenges (Labs 4-5, incl. do-while)')
check(challengesForFloor('floor3').length === 6, 'floor3 carries six challenges (Labs 6-11, incl. recursion)')
for (const ch of challengesForFloor('floor3')) gs.flags[ch.doneFlag] = true
check(!isFloorCleared(gs, 'floor3'), 'floor3 is NOT cleared while STACK OVERFLOW still stands')
gs.flags['f3-boss'] = true
check(isFloorCleared(gs, 'floor3'), 'floor3 clears once challenges done AND boss defeated')

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nall solution + progression checks passed')
