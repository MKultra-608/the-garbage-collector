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

// ---- user-defined functions (floor 3, Labs 8-9) ----

expectOut('function with return', H + 'int add(int a, int b) { return a + b; }\nint main() { cout << add(2, 3); }', '5')

expectOut('void function called twice', H + 'void greet() { cout << "HI "; }\nint main() { greet(); greet(); }', 'HI HI ')

expectOut(
  'function calling another function',
  H + 'int twice(int x) { return x * 2; }\nint quad(int x) { return twice(twice(x)); }\nint main() { cout << quad(3); }',
  '12',
)

expectOut(
  'call by value: caller variable unchanged',
  H + 'void bump(int x) { x = x + 2; }\nint main() { int x = 7; bump(x); cout << x; }',
  '7',
)

expectOut(
  'recursion with a base case (factorial)',
  H + 'int fact(int n) { if (n <= 1) return 1; return n * fact(n - 1); }\nint main() { cout << fact(5); }',
  '120',
)

expectError(
  'recursion without a base case overflows',
  H + 'int f(int n) { return f(n + 1); }\nint main() { cout << f(0); }',
  'stack overflow',
)

expectOut(
  'prototype first, definition after main',
  H + 'int twice(int x);\nint main() { cout << twice(4); }\nint twice(int x) { return x * 2; }',
  '8',
)

expectOut(
  'string parameter and return',
  H + '#include <string>\nstring shout(string s) { return s + "!"; }\nint main() { cout << shout("MOP"); }',
  'MOP!',
)

expectError('calling an unknown function', H + 'int main() { cout << mystery(1); }', 'no function named')

expectError('wrong number of arguments', H + 'int add(int a, int b) { return a + b; }\nint main() { cout << add(1); }', 'argument')

// ---- arrays (floor 3, Lab 6) ----

expectOut('array init list + indexing', H + 'int main() { int a[3] = {4, 5, 6}; cout << a[0] << a[2]; }', '46')

expectOut('array size inferred from init list', H + 'int main() { int a[] = {7, 8}; cout << a[1]; }', '8')

expectOut(
  'array write + loop sum',
  H + 'int main() { int a[4]; for (int i = 0; i < 4; i++) { a[i] = i * 2; } int s = 0; for (int i = 0; i < 4; i++) { s += a[i]; } cout << s; }',
  '12',
)

expectOut(
  'read array from cin, print reversed',
  H + 'int main() { int a[3]; for (int i = 0; i < 3; i++) { cin >> a[i]; } for (int i = 2; i >= 0; i--) { cout << a[i] << " "; } }',
  '9 2 7 ',
  '7 2 9',
)

expectOut('array element increment', H + 'int main() { int a[2] = {1, 1}; a[0]++; cout << a[0] << a[1]; }', '21')

expectOut('partial init zero-fills the rest', H + 'int main() { int a[3] = {5}; cout << a[0] << a[1] << a[2]; }', '500')

expectError('array index past the end', H + 'int main() { int a[3]; cout << a[5]; }', 'past the end')

expectError('negative array index', H + 'int main() { int a[3]; cout << a[0 - 1]; }', 'past the end')

expectError('printing a whole array', H + 'int main() { int a[3] = {1, 2, 3}; cout << a; }', 'whole array')

// ---- 2D arrays (floor 3, Lab 7) ----

expectOut('2d array init + indexing', H + 'int main() { int m[2][3] = {{1, 2, 3}, {4, 5, 6}}; cout << m[1][2]; }', '6')

expectOut(
  '2d array nested-loop largest',
  H +
    'int main() { int m[2][2]; for (int i = 0; i < 2; i++) { for (int j = 0; j < 2; j++) { cin >> m[i][j]; } } int big = m[0][0]; for (int i = 0; i < 2; i++) { for (int j = 0; j < 2; j++) { if (m[i][j] > big) { big = m[i][j]; } } } cout << big; }',
  '9',
  '4 9 1 7',
)

expectOut('2d write and read back', H + 'int main() { int m[2][2]; m[1][0] = 42; cout << m[1][0] << m[0][0]; }', '420')

// ---- strings as sequences (floor 3, Lab 10) ----

expectOut('string length()', H + '#include <string>\nint main() { string s = "MOP"; cout << s.length(); }', '3')

expectOut('string size()', H + '#include <string>\nint main() { string s = "CREW"; cout << s.size(); }', '4')

expectOut('string indexing', H + '#include <string>\nint main() { string s = "WES"; cout << s[0] << s[2]; }', 'WS')

expectOut(
  'count a letter in a string',
  H +
    '#include <string>\nint main() { string s = "PERISHABLE"; int count = 0; for (int i = 0; i < s.length(); i++) { if (s[i] == \'E\') { count++; } } cout << count; }',
  '2',
)

expectOut('write one character of a string', H + '#include <string>\nint main() { string s = "MOP"; s[0] = \'B\'; cout << s; }', 'BOP')

expectError('string index past the end', H + '#include <string>\nint main() { string s = "MOP"; cout << s[9]; }', 'past the end')

// ---- structs (floor 3, Lab 11) ----

expectOut(
  'struct fields: write and read',
  H + 'struct Badge { string name; int id; };\nint main() { Badge b; b.name = "WES"; b.id = 7; cout << b.id << ": " << b.name; }',
  '7: WES',
)

expectOut(
  'C-style struct variable declaration',
  H + 'struct Badge { int id; };\nint main() { struct Badge b; b.id = 3; cout << b.id; }',
  '3',
)

expectOut(
  'struct copy is a real copy',
  H + 'struct P { int x; };\nint main() { P a; a.x = 1; P b = a; b.x = 9; cout << a.x << b.x; }',
  '19',
)

expectOut(
  'cin into a struct field',
  H + 'struct Badge { string name; int id; };\nint main() { Badge b; cin >> b.name >> b.id; cout << b.name << "#" << b.id; }',
  'WES#12',
  'WES 12',
)

expectError('printing a whole struct', H + 'struct P { int x; };\nint main() { P a; cout << a; }', 'whole struct')

expectError('unknown struct field', H + 'struct P { int x; };\nint main() { P a; cout << a.y; }', 'no field')

// ---- C stdio (the curriculum's real dialect: CS1160 labs) ----

const C = '#include <stdio.h>\n'

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

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`)
  process.exit(1)
}
console.log('\nall interpreter tests passed')
