/**
 * Code challenges — the educational core. Players write REAL C at wall
 * terminals — the same dialect the CS1160 labs teach (#include <stdio.h>,
 * printf/scanf, char arrays) — and the interpreter (game/code/interp.ts)
 * runs it; the validator grades behavior, not just syntax.
 *
 * Design rules for new challenges (see docs/CURRICULUM.md for the full arc):
 *  - `brief` teaches the concept in-fiction, in plain words, BEFORE asking.
 *  - Starter code should compile or fail in an instructive way.
 *  - Prefer `expect`/`variants` (behavior) over `require` (regex). Use
 *    `require` only to force the concept ("must use a loop"), and always
 *    give a `hint` that teaches.
 *  - Every challenge rewards something tangible: an ability, RAM, or scrap.
 *  - `terms` lists glossary keys (data/glossary.ts) for every word/command
 *    used — each defines the term and why it is named that.
 */
export interface Challenge {
  id: string
  title: string
  /** Floor this challenge belongs to (matches FLOORS index in data/maps.ts). */
  floor: number
  /** Short concept label, shown in the editor header and the hints panel. */
  teaches: string
  /** Shown above the editor. Each entry is a paragraph. */
  brief: string[]
  starter: string
  /**
   * Escalating help revealed one at a time (concept nudge -> syntax pattern ->
   * near-complete line). The player opens these with F1 in the editor.
   */
  hints: string[]
  /**
   * The full worked solution. Shown on request after the hints, and used by
   * tests/solutions.test.ts — so what the player sees is guaranteed to pass.
   */
  solution: string
  /**
   * Glossary keys (data/glossary.ts) for every word/command this challenge
   * uses — each defines the term and why it is named that. Rendered on the
   * GLOSSARY page of the F1 help overlay.
   */
  terms: string[]
  expect?: { label?: string; stdin?: string; output: string }[]
  /** Re-runs the program with a source substitution — proves the code reacts to data, not hardcoding. */
  variants?: { label: string; replace: [string, string]; stdin?: string; output: string }[]
  require?: { label: string; pattern: RegExp; hint: string }[]
  forbid?: { label: string; pattern: RegExp; hint: string }[]
  reward: { ability?: string; ramBonus?: number; scrap?: number }
  doneFlag: string
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'ch0-hello',
    title: 'FIRST SHIFT',
    floor: 0,
    teaches: 'printf & \\n — printing',
    brief: [
      'Every C program starts at a function called main. The building only listens to programs that have one.',
      'Printing is done by printf — PRINT Formatted — a function from the stdio library that #include <stdio.h> brings in. Text goes in "double quotes"; \\n inside the quotes ends the line; every statement ends with a semicolon ;',
      'TASK: Print exactly two lines:  NIGHT SHIFT  and under it  MOP READY',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    // line 1: NIGHT SHIFT\n    // line 2: MOP READY\n\n    return 0;\n}\n',
    hints: [
      'Two lines means a line break between them — that is what \\n inside the quotes does.',
      'End the first line inside the text:  printf("NIGHT SHIFT\\n");',
      'Then print the second line:  printf("MOP READY");',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    printf("NIGHT SHIFT\\n");\n    printf("MOP READY");\n    return 0;\n}\n',
    expect: [{ label: 'prints both lines', output: 'NIGHT SHIFT\nMOP READY' }],
    require: [
      {
        label: 'uses printf',
        pattern: /printf\s*\(/,
        hint: 'print with the stdio function: printf("NIGHT SHIFT");',
      },
      {
        label: 'ends the first line',
        pattern: /\\n/,
        hint: 'drop to the next line with \\n inside the quotes',
      },
    ],
    terms: ['include', 'main', 'printf', 'escape', 'quotes', 'semicolon', 'ret0'],
    reward: { ability: 'flush', scrap: 5 },
    doneFlag: 'done-ch0-hello',
  },
  {
    id: 'ch0-vars',
    title: 'CRATE MATH',
    floor: 0,
    teaches: 'variables, const & %d',
    brief: [
      'A variable is a labeled box: int side = 5; makes a box named side holding the whole number 5. Boxes combine with math operators: side * side is side times side.',
      'A const box is set once and can never change: const int FACES = 6; — the compiler enforces it. To print a number, put a %d placeholder in the format string: printf("%d", side);',
      'TASK: Print the crate volume (side * side * side), then its surface (FACES * side * side), on two lines. Side 5: 125 then 150.',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    int side = 5;\n    const int FACES = 6;\n    // line 1: volume  = side * side * side\n    // line 2: surface = FACES * side * side\n\n    return 0;\n}\n',
    hints: [
      'Multiply the box by itself: side * side * side is the volume. %d is where the number lands.',
      'First line:  printf("%d\\n", side * side * side);',
      'The const works like any variable:  printf("%d", FACES * side * side);',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    int side = 5;\n    const int FACES = 6;\n    printf("%d\\n", side * side * side);\n    printf("%d", FACES * side * side);\n    return 0;\n}\n',
    expect: [{ label: 'side 5: volume 125, surface 150', output: '125\n150' }],
    variants: [
      {
        label: 'works when side = 2 (no hardcoding!)',
        replace: ['side = 5', 'side = 2'],
        output: '8\n24',
      },
    ],
    require: [
      {
        label: 'keeps the const',
        pattern: /const\s+int\s+FACES/,
        hint: 'keep the line: const int FACES = 6;',
      },
    ],
    terms: ['varword', 'int', 'assignop', 'const', 'arith', 'fmtspec'],
    reward: { ability: 'increment', scrap: 5 },
    doneFlag: 'done-ch0-vars',
  },
  {
    id: 'ch0-ops',
    title: 'LOAD BALANCE',
    floor: 0,
    teaches: 'int division & % remainder',
    brief: [
      'Two more math operators: / divides, and % gives the remainder after division. On whole numbers / truncates: 17 / 5 is 3, and 17 % 5 is the 2 left over.',
      'A format string can mix text and placeholders: printf("CARTS: %d\\n", n); prints the label, then the value where the %d sits.',
      'TASK: 17 bags, 5 fit per cart. Print exactly  CARTS: 3  and under it  LEFT: 2  — computed from the variables, never typed in.',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    int bags = 17;\n    int cart = 5;\n    // CARTS: full carts (bags / cart)\n    // LEFT:  the remainder (bags % cart)\n\n    return 0;\n}\n',
    hints: [
      'Full carts is whole-number division. The leftover is the remainder operator %.',
      'Label and value together:  printf("CARTS: %d\\n", bags / cart);',
      'Second line:  printf("LEFT: %d", bags % cart);',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    int bags = 17;\n    int cart = 5;\n    printf("CARTS: %d\\n", bags / cart);\n    printf("LEFT: %d", bags % cart);\n    return 0;\n}\n',
    expect: [{ label: '17 bags: 3 carts, 2 left', output: 'CARTS: 3\nLEFT: 2' }],
    variants: [
      {
        label: 'works for 23 bags (no hardcoding!)',
        replace: ['bags = 17', 'bags = 23'],
        output: 'CARTS: 4\nLEFT: 3',
      },
    ],
    require: [
      {
        label: 'uses the remainder operator',
        pattern: /bags\s*%\s*cart/,
        hint: 'the leftover is the remainder: bags % cart',
      },
    ],
    terms: ['arith', 'modulo', 'printf', 'fmtspec', 'escape'],
    reward: { ramBonus: 2, scrap: 5 },
    doneFlag: 'done-ch0-ops',
  },
  {
    id: 'ch0-logic',
    title: 'GATE LOGIC',
    floor: 0,
    teaches: 'comparisons & logical ops',
    brief: [
      'A comparison like amps == 6 produces a number: 1 when true, 0 when false — C keeps its truth in plain ints. Compare with == != < <= > >=.',
      'Combine checks: && is true only when BOTH sides are true; || when EITHER is; ! flips a truth. Print a check by handing it to %d.',
      'TASK: Print the four checks listed in the code, one per line. For amps 6, volts 8 the gate reads:  1 0 0 1',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    int amps = 6;\n    int volts = 8;\n    // print these, one per line, with %d:\n    // 1: amps == 6\n    // 2: amps >= 6 && volts < 4\n    // 3: !(volts > amps)\n    // 4: volts >= amps || volts == 7\n\n    return 0;\n}\n',
    hints: [
      'Each check is an expression that is already 1 or 0 — hand it to printf as the value.',
      'The shape:  printf("%d\\n", amps == 6);',
      'The combined ones look the same:  printf("%d\\n", amps >= 6 && volts < 4);',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    int amps = 6;\n    int volts = 8;\n    printf("%d\\n", amps == 6);\n    printf("%d\\n", amps >= 6 && volts < 4);\n    printf("%d\\n", !(volts > amps));\n    printf("%d", volts >= amps || volts == 7);\n    return 0;\n}\n',
    expect: [{ label: 'amps 6, volts 8 reads 1 0 0 1', output: '1\n0\n0\n1' }],
    variants: [
      {
        label: 'works when amps = 9 (real checks!)',
        replace: ['amps = 6', 'amps = 9'],
        output: '0\n0\n1\n0',
      },
    ],
    require: [
      { label: 'uses &&', pattern: /&&/, hint: 'both-must-hold checks use &&' },
      { label: 'uses ||', pattern: /\|\|/, hint: 'either-may-hold checks use ||' },
      { label: 'uses !', pattern: /!\s*\(/, hint: 'flip the third check with !( ... )' },
    ],
    terms: ['truth', 'compare', 'and', 'or', 'not'],
    reward: { ability: 'guard', scrap: 10 },
    doneFlag: 'done-ch0-logic',
  },

  // ------------------------------------------------------------- Floor 1
  {
    id: 'ch1-cin',
    title: 'INTAKE',
    floor: 1,
    teaches: 'scanf — reading input',
    brief: [
      'So far your programs knew every value in advance. Real mail changes nightly. scanf — SCAN Formatted, printf\'s twin from the stdio library — reads what is typed INTO a variable.',
      'scanf needs the ADDRESS of the box, so you write & in front: scanf("%d", &count); — the & means "address of". The starter already reads an int called count.',
      'TASK: Print exactly:  PARCELS: count   (the number that was read in, not a fixed number).',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    int count;\n    scanf("%d", &count);\n    // print PARCELS: followed by count\n\n    return 0;\n}\n',
    hints: [
      'The value is already read into count for you. Print a label, then that variable.',
      'Mix text and a placeholder:  printf("PARCELS: %d", count);',
      'Keep the  scanf("%d", &count);  line, then add the printf under it.',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    int count;\n    scanf("%d", &count);\n    printf("PARCELS: %d", count);\n    return 0;\n}\n',
    expect: [
      { label: 'reading 5 prints PARCELS: 5', stdin: '5', output: 'PARCELS: 5' },
      { label: 'reading 42 prints PARCELS: 42 (no hardcoding!)', stdin: '42', output: 'PARCELS: 42' },
    ],
    require: [
      { label: 'reads with scanf and &', pattern: /scanf\s*\(\s*"%d"\s*,\s*&\s*count\s*\)/, hint: 'keep the line: scanf("%d", &count);' },
      { label: 'prints with printf', pattern: /printf\s*\(/, hint: 'print with: printf("PARCELS: %d", count);' },
    ],
    terms: ['scanf', 'addressof', 'fmtspec', 'printf', 'varword'],
    reward: { ramBonus: 2, scrap: 8 },
    doneFlag: 'done-ch1-cin',
  },
  {
    id: 'ch1-ladder',
    title: 'CLIMATE CONTROL',
    floor: 1,
    teaches: 'if / else if ladder',
    brief: [
      'One if picks between two paths. A LADDER of if / else if / else picks between many: conditions are checked from the top, and the FIRST true one runs — the rest are skipped.',
      'Because earlier rungs already caught smaller values, each rung needs only one comparison: by the time else if (t <= 15) is checked, t is already above 0.',
      'TASK: The mailroom thermostat reads an int t. Print FROZEN if t <= 0, COLD for 1 to 15, NORMAL for 16 to 30, and HOT above 30.',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    int t;\n    scanf("%d", &t);\n    // ladder: <= 0 FROZEN, <= 15 COLD,\n    //         <= 30 NORMAL, else HOT\n\n    return 0;\n}\n',
    hints: [
      'Check the coldest band first. Each later rung only runs when every earlier one was false.',
      'The shape:  if (t <= 0) { ... } else if (t <= 15) { ... } else if (t <= 30) { ... } else { ... }',
      'Each rung prints its word:  else if (t <= 15) { printf("COLD"); }',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    int t;\n    scanf("%d", &t);\n    if (t <= 0) {\n        printf("FROZEN");\n    } else if (t <= 15) {\n        printf("COLD");\n    } else if (t <= 30) {\n        printf("NORMAL");\n    } else {\n        printf("HOT");\n    }\n    return 0;\n}\n',
    expect: [
      { label: '-5 is FROZEN', stdin: '-5', output: 'FROZEN' },
      { label: '10 is COLD', stdin: '10', output: 'COLD' },
      { label: '22 is NORMAL', stdin: '22', output: 'NORMAL' },
      { label: '31 is HOT', stdin: '31', output: 'HOT' },
    ],
    require: [
      { label: 'chains with else if', pattern: /else\s+if/, hint: 'link the rungs: } else if (t <= 15) {' },
      { label: 'uses an if', pattern: /if\s*\(/, hint: 'start the ladder with if (t <= 0)' },
    ],
    terms: ['ifelse', 'elseif', 'compare', 'scanf', 'addressof'],
    reward: { ramBonus: 2, scrap: 10 },
    doneFlag: 'done-ch1-ladder',
  },
  {
    id: 'ch1-switch',
    title: 'SORTING CODE',
    floor: 1,
    teaches: 'switch / case / default',
    brief: [
      'When ONE value routes to many outcomes, switch beats a pile of else ifs. The value in switch ( ) is evaluated once and compared against each case label — labels must be integer or character constants.',
      'On a match, execution runs until a break. Forget the break and it FALLS THROUGH into the next case. default catches everything unmatched.',
      'TASK: Read int bin. Print PAPER for 1, PLASTIC for 2, METAL for 3, and LANDFILL for anything else. break after every case.',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    int bin;\n    scanf("%d", &bin);\n    switch (bin) {\n        // case 1 PAPER, case 2 PLASTIC,\n        // case 3 METAL, default LANDFILL\n    }\n    return 0;\n}\n',
    hints: [
      'Route bin to one of four outputs: PAPER (1), PLASTIC (2), METAL (3), LANDFILL (the rest).',
      'Each case prints, then breaks:  case 1: printf("PAPER"); break;',
      'After the three cases, catch the rest:  default: printf("LANDFILL");',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    int bin;\n    scanf("%d", &bin);\n    switch (bin) {\n        case 1: printf("PAPER"); break;\n        case 2: printf("PLASTIC"); break;\n        case 3: printf("METAL"); break;\n        default: printf("LANDFILL");\n    }\n    return 0;\n}\n',
    expect: [
      { label: 'bin 1 -> PAPER', stdin: '1', output: 'PAPER' },
      { label: 'bin 2 -> PLASTIC', stdin: '2', output: 'PLASTIC' },
      { label: 'bin 3 -> METAL', stdin: '3', output: 'METAL' },
      { label: 'bin 9 -> LANDFILL', stdin: '9', output: 'LANDFILL' },
    ],
    require: [
      { label: 'uses a switch', pattern: /switch\s*\(/, hint: 'route the value with switch (bin) { ... }' },
      { label: 'has a default', pattern: /default\s*:/, hint: 'catch the rest with default:' },
      { label: 'breaks each case', pattern: /break\s*;/, hint: 'end each case with break; or it falls through' },
    ],
    terms: ['switch', 'case', 'break', 'default', 'scanf'],
    reward: { ability: 'switchcase', scrap: 12 },
    doneFlag: 'done-ch1-switch',
  },
  {
    id: 'ch1-calc',
    title: 'POSTAGE CALC',
    floor: 1,
    teaches: 'scanf %c + switch + math',
    brief: [
      'The postage meter is a tiny calculator: an operation symbol and two numbers go in, one result comes out. This is everything from tonight in one program.',
      "A char holds one symbol; scanf reads one with %c (a space before it, \" %c\", skips stray line breaks). switch matches chars too: case '+': — single quotes for single characters.",
      "TASK: Read char op and ints a, b. Print the result: a+b for '+', likewise - * and /, or ERR for any other op. Int division: 9 / 2 is 4.",
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    char op;\n    int a;\n    int b;\n    scanf(" %c %d %d", &op, &a, &b);\n    // switch on op: + - * / compute, else ERR\n\n    return 0;\n}\n',
    hints: [
      'Route on the operation character; each case prints one computed result, then breaks.',
      "A math case looks like:  case '+': printf(\"%d\", a + b); break;",
      'After the four math cases:  default: printf("ERR");',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    char op;\n    int a;\n    int b;\n    scanf(" %c %d %d", &op, &a, &b);\n    switch (op) {\n        case \'+\': printf("%d", a + b); break;\n        case \'-\': printf("%d", a - b); break;\n        case \'*\': printf("%d", a * b); break;\n        case \'/\': printf("%d", a / b); break;\n        default: printf("ERR");\n    }\n    return 0;\n}\n',
    expect: [
      { label: '+ 6 8 -> 14', stdin: '+ 6 8', output: '14' },
      { label: '- 9 4 -> 5', stdin: '- 9 4', output: '5' },
      { label: '* 3 5 -> 15', stdin: '* 3 5', output: '15' },
      { label: '/ 9 2 -> 4 (int division!)', stdin: '/ 9 2', output: '4' },
      { label: '? 1 1 -> ERR', stdin: '? 1 1', output: 'ERR' },
    ],
    require: [
      { label: 'uses a switch', pattern: /switch\s*\(/, hint: 'route the symbol with switch (op) { ... }' },
      { label: 'matches char cases', pattern: /case\s*'/, hint: "match symbols in single quotes: case '+':" },
      { label: 'reads the input', pattern: /scanf\s*\(/, hint: 'keep: scanf(" %c %d %d", &op, &a, &b);' },
    ],
    terms: ['char', 'switch', 'case', 'default', 'scanf', 'addressof', 'arith'],
    reward: { ramBonus: 3, scrap: 18 },
    doneFlag: 'done-ch1-calc',
  },

  // ------------------------------------------------------------- Floor 2
  {
    id: 'ch2-while',
    title: 'CLOCK OUT',
    floor: 2,
    teaches: 'while loops',
    brief: [
      'A while loop repeats its braced body as long as a condition stays true: while (n > 0) { ... }. Something inside must eventually make the condition false, or it runs forever.',
      'The starter reads an int n. Count it down out loud.',
      'TASK: Using a while loop, print n, then n-1, ... down to 1, each followed by a space. For n=3 print:  3 2 1',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // while n is above 0: print n and a space,\n    // then shrink n\n\n    return 0;\n}\n',
    expect: [
      { label: 'n=3 counts down', stdin: '3', output: '3 2 1' },
      { label: 'n=5 counts down', stdin: '5', output: '5 4 3 2 1' },
    ],
    require: [
      { label: 'uses a while loop', pattern: /while\s*\(/, hint: 'repeat with: while (n > 0) { ... }' },
      { label: 'shrinks n each pass', pattern: /n\s*--|n\s*-=|n\s*=\s*n\s*-/, hint: 'shrink n inside the loop with n-- , or it never ends' },
    ],
    hints: [
      'Repeat while n is still positive, printing n each pass and then shrinking it.',
      'The loop is: while (n > 0) { ... }. Inside, print n and a space.',
      'Do not forget to shrink n, or it loops forever:  printf("%d ", n); n--;',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    while (n > 0) {\n        printf("%d ", n);\n        n--;\n    }\n    return 0;\n}\n',
    terms: ['whileloop', 'compare', 'increment', 'scanf'],
    reward: { ramBonus: 2, scrap: 10 },
    doneFlag: 'done-ch2-while',
  },
  {
    id: 'ch2-dowhile',
    title: 'PRESSURE TEST',
    floor: 2,
    teaches: 'do-while — runs at least once',
    brief: [
      'while checks BEFORE each pass — if the condition starts false, the body never runs. do-while flips that: do { body } while (condition); puts the test at the BOTTOM, so the body always runs at least once.',
      'The starter reads the pneumatic tube pressure n.',
      'TASK: Fire the tube with a do-while: print n and a space, shrink n, repeat while n > 0. For 3 print:  3 2 1  — and for 0 it still fires once:  0',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // do { print n, shrink n } while n > 0\n\n    return 0;\n}\n',
    hints: [
      'The body comes first, the test comes last — that is the whole trick of do-while.',
      'The shape:  do { printf("%d ", n); n--; } while (n > 0);',
      'Note the semicolon after the condition — do-while ends with  } while (n > 0);',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    do {\n        printf("%d ", n);\n        n--;\n    } while (n > 0);\n    return 0;\n}\n',
    expect: [
      { label: 'pressure 3 fires 3 2 1', stdin: '3', output: '3 2 1' },
      { label: 'pressure 0 STILL fires once (the lesson!)', stdin: '0', output: '0' },
      { label: 'pressure 1 fires once', stdin: '1', output: '1' },
    ],
    require: [
      { label: 'body first: do {', pattern: /do\s*\{/, hint: 'the body comes first: do { ... }' },
      { label: 'test at the bottom', pattern: /\}\s*while\s*\(/, hint: 'the test sits at the bottom: } while (n > 0);' },
    ],
    terms: ['dowhile', 'whileloop', 'increment', 'scanf'],
    reward: { ramBonus: 2, scrap: 12 },
    doneFlag: 'done-ch2-dowhile',
  },
  {
    id: 'ch2-for',
    title: 'SHELF SCAN',
    floor: 2,
    teaches: 'for loops',
    brief: [
      'A for loop packs the counter setup, the test, and the step into one line: for (int i = 1; i <= n; i++) { ... }. It runs the body once for each value of i.',
      'The starter reads an int n.',
      'TASK: Using a for loop, print 1, 2, ... up to n, each followed by a space. For n=4 print:  1 2 3 4',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // for i from 1 to n: print i and a space\n\n    return 0;\n}\n',
    expect: [
      { label: 'n=4 lists shelves', stdin: '4', output: '1 2 3 4' },
      { label: 'n=1 lists one', stdin: '1', output: '1' },
      { label: 'n=6 lists six', stdin: '6', output: '1 2 3 4 5 6' },
    ],
    require: [{ label: 'uses a for loop', pattern: /for\s*\(/, hint: 'count up with: for (int i = 1; i <= n; i++) { ... }' }],
    hints: [
      'Count i from 1 up to n, printing each i followed by a space.',
      'The header is: for (int i = 1; i <= n; i++) { ... }',
      'Inside the loop body:  printf("%d ", i);',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    for (int i = 1; i <= n; i++) {\n        printf("%d ", i);\n    }\n    return 0;\n}\n',
    terms: ['forloop', 'increment', 'compare', 'scanf'],
    reward: { ability: 'looplash', scrap: 12 },
    doneFlag: 'done-ch2-for',
  },
  {
    id: 'ch2-accum',
    title: 'TALLY',
    floor: 2,
    teaches: 'accumulators',
    brief: [
      'To build a total, keep a box that survives every pass of the loop: start int sum = 0; then sum += i; each time. When the loop ends, sum holds the answer.',
      'The starter reads an int n.',
      'TASK: Add up every number from 1 to n and print the total. For n=5 the total is 15 (1+2+3+4+5).',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    int sum = 0;\n    // loop 1..n adding into sum, then print sum\n\n    return 0;\n}\n',
    expect: [
      { label: 'sum 1..5 = 15', stdin: '5', output: '15' },
      { label: 'sum 1..10 = 55', stdin: '10', output: '55' },
      { label: 'sum 1..1 = 1', stdin: '1', output: '1' },
    ],
    require: [
      { label: 'uses a loop', pattern: /for\s*\(|while\s*\(/, hint: 'walk the numbers with a for or while loop' },
      { label: 'accumulates into sum', pattern: /sum\s*\+=|sum\s*=\s*sum\s*\+/, hint: 'add into the running total: sum += i;' },
    ],
    hints: [
      'Keep a running total that survives the whole loop, adding each number into it.',
      'Loop i from 1 to n and do  sum += i;  each pass.',
      'After the loop finishes, print the total:  printf("%d", sum);',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    int sum = 0;\n    for (int i = 1; i <= n; i++) {\n        sum += i;\n    }\n    printf("%d", sum);\n    return 0;\n}\n',
    terms: ['compound', 'forloop', 'varword', 'int'],
    reward: { ramBonus: 2, scrap: 12 },
    doneFlag: 'done-ch2-accum',
  },
  {
    id: 'ch2-nested',
    title: 'GRID FILE',
    floor: 2,
    teaches: 'nested loops',
    brief: [
      'A loop inside a loop builds two dimensions. The outer loop makes rows; the inner loop fills each row. Print "\\n" at the end of a row to drop to the next line.',
      'The starter reads an int n.',
      'TASK: Print an n-by-n block of # characters — n rows, each with n hashes. For n=3:  ###  ###  ### (three lines).',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // outer loop = rows; inner loop prints\n    // n hashes; then a "\\n"\n\n    return 0;\n}\n',
    expect: [
      { label: 'n=3 makes a 3x3 block', stdin: '3', output: '###\n###\n###' },
      { label: 'n=2 makes a 2x2 block', stdin: '2', output: '##\n##' },
    ],
    require: [
      { label: 'has a loop inside a loop', pattern: /for[\s\S]*for|while[\s\S]*while|for[\s\S]*while|while[\s\S]*for/, hint: 'put one loop inside another: outer for rows, inner for hashes' },
      { label: 'ends each row', pattern: /\\n/, hint: 'drop to the next line after each row with printf("\\n");' },
    ],
    hints: [
      'Make rows with an outer loop; fill each row with an inner loop of hashes.',
      'Inner loop:  for (int c = 0; c < n; c++) printf("#");',
      'After the inner loop, drop a line with  printf("\\n");  then let the outer loop repeat.',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    for (int r = 0; r < n; r++) {\n        for (int c = 0; c < n; c++) {\n            printf("#");\n        }\n        printf("\\n");\n    }\n    return 0;\n}\n',
    terms: ['forloop', 'escape', 'increment'],
    reward: { ramBonus: 3, scrap: 20 },
    doneFlag: 'done-ch2-nested',
  },

  // ------------------------------------------------------------- Floor 3
  {
    id: 'ch3-array',
    title: 'BIN ROW',
    floor: 3,
    teaches: 'arrays — a row of boxes',
    brief: [
      'An ARRAY is a row of same-type boxes under one name: int bins[4]; makes four ints side by side. bins[i] is box number i — and counting starts at 0, so the first box is bins[0] and the last is bins[3].',
      'Loops and arrays are partners: the loop counter is the index. scanf fills one box with &bins[i] — the address of that box.',
      'TASK: Read 4 ints into an array, then print them in REVERSE order, each followed by a space. For 3 9 4 7 print:  7 4 9 3',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    int bins[4];\n    // loop 0..3: scanf("%d", &bins[i])\n    // loop 3..0: print bins[i] and a space\n\n    return 0;\n}\n',
    hints: [
      'One loop fills the array front to back; a second loop reads it back to front.',
      'Fill it:  for (int i = 0; i < 4; i++) { scanf("%d", &bins[i]); }',
      'Reverse is a countdown:  for (int i = 3; i >= 0; i--) { printf("%d ", bins[i]); }',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    int bins[4];\n    for (int i = 0; i < 4; i++) {\n        scanf("%d", &bins[i]);\n    }\n    for (int i = 3; i >= 0; i--) {\n        printf("%d ", bins[i]);\n    }\n    return 0;\n}\n',
    expect: [
      { label: '3 9 4 7 reversed', stdin: '3 9 4 7', output: '7 4 9 3' },
      { label: '1 2 3 4 reversed', stdin: '1 2 3 4', output: '4 3 2 1' },
    ],
    require: [
      { label: 'uses the array', pattern: /bins\s*\[/, hint: 'store into the boxes: bins[i]' },
      { label: 'uses a loop', pattern: /for\s*\(|while\s*\(/, hint: 'walk the indexes with a loop' },
    ],
    terms: ['array', 'index', 'forloop', 'scanf', 'addressof'],
    reward: { ramBonus: 2, scrap: 14 },
    doneFlag: 'done-ch3-array',
  },
  {
    id: 'ch3-grid',
    title: 'FLOOR PLAN',
    floor: 3,
    teaches: '2D arrays — grids',
    brief: [
      'An array can hold arrays: int m[2][3]; is a GRID — 2 rows of 3 columns. m[r][c] picks row r, then column c, like a seat number.',
      'Nested loops walk a grid: the outer loop picks the row, the inner loop walks its columns.',
      'TASK: Read a 2x3 grid of ints (row by row), then print the LARGEST value in the grid. For 4 9 1 / 7 2 8 that is 9.',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    int m[2][3];\n    // nested loops: scanf("%d", &m[r][c])\n    // start big = m[0][0]; scan for bigger\n\n    return 0;\n}\n',
    hints: [
      'Fill the grid with nested loops, then scan it the same way, keeping the biggest seen so far.',
      'Start the record holder at the first cell:  int big = m[0][0];',
      'In the scan:  if (m[r][c] > big) { big = m[r][c]; }',
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    int m[2][3];\n    for (int r = 0; r < 2; r++) {\n        for (int c = 0; c < 3; c++) {\n            scanf("%d", &m[r][c]);\n        }\n    }\n    int big = m[0][0];\n    for (int r = 0; r < 2; r++) {\n        for (int c = 0; c < 3; c++) {\n            if (m[r][c] > big) {\n                big = m[r][c];\n            }\n        }\n    }\n    printf("%d", big);\n    return 0;\n}\n',
    expect: [
      { label: 'largest of 4 9 1 7 2 8 is 9', stdin: '4 9 1 7 2 8', output: '9' },
      { label: 'largest of 1 2 3 4 5 6 is 6', stdin: '1 2 3 4 5 6', output: '6' },
      { label: 'works when all are negative', stdin: '-5 -2 -9 -7 -1 -3', output: '-1' },
    ],
    require: [
      { label: 'indexes two dimensions', pattern: /\]\s*\[/, hint: 'a grid cell needs both indexes: m[r][c]' },
      { label: 'nests two loops', pattern: /for[\s\S]*for/, hint: 'outer loop for rows, inner loop for columns' },
    ],
    terms: ['twod', 'array', 'index', 'forloop', 'ifelse'],
    reward: { ramBonus: 2, scrap: 16 },
    doneFlag: 'done-ch3-grid',
  },
  {
    id: 'ch3-func',
    title: 'DELEGATE',
    floor: 3,
    teaches: 'functions — define & call',
    brief: [
      "A FUNCTION is a named block that does one job, from math's f(x). Define it once above main; CALL it by name as often as you like. Its parameters receive COPIES of what you pass (call by value), and return hands the answer back. printf and scanf are functions too — the stdio library wrote those for you.",
      'A function may even call itself — recursion — as long as a base case stops it.',
      'TASK: Define int average(int a, int b, int c) that returns their average. In main, read three ints and print average(x, y, z). For 3 4 5 print 4.',
    ],
    starter:
      '#include <stdio.h>\n\n// define int average(int a, int b, int c) here\n\nint main() {\n    int x;\n    int y;\n    int z;\n    scanf("%d %d %d", &x, &y, &z);\n    // print average(x, y, z) with %d\n\n    return 0;\n}\n',
    hints: [
      'The function lives ABOVE main: its own int header, braces, and a return.',
      'int average(int a, int b, int c) {\n    return (a + b + c) / 3;\n}',
      'Calling it looks like using a variable:  printf("%d", average(x, y, z));',
    ],
    solution:
      '#include <stdio.h>\n\nint average(int a, int b, int c) {\n    return (a + b + c) / 3;\n}\n\nint main() {\n    int x;\n    int y;\n    int z;\n    scanf("%d %d %d", &x, &y, &z);\n    printf("%d", average(x, y, z));\n    return 0;\n}\n',
    expect: [
      { label: 'average of 3 4 5 is 4', stdin: '3 4 5', output: '4' },
      { label: 'average of 10 20 30 is 20', stdin: '10 20 30', output: '20' },
    ],
    require: [
      { label: 'defines average(...)', pattern: /int\s+average\s*\(/, hint: 'define it: int average(int a, int b, int c) { ... }' },
      { label: 'returns the answer', pattern: /return\s+/, hint: 'hand the result back with return' },
    ],
    terms: ['func', 'params', 'returnval', 'recursion', 'printf'],
    reward: { ability: 'subroutine', scrap: 18 },
    doneFlag: 'done-ch3-func',
  },
  {
    id: 'ch3-recur',
    title: 'SELF CALL',
    floor: 3,
    teaches: 'recursion — a base case',
    brief: [
      'A function may call ITSELF — recursion. Each call must shrink the problem, and a BASE CASE must stop the chain; without one, calls pile up until the stack overflows. You have heard the thing in the corner office.',
      'The factorial of n is n * (n-1) * ... * 1, and it is naturally recursive: n! = n * (n-1)!, stopping at 1. (0! is 1 too.)',
      'TASK: Define int fact(int n): return 1 when n <= 1 — the base case — else n * fact(n - 1). Read an int, print fact of it. 5 makes 120.',
    ],
    starter:
      '#include <stdio.h>\n\n// define int fact(int n) — base case first!\n\nint main() {\n    int x;\n    scanf("%d", &x);\n    // print fact(x) with %d\n\n    return 0;\n}\n',
    hints: [
      'Two paths inside fact: the base case that just returns 1, and the call that shrinks n.',
      'The base case is an if:  if (n <= 1) { return 1; }',
      'Then the self-call:  return n * fact(n - 1);',
    ],
    solution:
      '#include <stdio.h>\n\nint fact(int n) {\n    if (n <= 1) {\n        return 1;\n    }\n    return n * fact(n - 1);\n}\n\nint main() {\n    int x;\n    scanf("%d", &x);\n    printf("%d", fact(x));\n    return 0;\n}\n',
    expect: [
      { label: 'fact(5) = 120', stdin: '5', output: '120' },
      { label: 'fact(0) = 1 (base case)', stdin: '0', output: '1' },
      { label: 'fact(7) = 5040', stdin: '7', output: '5040' },
    ],
    require: [
      { label: 'defines fact(...)', pattern: /int\s+fact\s*\(/, hint: 'define it: int fact(int n) { ... }' },
      { label: 'has a base case', pattern: /if\s*\(/, hint: 'the base case is an if that returns WITHOUT calling again' },
      { label: 'shrinks toward the base', pattern: /fact\s*\(\s*n\s*-\s*1\s*\)/, hint: 'each call hands down a smaller job: fact(n - 1)' },
    ],
    terms: ['recursion', 'func', 'returnval', 'ifelse', 'params'],
    reward: { ramBonus: 2, scrap: 18 },
    doneFlag: 'done-ch3-recur',
  },
  {
    id: 'ch3-string',
    title: 'NAME TAG',
    floor: 3,
    teaches: "char arrays & '\\0'",
    brief: [
      "In C, a string IS an array of chars ending in the invisible '\\0' terminator: char s[50] holds up to 49 characters plus the '\\0'. scanf(\"%s\", s) fills it — no & needed, because an array's name is already an address.",
      "Loop with s[i] != '\\0' to walk the text to its end; chars compare like numbers: s[i] == 'E'.",
      'TASK: Read a word. Print LEN: and its length (count to the \'\\0\'), then on the next line E: and how many capital E letters it has. PERISHABLE: 10 and 2.',
    ],
    starter:
      '#include <stdio.h>\n\nint main() {\n    char s[50];\n    scanf("%s", s);\n    // count to the \'\\0\' for LEN,\n    // then count the \'E\' chars\n\n    return 0;\n}\n',
    hints: [
      "The length is a loop that stops at '\\0'. The E-count checks every char on the way.",
      "Length:  int len = 0; while (s[len] != '\\0') { len++; }",
      "Count matches inside a second loop:  if (s[i] == 'E') { count++; }",
    ],
    solution:
      '#include <stdio.h>\n\nint main() {\n    char s[50];\n    scanf("%s", s);\n    int len = 0;\n    while (s[len] != \'\\0\') {\n        len++;\n    }\n    printf("LEN: %d\\n", len);\n    int count = 0;\n    for (int i = 0; i < len; i++) {\n        if (s[i] == \'E\') {\n            count++;\n        }\n    }\n    printf("E: %d", count);\n    return 0;\n}\n',
    expect: [
      { label: 'PERISHABLE: 10 letters, 2 Es', stdin: 'PERISHABLE', output: 'LEN: 10\nE: 2' },
      { label: 'WES: 3 letters, 1 E', stdin: 'WES', output: 'LEN: 3\nE: 1' },
      { label: 'MOP: 3 letters, 0 Es', stdin: 'MOP', output: 'LEN: 3\nE: 0' },
    ],
    require: [
      { label: 'declares a char array', pattern: /char\s+\w+\s*\[/, hint: 'a C string is a char array: char s[50];' },
      { label: "stops at the '\\0' terminator", pattern: /'\\0'/, hint: "the text ends at '\\0': while (s[len] != '\\0')" },
    ],
    terms: ['charr', 'nullterm', 'index', 'char', 'whileloop', 'compare'],
    reward: { ramBonus: 2, scrap: 16 },
    doneFlag: 'done-ch3-string',
  },
  {
    id: 'ch3-struct',
    title: 'PERSONNEL FILE',
    floor: 3,
    teaches: 'structs — group your data',
    brief: [
      'A STRUCT bundles related variables into one type — a form with labeled boxes: struct Badge { char name[30]; int id; }; defines the form; struct Badge b; stamps one out. The dot reaches inside: b.name, b.id.',
      'Define the struct ABOVE main, like a function. Read into fields the usual way: &b.id for the int, plain b.name for the char array.',
      'TASK: Define struct Badge with a char name[30] and an int id. Read a name and an id into one Badge, then print exactly:  ID 7: WES  (for input WES 7).',
    ],
    starter:
      '#include <stdio.h>\n\n// struct Badge { char name[30]; int id; };\n\nint main() {\n    // declare a struct Badge, scanf its fields,\n    // print "ID " id ": " name\n\n    return 0;\n}\n',
    hints: [
      'The struct definition ends with a semicolon after its closing brace.',
      'Declare one and fill it:  struct Badge b;  then  scanf("%s %d", b.name, &b.id);',
      'Print the fields:  printf("ID %d: %s", b.id, b.name);',
    ],
    solution:
      '#include <stdio.h>\n\nstruct Badge {\n    char name[30];\n    int id;\n};\n\nint main() {\n    struct Badge b;\n    scanf("%s %d", b.name, &b.id);\n    printf("ID %d: %s", b.id, b.name);\n    return 0;\n}\n',
    expect: [
      { label: 'WES 7 files as ID 7: WES', stdin: 'WES 7', output: 'ID 7: WES' },
      { label: 'PRAM 12 files as ID 12: PRAM', stdin: 'PRAM 12', output: 'ID 12: PRAM' },
    ],
    require: [
      { label: 'defines struct Badge', pattern: /struct\s+Badge\s*\{/, hint: 'define the form: struct Badge { char name[30]; int id; };' },
      { label: 'reaches fields with the dot', pattern: /\w\s*\.\s*(name|id)/, hint: 'the dot reaches inside: b.name, b.id' },
    ],
    terms: ['structT', 'dot', 'charr', 'int', 'scanf', 'addressof'],
    reward: { ramBonus: 3, scrap: 22 },
    doneFlag: 'done-ch3-struct',
  },
]

export function challengeById(id: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id)
}
