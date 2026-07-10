/**
 * Regression tests for the C++ micro-interpreter. No framework — plain
 * assertions, run with:  npm test
 * (uses Node's TypeScript transform; no build step needed)
 *
 * Add a case here for EVERY new language feature the interpreter learns.
 */
import { runCpp } from '../src/game/code/interp.ts'

let failures = 0

function expectOut(name: string, code: string, expected: string, stdin = ''): void {
  const res = runCpp(code, stdin)
  if (res.error) {
    console.error(`FAIL ${name}: unexpected error: ${res.error}`)
    failures++
  } else if (res.output !== expected) {
    console.error(`FAIL ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(res.output)}`)
    failures++
  } else {
    console.log(`ok   ${name}`)
  }
}

function expectError(name: string, code: string, contains: string): void {
  const res = runCpp(code)
  if (!res.error) {
    console.error(`FAIL ${name}: expected an error containing "${contains}", program ran fine`)
    failures++
  } else if (!res.error.includes(contains)) {
    console.error(`FAIL ${name}: expected error containing "${contains}", got "${res.error}"`)
    failures++
  } else {
    console.log(`ok   ${name}`)
  }
}

const H = '#include <iostream>\nusing namespace std;\n'

expectOut('hello world', H + 'int main() { cout << "MOP READY"; return 0; }', 'MOP READY')

expectOut('std:: prefix works', '#include <iostream>\nint main() { std::cout << "hi" << std::endl; }', 'hi\n')

expectOut('endl newline', H + 'int main() { cout << "a" << endl << "b"; }', 'a\nb')

expectOut('escape sequences', H + 'int main() { cout << "a\\tb\\n"; }', 'a\tb\n')

expectOut('int arithmetic', H + 'int main() { int bags = 3; int mops = 2; cout << bags + mops; }', '5')

expectOut('int division truncates', H + 'int main() { cout << 7 / 2; }', '3')

expectOut('double division', H + 'int main() { cout << 7.0 / 2; }', '3.5')

expectOut('modulo', H + 'int main() { cout << 17 % 5; }', '2')

expectOut('operator precedence', H + 'int main() { cout << 2 + 3 * 4; }', '14')

expectOut('parentheses', H + 'int main() { cout << (2 + 3) * 4; }', '20')

expectOut('string variable', H + '#include <string>\nint main() { string crew = "WES"; cout << "CREW: " << crew; }', 'CREW: WES')

expectOut('string concat', H + 'int main() { string a = "gar"; string b = "bage"; cout << a + b; }', 'garbage')

expectOut('bool prints as 1/0', H + 'int main() { cout << true << false; }', '10')

expectOut('if true branch', H + 'int main() { int c = 2; if (c >= 2) { cout << "ACCESS"; } else { cout << "DENIED"; } }', 'ACCESS')

expectOut('else branch', H + 'int main() { int c = 0; if (c >= 2) { cout << "ACCESS"; } else { cout << "DENIED"; } }', 'DENIED')

expectOut('if without braces', H + 'int main() { int c = 5; if (c > 1) cout << "big"; else cout << "small"; }', 'big')

expectOut('nested if', H + 'int main() { int x = 5; if (x > 0) { if (x > 3) cout << "deep"; } }', 'deep')

expectOut('while loop', H + 'int main() { int i = 0; while (i < 3) { cout << "SWEEP"; i++; } }', 'SWEEPSWEEPSWEEP')

expectOut('for loop', H + 'int main() { for (int i = 1; i <= 3; i++) { cout << i; } }', '123')

expectOut('for with break', H + 'int main() { for (int i = 0; i < 10; i++) { if (i == 3) break; cout << i; } }', '012')

expectOut('while with continue', H + 'int main() { int i = 0; while (i < 5) { i++; if (i == 3) continue; cout << i; } }', '1245')

expectOut('compound assignment', H + 'int main() { int x = 10; x += 5; x -= 3; x *= 2; cout << x; }', '24')

expectOut('prefix and postfix ++', H + 'int main() { int x = 1; ++x; x++; cout << x; }', '3')

expectOut('logical ops', H + 'int main() { int a = 1; int b = 0; if (a && !b) cout << "yes"; if (a || b) cout << "also"; }', 'yesalso')

expectOut('cin reads ints', H + 'int main() { int a; int b; cin >> a >> b; cout << a * b; }', '42', '6 7')

expectOut('cin reads string', H + '#include <string>\nint main() { string name; cin >> name; cout << "HI " << name; }', 'HI WES', 'WES')

expectOut('comments ignored', H + 'int main() {\n// a comment\n/* block\ncomment */\ncout << "clean";\n}', 'clean')

expectOut('scoped shadowing allowed in blocks', H + 'int main() { int x = 1; { int y = 2; cout << x + y; } cout << x; }', '31')

expectOut('return exits early', H + 'int main() { cout << "a"; return 0; cout << "b"; }', 'a')

expectOut(
  'switch matches a case with break',
  H + 'int main() { int d = 2; switch (d) { case 1: cout << "MON"; break; case 2: cout << "TUE"; break; default: cout << "?"; } }',
  'TUE',
)

expectOut(
  'switch falls through without break',
  H + 'int main() { int x = 1; switch (x) { case 1: cout << "a"; case 2: cout << "b"; break; case 3: cout << "c"; } }',
  'ab',
)

expectOut(
  'switch hits default',
  H + 'int main() { int x = 9; switch (x) { case 1: cout << "one"; break; default: cout << "other"; } }',
  'other',
)

expectOut(
  'switch on a char',
  H + "int main() { char g = 'B'; switch (g) { case 'A': cout << 4; break; case 'B': cout << 3; break; default: cout << 0; } }",
  '3',
)

expectOut(
  'switch with no match and no default does nothing',
  H + 'int main() { int x = 5; switch (x) { case 1: cout << "no"; break; } cout << "after"; }',
  'after',
)

expectOut(
  'switch inside a loop; break leaves switch not loop',
  H + 'int main() { for (int i = 1; i <= 3; i++) { switch (i) { case 2: cout << "X"; break; default: cout << i; } } }',
  '1X3',
)

// Floor 1 reference solutions — if these break, the ch1 challenges are unsolvable.
expectOut(
  'ch1-combined: cin char routed through a switch',
  H + "int main() { char t; cin >> t; switch (t) { case 'F': cout << \"FRAGILE\"; break; case 'P': cout << \"PERISHABLE\"; break; default: cout << \"STANDARD\"; } }",
  'FRAGILE',
  'F',
)

expectOut(
  'ch1-compare: string equality read from cin',
  H + '#include <string>\nint main() { string n; cin >> n; if (n == "PRAM") cout << "SIGNED"; else cout << "REFUSED"; }',
  'REFUSED',
  'WES',
)

// Regression: incrementing a char must stay a char (print 'B', not 66).
expectOut('char ++ stays a char', H + "int main() { char c = 'A'; c++; cout << c; }", 'B')
expectOut('char postfix ++ stays a char', H + "int main() { char c = 'A'; cout << c++ << c; }", 'AB')
expectOut('char += stays a char', H + "int main() { char c = 'A'; c += 2; cout << c; }", 'C')
expectOut(
  'loop over a char range',
  H + "int main() { for (char c = 'A'; c <= 'C'; c++) cout << c; }",
  'ABC',
)

// switch: default before cases, then fall-through.
expectOut(
  'switch default falls through into a later case',
  H + 'int main() { int x = 9; switch (x) { default: cout << "d"; case 1: cout << "1"; } }',
  'd1',
)

// Floor 2 reference solutions — loop challenges.
expectOut(
  'ch2-while: countdown from cin',
  H + 'int main() { int n; cin >> n; while (n > 0) { cout << n << " "; n--; } }',
  '3 2 1 ',
  '3',
)
expectOut(
  'ch2-for: count up from cin',
  H + 'int main() { int n; cin >> n; for (int i = 1; i <= n; i++) { cout << i << " "; } }',
  '1 2 3 4 ',
  '4',
)
expectOut(
  'ch2-accum: sum 1..n accumulator',
  H + 'int main() { int n; cin >> n; int sum = 0; for (int i = 1; i <= n; i++) { sum += i; } cout << sum; }',
  '55',
  '10',
)
expectOut(
  'ch2-nested: n x n hash grid',
  H + 'int main() { int n; cin >> n; for (int r = 0; r < n; r++) { for (int c = 0; c < n; c++) { cout << "#"; } cout << endl; } }',
  '###\n###\n###\n',
  '3',
)

expectError('missing semicolon', H + 'int main() { cout << "hi" }', "';'")

expectError('undeclared variable', H + 'int main() { cout << bags; }', 'was not declared')

expectError('no main', H + 'int x = 5;', 'int main()')

expectError('infinite loop budget', H + 'int main() { while (true) { int x = 1; } }', 'too long')

expectError('division by zero', H + 'int main() { cout << 1 / 0; }', 'division by zero')

expectError('string plus int rejected', H + 'int main() { string s = "a"; cout << s + 1; }', 'cannot add')

expectError('needs more input', H + 'int main() { int x; cin >> x; }', 'more input')

expectError('unterminated string', H + 'int main() { cout << "oops; }', 'closing')

// A char literal that LOOKS like an operator must stay a value: `case '-':`
// is a label, not a negation (bit the floor-1 calculator challenge).
expectOut(
  'switch on operator-symbol chars (calculator)',
  H +
    "int main() { char op; int a; int b; cin >> op >> a >> b; switch (op) { case '+': cout << a + b; break; case '-': cout << a - b; break; case '*': cout << a * b; break; case '/': cout << a / b; break; default: cout << \"ERR\"; } }",
  '5',
  '- 9 4',
)

expectOut('char literal + in an expression prints as char', H + "int main() { char c = '+'; cout << c; }", '+')

// ---- const (floor 0 curriculum: Lab-2-style constants) ----

expectOut('const declare and use', H + 'int main() { const int FACES = 6; cout << FACES * 2; }', '12')

expectOut(
  'const in an expression with a variable',
  H + 'int main() { const int FACES = 6; int side = 5; cout << FACES * side * side; }',
  '150',
)

expectError('assigning to a const', H + 'int main() { const int X = 1; X = 2; }', 'const')

expectError('incrementing a const', H + 'int main() { const int X = 1; X++; }', 'const')

expectError('const must be initialized', H + 'int main() { const int X; cout << X; }', 'initialized')

expectError('cin into a const', H + 'int main() { const int X = 1; cin >> X; }', 'const')

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`)
  process.exit(1)
}
console.log('\nall interpreter tests passed')
