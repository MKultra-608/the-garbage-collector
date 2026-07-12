/**
 * Deep audit of every code challenge — beyond "the solution passes":
 *  1. worked solution passes ALL checks; starter fails.
 *  2. the solution's real output equals each expect case EXACTLY (interpreter
 *     and challenge agree).
 *  3. hardcode-safety: a challenge must be defeatable-proof — either it has
 *     `variants` (source substitution) or >=2 expect cases with DIFFERENT
 *     outputs, so a program that just prints a fixed string can't pass.
 *  4. grader is not over-strict: a whitespace-reformatted solution still passes
 *     (catches accidental exact-format dependence).
 *  5. hand-written ALTERNATIVE correct solutions still pass (catches
 *     false-negative grading on legitimate variety).
 *  6. hand-written CHEAT/WRONG solutions still fail (catches false-positive
 *     grading).
 *
 *   node --experimental-transform-types scripts/audit-puzzles.ts
 */
import { CHALLENGES } from '../src/game/data/challenges.ts'
import { validate } from '../src/game/code/validator.ts'
import { runCpp } from '../src/game/code/interp.ts'

let issues = 0
const fail = (id: string, msg: string) => {
  console.error(`  ISSUE  [${id}] ${msg}`)
  issues++
}

/**
 * Puzzles whose whole lesson is "print this exact text" (hello-world style):
 * there is no logic to hardcode — printing the literal output IS the correct
 * answer — so the hardcode-safety and cheat checks don't apply. Kept as a
 * narrow, explicit allowlist so real logic puzzles are still audited strictly.
 */
const PRINT_LITERAL = new Set(['ch0-hello'])
const norm = (s: string) => s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trimEnd()

// --- alternative CORRECT solutions (must still pass) ------------------------
const ALT: Record<string, string[]> = {
  'ch0-hello': [
    '#include <stdio.h>\nint main(){printf("NIGHT SHIFT\\nMOP READY");return 0;}',
  ],
  'ch0-vars': [
    '#include <stdio.h>\nint main(){int side=5;const int FACES=6;printf("%d\\n%d",side*side*side,FACES*side*side);}',
  ],
  'ch0-ops': [
    '#include <stdio.h>\nint main(){int bags=17;int cart=5;printf("CARTS: %d\\nLEFT: %d",bags/cart,bags%cart);}',
  ],
  'ch1-cin': [
    '#include <stdio.h>\nint main(){int count;scanf("%d",&count);printf("PARCELS: %d",count);}',
  ],
  'ch1-ladder': [
    // reversed style: check hottest first with >=, still an else-if ladder
    '#include <stdio.h>\nint main(){int t;scanf("%d",&t);if(t>30){printf("HOT");}else if(t>15){printf("NORMAL");}else if(t>0){printf("COLD");}else{printf("FROZEN");}}',
  ],
  'ch2-while': [
    '#include <stdio.h>\nint main(){int n;scanf("%d",&n);while(n>=1){printf("%d ",n);n=n-1;}}',
  ],
  'ch2-dowhile': [
    '#include <stdio.h>\nint main(){int n;scanf("%d",&n);do{printf("%d ",n);n--;}while(n>0);}',
  ],
  'ch2-for': [
    '#include <stdio.h>\nint main(){int n;scanf("%d",&n);for(int i=1;i<=n;i=i+1)printf("%d ",i);}',
  ],
  'ch2-accum': [
    // accumulate with a while instead of for
    '#include <stdio.h>\nint main(){int n;scanf("%d",&n);int sum=0;int i=1;while(i<=n){sum+=i;i++;}printf("%d",sum);}',
  ],
  'ch3-array': [
    '#include <stdio.h>\nint main(){int bins[4];for(int i=0;i<4;i++)scanf("%d",&bins[i]);for(int i=3;i>=0;i--)printf("%d ",bins[i]);}',
  ],
  'ch3-func': [
    '#include <stdio.h>\nint average(int a,int b,int c){return (a+b+c)/3;}\nint main(){int x;int y;int z;scanf("%d %d %d",&x,&y,&z);printf("%d",average(x,y,z));}',
  ],
  'ch3-recur': [
    // ternary-free, base case n<2
    '#include <stdio.h>\nint fact(int n){if(n<2)return 1;return n*fact(n-1);}\nint main(){int x;scanf("%d",&x);printf("%d",fact(x));}',
  ],
  'ch3-struct': [
    '#include <stdio.h>\nstruct Badge{char name[30];int id;};\nint main(){struct Badge b;scanf("%s %d",b.name,&b.id);printf("ID %d: %s",b.id,b.name);}',
  ],
}

// --- CHEAT / WRONG solutions (must still FAIL) ------------------------------
// Each keyed by challenge id; a program that fakes the FIRST expect output or
// otherwise dodges the concept. These MUST be rejected.
function cheatFor(chId: string, firstOut: string): string {
  // naive: just printf the literal expected output, no logic
  const esc = firstOut.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
  return `#include <stdio.h>\nint main(){printf("${esc}");return 0;}`
}

for (const ch of CHALLENGES) {
  // 1. solution passes, starter fails
  const solRes = validate(ch, ch.solution)
  if (!solRes.allPass) fail(ch.id, `worked solution REJECTED -> ${solRes.checks.filter((c) => !c.pass).map((c) => c.label).join('; ')}`)
  if (validate(ch, ch.starter).allPass) fail(ch.id, 'starter already passes (nothing to learn)')

  // 2. exact output per expect case
  for (const cse of ch.expect ?? []) {
    const r = runCpp(ch.solution, cse.stdin ?? '')
    if (r.error) fail(ch.id, `solution errors on stdin="${cse.stdin ?? ''}": ${r.error}`)
    else if (norm(r.output) !== norm(cse.output)) fail(ch.id, `output mismatch stdin="${cse.stdin ?? ''}" want="${norm(cse.output)}" got="${norm(r.output)}"`)
  }

  // 3. hardcode-safety (skipped for intentional print-literal intro puzzles)
  if (!PRINT_LITERAL.has(ch.id)) {
    const distinctOutputs = new Set((ch.expect ?? []).map((e) => norm(e.output)))
    const hardcodeSafe = (ch.variants && ch.variants.length > 0) || distinctOutputs.size >= 2
    if (!hardcodeSafe) fail(ch.id, 'HARDCODE RISK: only one behavioral output and no variants — a fixed print could pass')
  }

  // 4. grader not over-strict: reindented solution still passes
  const reindented = ch.solution.split('\n').map((l) => (l.trim() ? '  ' + l : l)).join('\n')
  if (!validate(ch, reindented).allPass) fail(ch.id, 'reformatted (reindented) solution is REJECTED — grader is too format-sensitive')

  // 5. alternative correct solutions pass
  for (const [i, alt] of (ALT[ch.id] ?? []).entries()) {
    const r = validate(ch, alt)
    if (!r.allPass) fail(ch.id, `ALT solution #${i + 1} REJECTED -> ${r.checks.filter((c) => !c.pass).map((c) => `${c.label}${c.note ? ` (${c.note})` : ''}`).join('; ')}`)
  }

  // 6. cheat/hardcode solution fails (only meaningful when there's an expect
  //    output to fake, and not for print-literal intro puzzles)
  if (ch.expect && ch.expect.length && !PRINT_LITERAL.has(ch.id)) {
    const cheat = cheatFor(ch.id, ch.expect[0].output)
    if (validate(ch, cheat).allPass) fail(ch.id, `CHEAT accepted: a program that just prints "${norm(ch.expect[0].output)}" passes`)
  }
}

console.log(`\nAudited ${CHALLENGES.length} puzzles across floors 0-3.`)
if (issues === 0) console.log('ALL PUZZLES CLEAN — no grading bugs found.')
else {
  console.error(`\n${issues} puzzle issue(s) found.`)
  process.exit(1)
}
