/**
 * The glossary: every word and command the curriculum uses, defined once.
 * Each entry says WHAT it does and WHY it is called what it is called —
 * players should never have to take a magic word on faith. The curriculum
 * is C, taught the way the CS1160 labs teach it: every I/O function
 * (printf, scanf, gets, puts) is built on the stdio library that
 * `#include <stdio.h>` brings in.
 *
 * Challenges reference these by key (Challenge.terms); the editor's F1
 * overlay renders them on the GLOSSARY page. tests/solutions.test.ts fails
 * if a challenge references a key that does not exist here.
 */
export interface Term {
  /** The word / symbol as the player sees it in code. */
  t: string
  /** What it does + why it is named that. */
  d: string
}

export const GLOSSARY: Record<string, Term> = {
  include: {
    t: '#include <stdio.h>',
    d: 'Copies the STanDard Input/Output library — stdio — into your program before it builds. Every I/O function you use (printf, scanf, gets, puts) is built on this library; without this line the compiler has never heard of them. The # marks a preprocessor order: "include this file here".',
  },
  main: {
    t: 'int main()',
    d: 'The MAIN function — the entry point, named for being the principal routine: the system finds main and starts the program there. The int before it is the type of the value it hands back to the system when it ends.',
  },
  ret0: {
    t: 'return 0;',
    d: 'RETURNs a value to whoever called the function and ends it. main returns 0 to the operating system — the traditional code for "finished, no errors".',
  },
  semicolon: {
    t: ';',
    d: 'The statement terminator — a full stop for code. The compiler reads statements, not lines, so every statement must end with a ; or the compiler keeps reading into the next line.',
  },
  quotes: {
    t: '"double quotes"',
    d: 'Mark a string literal. Everything between them is DATA to show, not code to run — the quotes are the fence between your program and its text.',
  },
  printf: {
    t: 'printf()',
    d: '"PRINT Formatted" — the stdio library\'s printing function. It takes a format string and prints it, filling each % placeholder with the next value after the comma: printf("Year = %d", year);',
  },
  scanf: {
    t: 'scanf()',
    d: '"SCAN Formatted" — printf\'s twin from the stdio library, reading instead of writing. It scans what is typed and stores it into your variables: scanf("%d", &year); — note the &, because scanf needs to know WHERE the variable lives.',
  },
  fmtspec: {
    t: '%d %f %c %s',
    d: 'Format specifiers — the placeholders printf and scanf use, one letter per data type: %d = Decimal integer (also %i for Integer), %f = Floating-point, %c = Character, %s = String. %.2f means "float, 2 digits after the point". The % marks the slot; the letter says what fills it.',
  },
  escape: {
    t: '\\n  \\t',
    d: 'Escape sequences — characters you cannot type directly, "escaped" with a backslash: \\n is a New line (like pressing Enter), \\t is a Tab. printf("Hello\\n") prints Hello and ends the line.',
  },
  addressof: {
    t: '&',
    d: 'The ADDRESS-OF operator: &x means "the address where x lives in memory". scanf needs it to deliver the value into the right box — like writing the apartment number on a package. Arrays are the exception: an array\'s name is already its address, so no & is needed.',
  },
  getsputs: {
    t: 'gets / puts',
    d: '"GET String" and "PUT String" — the stdio library\'s line I/O: gets(name) reads a whole line (spaces included) into a char array; puts(name) prints a string and ends the line.',
  },
  varword: {
    t: 'variable',
    d: 'A named box in memory. Called a VARIABLE because what is inside can VARY while the program runs — unlike a const, which cannot.',
  },
  int: {
    t: 'int',
    d: 'Short for INTeger — a whole number, from the Latin integer, "whole, untouched". int bags = 3; makes a box named bags that can only ever hold whole numbers.',
  },
  assignop: {
    t: '=',
    d: 'The ASSIGNMENT operator: take the value on the right, put it into the box on the left. It is NOT "equals" — asking whether two things are equal is ==.',
  },
  const: {
    t: 'const',
    d: 'Short for CONSTant — the opposite of a variable: set once, then locked. The compiler refuses every later change, which protects values that must never drift (a size, a rate, PI).',
  },
  arith: {
    t: '+ - * /',
    d: 'The arithmetic operators. * means multiply (an x would look like a variable name). On two ints, / keeps only the whole part: 17 / 5 is 3 — the missing piece is what % is for.',
  },
  modulo: {
    t: '%',
    d: 'The MODULO operator — the remainder after whole-number division: 17 % 5 is 2. From the Latin modulus, "a small measure": it measures out fives and reports what is left over. (Inside a printf format string, % instead marks a placeholder — %% prints a real percent sign.)',
  },
  truth: {
    t: '1 and 0',
    d: 'C\'s true and false. A comparison produces exactly 1 (true) or 0 (false), stored in plain ints — printf("%d", a == 6) prints 1 or 0. In a condition, any nonzero value counts as true.',
  },
  compare: {
    t: '== != < <= >=',
    d: 'The comparison operators — each asks a question and answers 1 (true) or 0 (false). == asks "equal?" (doubled so it cannot be mistaken for = assignment); != means "not equal" — the ! is the NOT sign.',
  },
  and: {
    t: '&&',
    d: 'Logical AND — true only when BOTH sides are true. & is the ampersand, the "and" sign; it is doubled to tell it apart from the single & (address-of).',
  },
  or: {
    t: '||',
    d: 'Logical OR — true when EITHER side is true (or both). | is the pipe bar, doubled to match &&.',
  },
  not: {
    t: '!',
    d: 'Logical NOT — flips true to false and false to true. Programmers read ! aloud as "not": !(volts > amps) is "not (volts above amps)".',
  },
  ifelse: {
    t: 'if / else',
    d: 'Branching, named like plain English: IF the condition is true, run this block; or ELSE run that one. Exactly one of the two paths runs.',
  },
  elseif: {
    t: 'else if',
    d: 'A rung in a decision ladder. Each rung is only checked when every rung above it was false, so the FIRST true condition wins and the rest are skipped.',
  },
  switch: {
    t: 'switch',
    d: 'Routes ONE value to one of many outcomes — named after a railway switch, which routes a train onto a track. The value in switch ( ) is compared against each case label.',
  },
  case: {
    t: 'case',
    d: 'One "in case it equals THIS" label inside a switch. Case labels must be constants the compiler can see — plain numbers or single characters.',
  },
  break: {
    t: 'break',
    d: 'BREAKs out of the enclosing switch or loop at once. In a switch, forgetting break makes the code FALL THROUGH into the next case — a famous C gotcha that trips everyone once.',
  },
  default: {
    t: 'default',
    d: 'The route taken by DEFAULT when no case matched — the safety net at the bottom of a switch.',
  },
  char: {
    t: 'char',
    d: 'Short for CHARacter — exactly one letter, digit, or symbol, written in \'single quotes\'. Under the hood a char is a small number (its ASCII code: \'A\' is 65, \'a\' is 97), which is why chars can be compared and switched on.',
  },
  charr: {
    t: 'char s[20]',
    d: 'A C string: an ARRAY of chars. There is no separate "string type" — text is a row of characters ending in the \'\\0\' terminator. char s[20] reserves 20 slots: up to 19 characters plus the \'\\0\'.',
  },
  nullterm: {
    t: "'\\0'",
    d: 'The NULL terminator — character code zero, the invisible mark at the end of every C string. It is how printf %s and your loops know where the text stops: while (s[i] != \'\\0\') walks a string to its end.',
  },
  compound: {
    t: '+= -= *= /=',
    d: 'Compound assignment: a += b means a = a + b — "grow a by b, keep it in a". The operator and the = are welded together so the box is named only once.',
  },
  increment: {
    t: '++ / --',
    d: 'INCREMENT and DECREMENT: change a value by exactly 1. i++ is short for i = i + 1 — the single most common line in loops.',
  },
  whileloop: {
    t: 'while',
    d: 'A loop named like English: repeat the body WHILE the condition stays true. Something inside must move the condition toward false, or the loop never ends.',
  },
  dowhile: {
    t: 'do ... while',
    d: 'A while loop with the test at the BOTTOM: DO the body first, then check WHILE the condition holds. Because the body runs before the first check, a do-while always runs at least once — even when the condition starts false.',
  },
  forloop: {
    t: 'for',
    d: 'A counting loop: run the body FOR each value of a counter. The header packs the whole plan in one line — for (start; keep-going test; step).',
  },
  array: {
    t: 'int a[5]',
    d: 'An ARRAY — the everyday word for an orderly lineup — of same-type boxes stored side by side. One name, many slots: a[0] is the first, a[4] the last of five. Counting starts at 0 because the index measures distance from the start.',
  },
  index: {
    t: '[ ]',
    d: 'The INDEX (subscript) operator: pick one element by its position number, the way a book\'s index points at a page. Valid indexes run 0 to size-1 — anything else is "out of bounds", past the end of the row.',
  },
  twod: {
    t: 'int m[2][3]',
    d: 'A 2D array — an array OF arrays, which makes a grid. m[row][col] picks the row first, then the column, like a seat number: row 1, seat 2.',
  },
  func: {
    t: 'function',
    d: 'A named block of code that does one job, borrowed from math\'s f(x). Define it once, CALL it by name anywhere — the cure for writing the same code twice. printf and scanf are functions too — ones the stdio library wrote for you.',
  },
  params: {
    t: 'parameters',
    d: 'The inputs a function declares between its parentheses. Each call copies its arguments into them — CALL BY VALUE — so the function works on copies and the caller\'s variables stay untouched.',
  },
  returnval: {
    t: 'return x;',
    d: 'The function\'s answer: RETURN hands the value back to the caller and ends the function. The function\'s declared type (int, float...) promises what kind of answer comes back.',
  },
  recursion: {
    t: 'recursion',
    d: 'A function calling ITSELF — from the Latin recurrere, "to run back". Each call must shrink the problem toward a BASE CASE that stops the chain; without one the calls pile up until the stack overflows.',
  },
  structT: {
    t: 'struct',
    d: 'Short for STRUCTure: one variable built out of named fields of different types — like a paper form with labeled boxes. Define the form once above main; declare filled-in copies with struct Name var;',
  },
  dot: {
    t: '. (member access)',
    d: 'The member access operator: reaches INTO a struct for one field. badge.name reads as "the name belonging to badge".',
  },
}
