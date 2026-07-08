/**
 * Code challenges — the educational core. Players write REAL C++ at wall
 * terminals; the interpreter (game/code/interp.ts) runs it and the
 * validator grades behavior, not just syntax.
 *
 * Design rules for new challenges (see docs/CURRICULUM.md for the full arc):
 *  - `brief` teaches the concept in-fiction, in plain words, BEFORE asking.
 *  - Starter code should compile or fail in an instructive way.
 *  - Prefer `expect`/`variants` (behavior) over `require` (regex). Use
 *    `require` only to force the concept ("must use a loop"), and always
 *    give a `hint` that teaches.
 *  - Every challenge rewards something tangible: an ability, RAM, or scrap.
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
    teaches: 'cout — printing text',
    brief: [
      'Every C++ program starts at a function called main. The building only listens to programs that have one.',
      'To print text, stream it to cout with the << arrows. Text goes in "double quotes". Every statement ends with a semicolon ;',
      'TASK: Make the program print exactly:  MOP READY',
    ],
    starter: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // print MOP READY here\n\n    return 0;\n}\n',
    hints: [
      'The program has to print MOP READY. In C++ you print by streaming to cout.',
      'Stream text to cout with <<, and wrap the words in "double quotes".',
      'End the statement with a semicolon. The whole line is:  cout << "MOP READY";',
    ],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "MOP READY";\n    return 0;\n}\n',
    expect: [{ output: 'MOP READY' }],
    require: [
      {
        label: 'uses cout',
        pattern: /cout\s*<</,
        hint: 'stream the text to cout, like: cout << "MOP READY";',
      },
    ],
    reward: { ability: 'flush', scrap: 5 },
    doneFlag: 'done-ch0-hello',
  },
  {
    id: 'ch0-vars',
    title: 'SUPPLY COUNT',
    floor: 0,
    teaches: 'int variables & arithmetic',
    brief: [
      'A variable is a labeled box. `int bags = 3;` makes a box named bags that holds a whole number, 3.',
      'Boxes can be combined: `bags + mops` is their sum. You can print numbers with cout exactly like text — no quotes.',
      'TASK: Declare int bags = 3 and int mops = 2, then print their sum (just the number).',
    ],
    starter: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // declare bags and mops, then print bags + mops\n\n    return 0;\n}\n',
    hints: [
      'Make two int boxes, then print their sum. Print the sum itself, not the number 5.',
      'Declare them like this:  int bags = 3;  and on the next line  int mops = 2;',
      'Print the expression with no quotes:  cout << bags + mops;',
    ],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int bags = 3;\n    int mops = 2;\n    cout << bags + mops;\n    return 0;\n}\n',
    expect: [{ output: '5' }],
    variants: [
      {
        label: 'works when bags = 7 (no hardcoding the 5!)',
        replace: ['= 3', '= 7'],
        output: '9',
      },
    ],
    require: [
      {
        label: 'declares an int named bags',
        pattern: /int\s+bags\s*=/,
        hint: 'declare it like: int bags = 3;',
      },
      {
        label: 'declares an int named mops',
        pattern: /int\s+mops\s*=/,
        hint: 'declare it like: int mops = 2;',
      },
    ],
    forbid: [
      {
        label: 'does not print a hardcoded 5',
        pattern: /<<\s*"?5"?\s*;/,
        hint: 'print the expression bags + mops, not the number 5',
      },
    ],
    reward: { ability: 'increment', scrap: 5 },
    doneFlag: 'done-ch0-vars',
  },
  {
    id: 'ch0-strings',
    title: 'LABEL MAKER',
    floor: 0,
    teaches: 'std::string & chained <<',
    brief: [
      'Text lives in a type called string. `string crew = "WES";` stores text in a box, just like int stored a number.',
      'You can chain << to print several things in a row: cout << "A" << "B"; prints AB.',
      'TASK: Declare string crew = "WES" and print exactly:  CREW: WES  (using the variable, not by retyping WES in the output).',
    ],
    starter:
      '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string crew = "WES";\n    // print CREW: followed by the crew variable\n\n    return 0;\n}\n',
    hints: [
      'Print the label text first, then the crew variable. Do not retype WES in the output.',
      'Chain << to print several things in one line: cout << "A" << someVariable;',
      'The mind the space after the colon:  cout << "CREW: " << crew;',
    ],
    solution:
      '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string crew = "WES";\n    cout << "CREW: " << crew;\n    return 0;\n}\n',
    expect: [{ output: 'CREW: WES' }],
    variants: [
      {
        label: 'works when the crew is "MOP2" (use the variable!)',
        replace: ['"WES"', '"MOP2"'],
        output: 'CREW: MOP2',
      },
    ],
    reward: { ramBonus: 2, scrap: 5 },
    doneFlag: 'done-ch0-strings',
  },
  {
    id: 'ch0-if',
    title: 'KEYCARD CHECK',
    floor: 0,
    teaches: 'if / else branching',
    brief: [
      'Programs make decisions with if. `if (clearance >= 2) { ... }` runs the braced code only when the condition is true.',
      'Add an else block for what happens otherwise. Conditions compare with >= > == != < <=.',
      'TASK: If clearance is 2 or more, print ACCESS. Otherwise print DENIED. The starter sets clearance = 2 — but your code must also work for other values.',
    ],
    starter:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int clearance = 2;\n    // print ACCESS if clearance >= 2, otherwise DENIED\n\n    return 0;\n}\n',
    hints: [
      'Choose between printing ACCESS and DENIED, based on the clearance value.',
      'Use if with a comparison, and else for the other case: if (clearance >= 2) { ... } else { ... }',
      'Put  cout << "ACCESS";  inside the if, and  cout << "DENIED";  inside the else.',
    ],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int clearance = 2;\n    if (clearance >= 2) {\n        cout << "ACCESS";\n    } else {\n        cout << "DENIED";\n    }\n    return 0;\n}\n',
    expect: [{ label: 'clearance 2 prints ACCESS', output: 'ACCESS' }],
    variants: [
      {
        label: 'clearance 0 prints DENIED',
        replace: ['= 2', '= 0'],
        output: 'DENIED',
      },
      {
        label: 'clearance 9 prints ACCESS',
        replace: ['= 2', '= 9'],
        output: 'ACCESS',
      },
    ],
    require: [
      {
        label: 'uses an if statement',
        pattern: /if\s*\(/,
        hint: 'decide with: if (clearance >= 2) { ... } else { ... }',
      },
    ],
    reward: { ability: 'guard', scrap: 10 },
    doneFlag: 'done-ch0-if',
  },

  // ------------------------------------------------------------- Floor 1
  {
    id: 'ch1-cin',
    title: 'INTAKE',
    floor: 1,
    teaches: 'cin — reading input',
    brief: [
      'So far your programs decided everything themselves. Real mail changes every night. To read a value the world gives you, use cin with the >> arrows: cin >> count; fills the box named count.',
      'The starter already reads an int called count. Your job is to report it.',
      'TASK: Print exactly:  PARCELS: count   (the number that was read in, not a fixed number).',
    ],
    starter:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int count;\n    cin >> count;\n    // print PARCELS: followed by count\n\n    return 0;\n}\n',
    hints: [
      'The value is already read into count for you. Print a label, then that variable.',
      'Combine text and a variable with <<:  cout << "PARCELS: " << count;',
      'Keep the  cin >> count;  line, then add the cout line under it.',
    ],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int count;\n    cin >> count;\n    cout << "PARCELS: " << count;\n    return 0;\n}\n',
    expect: [
      { label: 'reading 5 prints PARCELS: 5', stdin: '5', output: 'PARCELS: 5' },
      { label: 'reading 42 prints PARCELS: 42 (no hardcoding!)', stdin: '42', output: 'PARCELS: 42' },
    ],
    require: [
      { label: 'reads with cin', pattern: /cin\s*>>/, hint: 'keep the line: cin >> count;' },
      { label: 'prints with cout', pattern: /cout\s*<</, hint: 'print with: cout << "PARCELS: " << count;' },
    ],
    reward: { ramBonus: 2, scrap: 8 },
    doneFlag: 'done-ch1-cin',
  },
  {
    id: 'ch1-compare',
    title: 'SIGNATURE CHECK',
    floor: 1,
    teaches: 'string == comparison',
    brief: [
      'Two strings can be compared with == , which is true only when they match exactly. "PRAM" == "PRAM" is true; "pram" == "PRAM" is false (case matters).',
      'The starter reads a signature name for you.',
      'TASK: If the name equals PRAM, print SIGNED. Otherwise print REFUSED.',
    ],
    starter:
      '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name;\n    cin >> name;\n    // print SIGNED if name == "PRAM", otherwise REFUSED\n\n    return 0;\n}\n',
    hints: [
      'Decide between SIGNED and REFUSED by comparing name to the text "PRAM".',
      'Compare two strings with ==:  if (name == "PRAM") { ... } else { ... }',
      'Print SIGNED inside the if, REFUSED inside the else.',
    ],
    solution:
      '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name;\n    cin >> name;\n    if (name == "PRAM") {\n        cout << "SIGNED";\n    } else {\n        cout << "REFUSED";\n    }\n    return 0;\n}\n',
    expect: [
      { label: 'PRAM is SIGNED', stdin: 'PRAM', output: 'SIGNED' },
      { label: 'anyone else is REFUSED', stdin: 'WES', output: 'REFUSED' },
    ],
    require: [
      { label: 'compares with ==', pattern: /==/, hint: 'check equality with: if (name == "PRAM")' },
      { label: 'uses an if', pattern: /if\s*\(/, hint: 'decide with an if / else' },
    ],
    reward: { ramBonus: 2, scrap: 10 },
    doneFlag: 'done-ch1-compare',
  },
  {
    id: 'ch1-switch',
    title: 'SORTING CODE',
    floor: 1,
    teaches: 'switch / case / default',
    brief: [
      'A long if/else-if chain that checks one value against many options is easier to write as a switch. switch (bin) jumps to the matching case, runs it until break, and default catches everything else.',
      'Skeleton:  switch (bin) { case 1: cout << "..."; break; default: cout << "..."; }',
      'TASK: Read int bin. Print PAPER for 1, PLASTIC for 2, and LANDFILL for anything else. Remember break after each case.',
    ],
    starter:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int bin;\n    cin >> bin;\n    switch (bin) {\n        // case 1: print PAPER; break;\n        // case 2: print PLASTIC; break;\n        // default: print LANDFILL;\n    }\n    return 0;\n}\n',
    hints: [
      'Route bin to one of three outputs: PAPER (1), PLASTIC (2), or LANDFILL (anything else).',
      'Each case does its work then break; use default for the "anything else" path.',
      'case 1: cout << "PAPER"; break;   then case 2 similarly,   then default: cout << "LANDFILL";',
    ],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int bin;\n    cin >> bin;\n    switch (bin) {\n        case 1: cout << "PAPER"; break;\n        case 2: cout << "PLASTIC"; break;\n        default: cout << "LANDFILL";\n    }\n    return 0;\n}\n',
    expect: [
      { label: 'bin 1 -> PAPER', stdin: '1', output: 'PAPER' },
      { label: 'bin 2 -> PLASTIC', stdin: '2', output: 'PLASTIC' },
      { label: 'bin 7 -> LANDFILL', stdin: '7', output: 'LANDFILL' },
    ],
    require: [
      { label: 'uses a switch', pattern: /switch\s*\(/, hint: 'route the value with switch (bin) { ... }' },
      { label: 'has a default', pattern: /default\s*:/, hint: 'catch the rest with default:' },
    ],
    reward: { ability: 'switchcase', scrap: 12 },
    doneFlag: 'done-ch1-switch',
  },
  {
    id: 'ch1-combined',
    title: 'MISLABELED',
    floor: 1,
    teaches: 'cin + switch on a char',
    brief: [
      'The back dock is jammed with parcels whose type tags lie. You will sort them by their single-letter tag using everything you learned tonight: read input, then switch on it.',
      'A char holds one letter. switch works on a char too: case \'F\': ... You can compare the letter directly.',
      'TASK: Read a char tag. Print FRAGILE for F, PERISHABLE for P, and STANDARD for any other letter.',
    ],
    starter:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n    char tag;\n    cin >> tag;\n    // switch on tag: 'F' -> FRAGILE, 'P' -> PERISHABLE, default -> STANDARD\n\n    return 0;\n}\n",
    hints: [
      'Read the tag, then switch on it. A single letter goes in single quotes, like \'F\'.',
      "Match letters directly:  case 'F': cout << \"FRAGILE\"; break;",
      "Add case 'P' for PERISHABLE, then default: cout << \"STANDARD\"; for the rest.",
    ],
    solution:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n    char tag;\n    cin >> tag;\n    switch (tag) {\n        case 'F': cout << \"FRAGILE\"; break;\n        case 'P': cout << \"PERISHABLE\"; break;\n        default: cout << \"STANDARD\";\n    }\n    return 0;\n}\n",
    expect: [
      { label: "tag F -> FRAGILE", stdin: 'F', output: 'FRAGILE' },
      { label: "tag P -> PERISHABLE", stdin: 'P', output: 'PERISHABLE' },
      { label: "tag Z -> STANDARD", stdin: 'Z', output: 'STANDARD' },
    ],
    require: [
      { label: 'uses a switch', pattern: /switch\s*\(/, hint: 'switch (tag) { case \'F\': ... }' },
      { label: 'reads the tag', pattern: /cin\s*>>/, hint: 'keep: cin >> tag;' },
    ],
    reward: { ramBonus: 3, scrap: 18 },
    doneFlag: 'done-ch1-combined',
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
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // while n is above 0: print n and a space, then shrink n\n\n    return 0;\n}\n',
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
      'Do not forget to shrink n, or it loops forever:  cout << n << " "; n--;',
    ],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    while (n > 0) {\n        cout << n << " ";\n        n--;\n    }\n    return 0;\n}\n',
    reward: { ramBonus: 2, scrap: 10 },
    doneFlag: 'done-ch2-while',
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
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // for i from 1 to n: print i and a space\n\n    return 0;\n}\n',
    expect: [
      { label: 'n=4 lists shelves', stdin: '4', output: '1 2 3 4' },
      { label: 'n=1 lists one', stdin: '1', output: '1' },
      { label: 'n=6 lists six', stdin: '6', output: '1 2 3 4 5 6' },
    ],
    require: [{ label: 'uses a for loop', pattern: /for\s*\(/, hint: 'count up with: for (int i = 1; i <= n; i++) { ... }' }],
    hints: [
      'Count i from 1 up to n, printing each i followed by a space.',
      'The header is: for (int i = 1; i <= n; i++) { ... }',
      'Inside the loop body:  cout << i << " ";',
    ],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    for (int i = 1; i <= n; i++) {\n        cout << i << " ";\n    }\n    return 0;\n}\n',
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
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    int sum = 0;\n    // loop from 1 to n, adding each number into sum, then print sum\n\n    return 0;\n}\n',
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
      'After the loop finishes, print the total:  cout << sum;',
    ],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    int sum = 0;\n    for (int i = 1; i <= n; i++) {\n        sum += i;\n    }\n    cout << sum;\n    return 0;\n}\n',
    reward: { ramBonus: 2, scrap: 12 },
    doneFlag: 'done-ch2-accum',
  },
  {
    id: 'ch2-nested',
    title: 'GRID FILE',
    floor: 2,
    teaches: 'nested loops',
    brief: [
      'A loop inside a loop builds two dimensions. The outer loop makes rows; the inner loop fills each row. Print endl at the end of a row to drop to the next line.',
      'The starter reads an int n.',
      'TASK: Print an n-by-n block of # characters — n rows, each with n hashes. For n=3:  ###  ###  ### (three lines).',
    ],
    starter:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // outer loop for each row; inner loop prints n hashes; then endl\n\n    return 0;\n}\n',
    expect: [
      { label: 'n=3 makes a 3x3 block', stdin: '3', output: '###\n###\n###' },
      { label: 'n=2 makes a 2x2 block', stdin: '2', output: '##\n##' },
    ],
    require: [
      { label: 'has a loop inside a loop', pattern: /for[\s\S]*for|while[\s\S]*while|for[\s\S]*while|while[\s\S]*for/, hint: 'put one loop inside another: outer for rows, inner for hashes' },
      { label: 'ends each row', pattern: /endl|"\\n"|'\\n'/, hint: 'drop to the next line after each row with cout << endl;' },
    ],
    hints: [
      'Make rows with an outer loop; fill each row with an inner loop of hashes.',
      'Inner loop:  for (int c = 0; c < n; c++) cout << "#";',
      'After the inner loop, drop a line with  cout << endl;  then let the outer loop repeat.',
    ],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    for (int r = 0; r < n; r++) {\n        for (int c = 0; c < n; c++) {\n            cout << "#";\n        }\n        cout << endl;\n    }\n    return 0;\n}\n',
    reward: { ramBonus: 3, scrap: 20 },
    doneFlag: 'done-ch2-nested',
  },
]

export function challengeById(id: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id)
}
