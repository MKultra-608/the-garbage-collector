/**
 * The glossary: every word and command the curriculum uses, defined once.
 * Each entry says WHAT it does and WHY it is called what it is called —
 * players should never have to take a magic word on faith (and every I/O
 * word is traced back to the standard I/O library it is built on).
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
    t: '#include <iostream>',
    d: 'Copies the standard Input/Output STREAM library into your program before it builds. cout and cin are defined there — every print and read is built on this library (the C++ descendant of C\'s stdio). The # marks a preprocessor order: "include this file here".',
  },
  usingstd: {
    t: 'using namespace std',
    d: 'The standard library keeps its names (cout, cin, string, endl) inside a NAMESPACE called std — short for STanDard. This line means "I am using those names", so you can write cout instead of std::cout.',
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
  cout: {
    t: 'cout',
    d: '"Character OUTput" (say: see-out) — the output stream from the standard I/O library. It is called a stream because data flows through it like water, out to the screen.',
  },
  insertion: {
    t: '<<',
    d: 'The stream INSERTION operator: inserts the thing on its right into the stream on its left. The arrows point the way the data flows — toward cout, toward the screen.',
  },
  endl: {
    t: 'endl',
    d: '"END Line" — ends the current line (like pressing Enter) and flushes the stream: everything waiting is pushed out at once. The escape code \\n inside quotes makes the same line break.',
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
    d: 'The MODULO operator — the remainder after whole-number division: 17 % 5 is 2. From the Latin modulus, "a small measure": it measures out fives and reports what is left over.',
  },
  bool: {
    t: 'bool',
    d: 'A type with exactly two values: true and false. Named after George Boole, the mathematician who turned true/false reasoning into algebra. cout prints a bool as 1 (true) or 0 (false).',
  },
  compare: {
    t: '== != < <= >=',
    d: 'The comparison operators — each asks a question and answers with a bool. == asks "equal?" (doubled so it cannot be mistaken for = assignment); != means "not equal" — the ! is the NOT sign.',
  },
  and: {
    t: '&&',
    d: 'Logical AND — true only when BOTH sides are true. & is the ampersand, the "and" sign; it is doubled to mean whole-statement logic.',
  },
  or: {
    t: '||',
    d: 'Logical OR — true when EITHER side is true (or both). | is the pipe bar, doubled to match &&.',
  },
  not: {
    t: '!',
    d: 'Logical NOT — flips true to false and false to true. Programmers read ! aloud as "not": !(volts > amps) is "not (volts above amps)".',
  },
  cin: {
    t: 'cin',
    d: '"Character INput" (say: see-in) — the input stream from the same standard I/O library as cout. It carries whatever arrives from outside the program (here: the keyboard) into your variables.',
  },
  extraction: {
    t: '>>',
    d: 'The stream EXTRACTION operator: pulls the next value OUT of the input stream and stores it in your variable. The arrows point the way the data flows — from cin into the box.',
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
    d: 'BREAKs out of the enclosing switch or loop at once. In a switch, forgetting break makes the code FALL THROUGH into the next case — an inheritance from C that trips everyone once.',
  },
  default: {
    t: 'default',
    d: 'The route taken by DEFAULT when no case matched — the safety net at the bottom of a switch.',
  },
  char: {
    t: 'char',
    d: 'Short for CHARacter — exactly one letter, digit, or symbol, written in \'single quotes\'. Under the hood a char is a small number (its character code), which is why chars can be compared and switched on.',
  },
  stringT: {
    t: 'string',
    d: 'A STRING of characters threaded together like beads — text of any length. It lives in the standard library (#include <string>) and can be compared with == and joined with +.',
  },
  compound: {
    t: '+= -= *= /=',
    d: 'Compound assignment: a += b means a = a + b — "grow a by b, keep it in a". The operator and the = are welded together so the box is named only once.',
  },
  increment: {
    t: '++ / --',
    d: 'INCREMENT and DECREMENT: change a value by exactly 1. i++ is short for i = i + 1. The language C++ is named with this joke — "C, incremented".',
  },
  whileloop: {
    t: 'while',
    d: 'A loop named like English: repeat the body WHILE the condition stays true. Something inside must move the condition toward false, or the loop never ends.',
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
    d: 'A named block of code that does one job, borrowed from math\'s f(x). Define it once, CALL it by name anywhere — the cure for writing the same code twice.',
  },
  params: {
    t: 'parameters',
    d: 'The inputs a function declares between its parentheses. Each call copies its arguments into them — CALL BY VALUE — so the function works on copies and the caller\'s variables stay untouched.',
  },
  returnval: {
    t: 'return x;',
    d: 'The function\'s answer: RETURN hands the value back to the caller and ends the function. The function\'s declared type (int, double...) promises what kind of answer comes back.',
  },
  recursion: {
    t: 'recursion',
    d: 'A function calling ITSELF — from the Latin recurrere, "to run back". Each call must shrink the problem toward a BASE CASE that stops the chain; without one the calls pile up until the stack overflows.',
  },
  length: {
    t: '.length() / .size()',
    d: 'Ask a string how many characters it holds. Two names for the same answer: length() is natural for text, size() matches every other container in the standard library.',
  },
  structT: {
    t: 'struct',
    d: 'Short for STRUCTure: one variable built out of named fields of different types — like a paper form with labeled boxes. Define the form once; every variable of it is a filled-in copy.',
  },
  dot: {
    t: '. (member access)',
    d: 'The member access operator: reaches INTO a struct for one field. badge.name reads as "the name belonging to badge".',
  },
}
