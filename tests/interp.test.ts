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

// The interpreter compiles C (stdio.h). The general-feature suite below drives
// every language construct through printf/scanf — the game's real dialect.
// C++ iostream (cout/cin/endl) is intentionally rejected; see the redirect
// tests further down.
const C = '#include <stdio.h>\n'

expectOut('hello world', C + 'int main() { printf("MOP READY"); return 0; }', 'MOP READY')

expectOut('newline escape', C + 'int main() { printf("hi\\n"); }', 'hi\n')

expectOut('escape sequences', C + 'int main() { printf("a\\tb\\n"); }', 'a\tb\n')

expectOut('int arithmetic', C + 'int main() { int bags = 3; int mops = 2; printf("%d", bags + mops); }', '5')

expectOut('int division truncates', C + 'int main() { printf("%d", 7 / 2); }', '3')

expectOut('double division', C + 'int main() { printf("%.1f", 7.0 / 2); }', '3.5')

expectOut('modulo', C + 'int main() { printf("%d", 17 % 5); }', '2')

expectOut('operator precedence', C + 'int main() { printf("%d", 2 + 3 * 4); }', '14')

expectOut('parentheses', C + 'int main() { printf("%d", (2 + 3) * 4); }', '20')

expectOut('char array variable', C + 'int main() { char crew[8] = "WES"; printf("CREW: %s", crew); }', 'CREW: WES')

expectOut('bool prints as 1/0', C + 'int main() { printf("%d%d", true, false); }', '10')

expectOut('if true branch', C + 'int main() { int c = 2; if (c >= 2) { printf("ACCESS"); } else { printf("DENIED"); } }', 'ACCESS')

expectOut('else branch', C + 'int main() { int c = 0; if (c >= 2) { printf("ACCESS"); } else { printf("DENIED"); } }', 'DENIED')

expectOut('if without braces', C + 'int main() { int c = 5; if (c > 1) printf("big"); else printf("small"); }', 'big')

expectOut('nested if', C + 'int main() { int x = 5; if (x > 0) { if (x > 3) printf("deep"); } }', 'deep')

expectOut('while loop', C + 'int main() { int i = 0; while (i < 3) { printf("SWEEP"); i++; } }', 'SWEEPSWEEPSWEEP')

expectOut('for loop', C + 'int main() { for (int i = 1; i <= 3; i++) { printf("%d", i); } }', '123')

expectOut('for with break', C + 'int main() { for (int i = 0; i < 10; i++) { if (i == 3) break; printf("%d", i); } }', '012')

expectOut('while with continue', C + 'int main() { int i = 0; while (i < 5) { i++; if (i == 3) continue; printf("%d", i); } }', '1245')

expectOut('compound assignment', C + 'int main() { int x = 10; x += 5; x -= 3; x *= 2; printf("%d", x); }', '24')

expectOut('prefix and postfix ++', C + 'int main() { int x = 1; ++x; x++; printf("%d", x); }', '3')

expectOut('logical ops', C + 'int main() { int a = 1; int b = 0; if (a && !b) printf("yes"); if (a || b) printf("also"); }', 'yesalso')

expectOut('scanf reads ints', C + 'int main() { int a; int b; scanf("%d %d", &a, &b); printf("%d", a * b); }', '42', '6 7')

expectOut('scanf reads a string', C + 'int main() { char name[8]; scanf("%s", name); printf("HI %s", name); }', 'HI WES', 'WES')

expectOut('comments ignored', C + 'int main() {\n// a comment\n/* block\ncomment */\nprintf("clean");\n}', 'clean')

expectOut('scoped shadowing allowed in blocks', C + 'int main() { int x = 1; { int y = 2; printf("%d", x + y); } printf("%d", x); }', '31')

expectOut('return exits early', C + 'int main() { printf("a"); return 0; printf("b"); }', 'a')

expectOut(
  'switch matches a case with break',
  C + 'int main() { int d = 2; switch (d) { case 1: printf("MON"); break; case 2: printf("TUE"); break; default: printf("?"); } }',
  'TUE',
)

expectOut(
  'switch falls through without break',
  C + 'int main() { int x = 1; switch (x) { case 1: printf("a"); case 2: printf("b"); break; case 3: printf("c"); } }',
  'ab',
)

expectOut(
  'switch hits default',
  C + 'int main() { int x = 9; switch (x) { case 1: printf("one"); break; default: printf("other"); } }',
  'other',
)

expectOut(
  'switch on a char',
  C + "int main() { char g = 'B'; switch (g) { case 'A': printf(\"%d\", 4); break; case 'B': printf(\"%d\", 3); break; default: printf(\"%d\", 0); } }",
  '3',
)

expectOut(
  'switch with no match and no default does nothing',
  C + 'int main() { int x = 5; switch (x) { case 1: printf("no"); break; } printf("after"); }',
  'after',
)

expectOut(
  'switch inside a loop; break leaves switch not loop',
  C + 'int main() { for (int i = 1; i <= 3; i++) { switch (i) { case 2: printf("X"); break; default: printf("%d", i); } } }',
  '1X3',
)

// Floor 1 reference solutions — if these break, the ch1 challenges are unsolvable.
expectOut(
  'ch1-combined: scanf char routed through a switch',
  C + "int main() { char t; scanf(\"%c\", &t); switch (t) { case 'F': printf(\"FRAGILE\"); break; case 'P': printf(\"PERISHABLE\"); break; default: printf(\"STANDARD\"); } }",
  'FRAGILE',
  'F',
)

// Regression: incrementing a char must stay a char (print 'B', not 66).
expectOut('char ++ stays a char', C + "int main() { char c = 'A'; c++; printf(\"%c\", c); }", 'B')
expectOut('char postfix ++ stays a char', C + "int main() { char c = 'A'; printf(\"%c%c\", c++, c); }", 'AB')
expectOut('char += stays a char', C + "int main() { char c = 'A'; c += 2; printf(\"%c\", c); }", 'C')
expectOut(
  'loop over a char range',
  C + "int main() { for (char c = 'A'; c <= 'C'; c++) printf(\"%c\", c); }",
  'ABC',
)

// switch: default before cases, then fall-through.
expectOut(
  'switch default falls through into a later case',
  C + 'int main() { int x = 9; switch (x) { default: printf("d"); case 1: printf("1"); } }',
  'd1',
)

// Floor 2 reference solutions — loop challenges.
expectOut(
  'ch2-while: countdown from scanf',
  C + 'int main() { int n; scanf("%d", &n); while (n > 0) { printf("%d ", n); n--; } }',
  '3 2 1 ',
  '3',
)
expectOut(
  'ch2-for: count up from scanf',
  C + 'int main() { int n; scanf("%d", &n); for (int i = 1; i <= n; i++) { printf("%d ", i); } }',
  '1 2 3 4 ',
  '4',
)
expectOut(
  'ch2-accum: sum 1..n accumulator',
  C + 'int main() { int n; scanf("%d", &n); int sum = 0; for (int i = 1; i <= n; i++) { sum += i; } printf("%d", sum); }',
  '55',
  '10',
)
expectOut(
  'ch2-nested: n x n hash grid',
  C + 'int main() { int n; scanf("%d", &n); for (int r = 0; r < n; r++) { for (int c = 0; c < n; c++) { printf("#"); } printf("\\n"); } }',
  '###\n###\n###\n',
  '3',
)

expectError('missing semicolon', C + 'int main() { printf("hi") }', "';'")

expectError('undeclared variable', C + 'int main() { printf("%d", bags); }', 'was not declared')

expectError('no main', C + 'int x = 5;', 'int main()')

expectError('infinite loop budget', C + 'int main() { while (1) { int x = 1; } }', 'too long')

expectError('division by zero', C + 'int main() { printf("%d", 1 / 0); }', 'division by zero')

expectError('char array plus int rejected', C + 'int main() { char s[4] = "a"; printf("%s", s + 1); }', 'cannot add')

expectError('needs more input', C + 'int main() { int x; scanf("%d", &x); }', 'more input')

expectError('unterminated string', C + 'int main() { printf("oops; }', 'closing')

// A char literal that LOOKS like an operator must stay a value: `case '-':`
// is a label, not a negation (bit the floor-1 calculator challenge).
expectOut(
  'switch on operator-symbol chars (calculator)',
  C +
    "int main() { char op; int a; int b; scanf(\"%c %d %d\", &op, &a, &b); switch (op) { case '+': printf(\"%d\", a + b); break; case '-': printf(\"%d\", a - b); break; case '*': printf(\"%d\", a * b); break; case '/': printf(\"%d\", a / b); break; default: printf(\"ERR\"); } }",
  '5',
  '- 9 4',
)

expectOut('char literal + in an expression prints as char', C + "int main() { char c = '+'; printf(\"%c\", c); }", '+')

// ---- const (floor 0 curriculum: Lab-2-style constants) ----

expectOut('const declare and use', C + 'int main() { const int FACES = 6; printf("%d", FACES * 2); }', '12')

expectOut(
  'const in an expression with a variable',
  C + 'int main() { const int FACES = 6; int side = 5; printf("%d", FACES * side * side); }',
  '150',
)

expectError('assigning to a const', C + 'int main() { const int X = 1; X = 2; }', 'const')

expectError('incrementing a const', C + 'int main() { const int X = 1; X++; }', 'const')

expectError('const must be initialized', C + 'int main() { const int X; printf("%d", X); }', 'initialized')

expectError('scanf into a const', C + 'int main() { const int X = 1; scanf("%d", &X); }', 'const')

// ---- user-defined functions (floor 3, Labs 8-9) ----

expectOut('function with return', C + 'int add(int a, int b) { return a + b; }\nint main() { printf("%d", add(2, 3)); }', '5')

expectOut('void function called twice', C + 'void greet() { printf("HI "); }\nint main() { greet(); greet(); }', 'HI HI ')

expectOut(
  'function calling another function',
  C + 'int twice(int x) { return x * 2; }\nint quad(int x) { return twice(twice(x)); }\nint main() { printf("%d", quad(3)); }',
  '12',
)

expectOut(
  'call by value: caller variable unchanged',
  C + 'void bump(int x) { x = x + 2; }\nint main() { int x = 7; bump(x); printf("%d", x); }',
  '7',
)

expectOut(
  'recursion with a base case (factorial)',
  C + 'int fact(int n) { if (n <= 1) return 1; return n * fact(n - 1); }\nint main() { printf("%d", fact(5)); }',
  '120',
)

expectError(
  'recursion without a base case overflows',
  C + 'int f(int n) { return f(n + 1); }\nint main() { printf("%d", f(0)); }',
  'stack overflow',
)

expectOut(
  'prototype first, definition after main',
  C + 'int twice(int x);\nint main() { printf("%d", twice(4)); }\nint twice(int x) { return x * 2; }',
  '8',
)

expectError('calling an unknown function', C + 'int main() { printf("%d", mystery(1)); }', 'no function named')

expectError('wrong number of arguments', C + 'int add(int a, int b) { return a + b; }\nint main() { printf("%d", add(1)); }', 'argument')

// ---- arrays (floor 3, Lab 6) ----

expectOut('array init list + indexing', C + 'int main() { int a[3] = {4, 5, 6}; printf("%d%d", a[0], a[2]); }', '46')

expectOut('array size inferred from init list', C + 'int main() { int a[] = {7, 8}; printf("%d", a[1]); }', '8')

expectOut(
  'array write + loop sum',
  C + 'int main() { int a[4]; for (int i = 0; i < 4; i++) { a[i] = i * 2; } int s = 0; for (int i = 0; i < 4; i++) { s += a[i]; } printf("%d", s); }',
  '12',
)

expectOut(
  'read array from scanf, print reversed',
  C + 'int main() { int a[3]; for (int i = 0; i < 3; i++) { scanf("%d", &a[i]); } for (int i = 2; i >= 0; i--) { printf("%d ", a[i]); } }',
  '9 2 7 ',
  '7 2 9',
)

expectOut('array element increment', C + 'int main() { int a[2] = {1, 1}; a[0]++; printf("%d%d", a[0], a[1]); }', '21')

expectOut('partial init zero-fills the rest', C + 'int main() { int a[3] = {5}; printf("%d%d%d", a[0], a[1], a[2]); }', '500')

expectError('array index past the end', C + 'int main() { int a[3]; printf("%d", a[5]); }', 'past the end')

expectError('negative array index', C + 'int main() { int a[3]; printf("%d", a[0 - 1]); }', 'past the end')

expectError('printing a whole array', C + 'int main() { int a[3] = {1, 2, 3}; printf("%d", a); }', 'whole array')

// ---- 2D arrays (floor 3, Lab 7) ----

expectOut('2d array init + indexing', C + 'int main() { int m[2][3] = {{1, 2, 3}, {4, 5, 6}}; printf("%d", m[1][2]); }', '6')

expectOut(
  '2d array nested-loop largest',
  C +
    'int main() { int m[2][2]; for (int i = 0; i < 2; i++) { for (int j = 0; j < 2; j++) { scanf("%d", &m[i][j]); } } int big = m[0][0]; for (int i = 0; i < 2; i++) { for (int j = 0; j < 2; j++) { if (m[i][j] > big) { big = m[i][j]; } } } printf("%d", big); }',
  '9',
  '4 9 1 7',
)

expectOut('2d write and read back', C + 'int main() { int m[2][2]; m[1][0] = 42; printf("%d%d", m[1][0], m[0][0]); }', '420')

// ---- char arrays as strings (floor 3, Lab 10 — the C way) ----

expectOut('char array indexing', C + 'int main() { char s[8] = "WES"; printf("%c%c", s[0], s[2]); }', 'WS')

expectOut(
  'count a letter by looping to the null terminator',
  C +
    'int main() { char s[16] = "PERISHABLE"; int count = 0; for (int i = 0; s[i] != \'\\0\'; i++) { if (s[i] == \'E\') { count++; } } printf("%d", count); }',
  '2',
)

expectOut('write one character of a char array', C + 'int main() { char s[8] = "MOP"; s[0] = \'B\'; printf("%s", s); }', 'BOP')

expectError('char array index past the end', C + 'int main() { char s[3] = "hi"; printf("%c", s[9]); }', 'past the end')

// the C++ std::string API is rejected with a nudge toward char[]
expectError('string type redirects to char[]', C + 'int main() { string s = "MOP"; printf("%s", s); }', 'char array')
expectError('.length() redirects to a loop', C + 'int main() { char s[8] = "MOP"; printf("%d", s.length()); }', 'C++')
expectError('string field redirects to char[]', C + 'struct B { string name; };\nint main() { struct B b; printf("x"); }', 'char array')

// ---- structs (floor 3, Lab 11) ----

expectOut(
  'struct fields: write and read',
  C + 'struct Badge { char name[8]; int id; };\nint main() { struct Badge b; b.id = 7; printf("%d", b.id); }',
  '7',
)

expectOut(
  'C-style struct variable declaration',
  C + 'struct Badge { int id; };\nint main() { struct Badge b; b.id = 3; printf("%d", b.id); }',
  '3',
)

expectOut(
  'struct copy is a real copy',
  C + 'struct P { int x; };\nint main() { struct P a; a.x = 1; struct P b = a; b.x = 9; printf("%d%d", a.x, b.x); }',
  '19',
)

expectError('printing a whole struct', C + 'struct P { int x; };\nint main() { struct P a; printf("%d", a); }', 'whole struct')

expectError('unknown struct field', C + 'struct P { int x; };\nint main() { struct P a; printf("%d", a.y); }', 'no field')

// ---- C++ iostream is rejected with a teaching redirect (the C game's dialect is stdio.h) ----
expectError('cout redirects to printf', C + 'int main() { cout << "hi"; }', 'printf')
expectError('std::cout redirects to printf', C + 'int main() { std::cout << "hi"; }', 'printf')
expectError('cin redirects to scanf', C + 'int main() { int x; cin >> x; }', 'scanf')
expectError('endl points to \\n', C + 'int main() { printf("%d", endl); }', 'C++')

// ---- more C stdio (the curriculum's real dialect: CS1160 labs) ----

expectOut('printf hello with newline', C + 'int main() { printf("Hello World\\n"); return 0; }', 'Hello World\n')

expectOut('printf %d substitutes an int', C + 'int main() { int year = 2022; printf("Year = %d", year); }', 'Year = 2022')

expectOut('printf %i works like %d', C + 'int main() { printf("%i", 42); }', '42')

expectOut(
  'printf several specifiers in order',
  C + 'int main() { int a = 3; int b = 2; printf("CARTS: %d LEFT: %d", a, b); }',
  'CARTS: 3 LEFT: 2',
)

expectOut('printf %.2f rounds to 2 decimals', C + 'int main() { float pi = 3.14159; printf("%.2f", pi); }', '3.14')

expectOut('printf %0.2f (lab spelling) works too', C + 'int main() { printf("%0.2f", 1.5); }', '1.50')

expectOut('printf %f defaults to 6 decimals', C + 'int main() { printf("%f", 1.5); }', '1.500000')

expectOut('printf %c prints a char', C + "int main() { char g = 'A'; printf(\"grade %c\", g); }", 'grade A')

expectOut('printf %% prints a percent sign', C + 'int main() { printf("100%%"); }', '100%')

expectOut('printf %lld (factorial lab)', C + 'int main() { long long int f = 120; printf("Factorial = %lld", f); }', 'Factorial = 120')

expectOut('scanf %d reads into &x', C + 'int main() { int x; scanf("%d", &x); printf("%d", x + 1); }', '8', '7')

expectOut(
  'scanf several values in one call',
  C + 'int main() { int a; int b; scanf("%d %d", &a, &b); printf("%d", a * b); }',
  '12',
  '3 4',
)

expectOut('scanf %c reads a symbol', C + "int main() { char op; scanf(\" %c\", &op); if (op == '+') printf(\"plus\"); }", 'plus', '+')

expectOut('scanf %f reads a decimal', C + 'int main() { float r; scanf("%f", &r); printf("%.1f", r * 2); }', '5.0', '2.5')

expectError(
  'scanf without & teaches the address lesson',
  C + 'int main() { int x; scanf("%d", x); }',
  '&',
)

expectOut(
  'scanf into an array element with &a[i]',
  C + 'int main() { int a[3]; for (int i = 0; i < 3; i++) { scanf("%d", &a[i]); } printf("%d", a[0] + a[2]); }',
  '10',
  '7 5 3',
)

// ---- char arrays (Lab 10: strings ARE char arrays ending in '\0') ----

expectOut('char array from a string literal', C + 'int main() { char a[6] = "Hello"; printf("%s", a); }', 'Hello')

expectOut('char array with inferred size', C + 'int main() { char b[] = "MOP"; printf("%s!", b); }', 'MOP!')

expectOut('scanf %s fills a char array (no &)', C + 'int main() { char w[20]; scanf("%s", w); printf("%s", w); }', 'WES', 'WES')

expectError(
  'scanf with & on an array teaches the array-is-address lesson',
  C + 'int main() { char w[20]; scanf("%s", &w); }',
  'already',
)

expectOut(
  "loop a string to the '\\0' terminator (count letters)",
  C +
    'int main() { char s[] = "Hallo! HAHA!"; int i = 0; int count = 0; while (s[i] != \'\\0\') { if (s[i] == \'a\' || s[i] == \'A\') { count++; } i++; } printf("The number of A & a: %d", count); }',
  'The number of A & a: 3',
)

expectOut(
  'write into a char array cell (toggle-style)',
  C + 'int main() { char s[] = "MOP"; s[0] = \'B\'; printf("%s", s); }',
  'BOP',
)

expectOut('gets reads, puts prints with newline', C + 'int main() { char n[30]; gets(n); puts(n); }', 'PRAM\n', 'PRAM')

expectOut(
  'manual strlen via a for loop (Lab 10 example)',
  C + 'int main() { char st[] = "CS 1160"; int i; for (i = 0; st[i] != \'\\0\'; i++); printf("the length is : %d", i); }',
  'the length is : 7',
)

expectOut(
  'struct with a char-array field (Lab 11 shape)',
  C +
    'struct Badge { char name[30]; int id; };\nint main() { struct Badge b; scanf("%s", b.name); scanf("%d", &b.id); printf("ID %d: %s", b.id, b.name); }',
  'ID 7: WES',
  'WES 7',
)

expectOut(
  'function + printf (labs 8-9 shape)',
  C + 'float average(float a, float b, float c) { return (a + b + c) / 3; }\nint main() { printf("%.2f", average(1, 2, 3)); }',
  '2.00',
)

// ---- do-while (Lab 4: the loop that always runs at least once) ----

expectOut(
  'do-while counts down',
  C + 'int main() { int n = 3; do { printf("%d ", n); n--; } while (n > 0); }',
  '3 2 1 ',
)

expectOut(
  'do-while runs once even when the condition starts false',
  C + 'int main() { int n = 0; do { printf("%d ", n); n--; } while (n > 0); }',
  '0 ',
)

expectOut(
  'do-while echo until negative (lab example shape)',
  C + 'int main() { int x; do { scanf("%d", &x); printf("%d\\n", x); } while (x >= 0); }',
  '4\n7\n-1\n',
  '4 7 -1',
)

expectOut(
  'break leaves a do-while',
  C + 'int main() { int i = 0; do { i++; if (i == 3) break; printf("%d ", i); } while (i < 10); printf("done"); }',
  '1 2 done',
)

expectError(
  'do without its while tail',
  C + 'int main() { int n = 1; do { n--; } printf("%d", n); }',
  'while',
)

// --- short-circuit evaluation: && / || skip the right operand once decided ---
expectOut(
  '&& short-circuits: guarded division by zero never runs',
  C + 'int main() { int a = 0; if (a != 0 && 5 / a > 1) printf("no"); else printf("safe"); }',
  'safe',
)
expectOut(
  '|| short-circuits: guarded division by zero never runs',
  C + 'int main() { int a = 0; if (a == 0 || 5 / a > 1) printf("safe"); }',
  'safe',
)
expectOut(
  '&& still evaluates the right operand when the left is true',
  C + 'int main() { int a = 2; if (a != 0 && 10 / a > 1) printf("yes"); else printf("no"); }',
  'yes',
)
expectOut(
  '&& short-circuits a bounds check: arr[i] never read past the end',
  C + 'int main() { int a[3] = {1,2,3}; int i = 3; if (i < 3 && a[i] == 9) printf("no"); else printf("ok"); }',
  'ok',
)
expectOut(
  'short-circuit nests correctly',
  C + 'int main() { int a=0,b=0; if (a == 0 || (b != 0 && 5 / b > 1)) printf("safe"); }',
  'safe',
)
expectError(
  'a division by zero that is actually reached still errors',
  C + 'int main() { int a = 0; printf("%d", 5 / a); }',
  'division by zero',
)

// --- printf width / flags (real C padding) ---
expectOut('%5d right-justifies', C + 'int main() { printf("[%5d]", 42); }', '[   42]')
expectOut('%-5d left-justifies', C + 'int main() { printf("[%-5d]", 42); }', '[42   ]')
expectOut('%05d zero-pads', C + 'int main() { printf("[%05d]", 42); }', '[00042]')
expectOut('%05d zero-pads after the sign', C + 'int main() { printf("[%05d]", -42); }', '[-0042]')
expectOut('%8.2f pads a fixed float', C + 'int main() { printf("[%8.2f]", 3.14159); }', '[    3.14]')
expectOut('%5s pads text', C + 'int main() { printf("[%5s]", "ab"); }', '[   ab]')
expectOut('width never truncates', C + 'int main() { printf("[%2d]", 12345); }', '[12345]')

// --- bit shifts at real C precedence; cout chains unaffected ---
expectOut('left shift', C + 'int main() { printf("%d", 1 << 4); }', '16')
expectOut('right shift is arithmetic', C + 'int main() { printf("%d %d", 32 >> 2, -8 >> 1); }', '8 -4')
expectOut('shift binds looser than +', C + 'int main() { printf("%d", 1 << 2 + 1); }', '8')
expectOut('shift binds tighter than <', C + 'int main() { printf("%d", 16 >> 2 < 5); }', '1')
expectError('shifting a double errors', C + 'int main() { printf("%d", 1.5 << 2); }', 'integers only')
expectOut('shift mixed with other operators', C + 'int main() { printf("%d %d", 1 + 2, 1 << 3); }', '3 8')

// --- ternary points to if/else ---
expectError('?: error teaches if/else', C + 'int main() { int x = 1 ? 2 : 3; }', 'if/else')

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`)
  process.exit(1)
}
console.log('\nall interpreter tests passed')
