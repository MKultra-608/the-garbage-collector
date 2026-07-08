# Curriculum — C++ from novice to proficient hobbyist

Ten floors, ten chapters. Each floor teaches one cluster of concepts through
terminal challenges, reinforces it through enemy design and scan-text, and
crowns it with an ability that IS the concept. The interpreter
(`src/game/code/interp.ts`) must support each chapter's subset before its
challenges are authored — extend it test-first (`tests/interp.test.ts`).

Pedagogy rules:
- Teach BEFORE asking. Briefs explain the concept in plain words; challenges
  ask for one small step past what was just shown.
- Grade behavior (run the code) over syntax (regex). Use `variants` to defeat
  hardcoded answers.
- Error messages must teach ("did you forget the ';'?"), never scold.
- Each chapter's boss embodies a misuse of its concept.

| Floor | Zone | Concepts | Ability unlocked | Boss (concept misused) |
|---|---|---|---|---|
| 0 | Sub-basement (DONE) | main, cout, variables, int/string, arithmetic, if/else | Flush, Increment, Branch Guard | — (elevator gate) |
| 1 | Mailroom | cin, strings, comparison, switch | `Switch Case` (multi-hit that picks per enemy) | MISLABEL — a package that lies about its type |
| 2 | Archives | while, for, nested loops, accumulators | `Loop Lash` (repeats X times, X = loop the player wrote) | OFF-BY-ONE — attacks on i <= n, one hit too many |
| 3 | Cubicle Maze | functions, parameters, return, scope | `Subroutine` (store a combo, replay it) | STACK OVERFLOW — recursion without a base case |
| 4 | IT Department | arrays, vectors, indexing, iteration | `Batch Job` (hit all enemies — first multi-target) | SEGFAULT — attacks index[-1], punishable when it whiffs |
| 5 | HR | structs, classes, encapsulation, methods | `Union Rep` (summon a struct ally) | PRIVATE MEMBER — invulnerable until accessed via its public method |
| 6 | Accounting | pointers, references, nullptr — THE TWIST: there was never a GC | `Dereference` (bypass guard, hit the real HP) | NULL DEREF — crashes itself if baited correctly |
| 7 | Legal | new/delete, ownership, RAII | `Scope Bind` (damage-over-time that auto-releases) | DOUBLE FREE — hits itself when it re-deletes |
| 8 | Executive | inheritance, virtual, polymorphism | `Override` (copy the enemy's last move, improved) | THE BOARD — five enemies sharing a base class, each overriding one move |
| 9 | Server Penthouse | templates, STL (map/sort), smart pointers | `unique_ptr` (one-target guaranteed delete) | THE LEAK — final boss; grows every turn unless ownership is claimed |

## Chapter 0 (implemented) — challenge list

1. FIRST SHIFT — hello world, cout, semicolons → Flush
2. SUPPLY COUNT — int variables, arithmetic, no hardcoding → Increment
3. LABEL MAKER — std::string, chained << → +2 max RAM
4. KEYCARD CHECK — if/else with comparison, tested on 3 inputs → Branch Guard

## Chapter 1 (implemented) — challenge list

1. INTAKE — cin reads a value, print it back (no hardcoding) → +2 max RAM
2. SIGNATURE CHECK — string == comparison + if/else → +2 max RAM
3. SORTING CODE — switch/case/default on an int → Switch Case
4. MISLABELED — cin + switch on a char (boss prep) → +3 max RAM
   Boss: MISLABEL, weak to Switch Case (weakness revealed by Scan).

## Chapter 2 (implemented) — challenge list

1. CLOCK OUT — while loop countdown (cin + n--) → +2 max RAM
2. SHELF SCAN — for loop counting up → Loop Lash
3. TALLY — accumulator (sum += i over a loop) → +2 max RAM
4. GRID FILE — nested loops printing an n×n block → +3 max RAM
   Boss: OFF-BY-ONE, weak to Loop Lash (correctly-counted 3-hit); Scan teaches
   the `i <= n` vs `i < n` off-by-one lesson.

## Interpreter support needed per floor

- F1: `switch/case/default` statement — DONE (fall-through, break, default,
  char/int subjects; see interp.ts + interp.test.ts).
- F2: loops — DONE (while/for/break/continue already supported; challenge
  reference solutions covered in interp.test.ts + solutions.test.ts).
- F3: user-defined functions (major interp work: function tables, call stack).
- F4: `int a[N]`, `vector<int>`, `.size()`, `.push_back()`, indexing + bounds
  errors as teachable messages.
- F5: struct/class with fields + methods, public/private.
- F6: pointers `int*`, `&x`, `*p`, nullptr — model addresses as ids; dangling
  and null derefs produce in-fiction crash lessons.
- F7: new/delete with a visible "heap" the player can leak (UI: heap meter).
- F8: virtual dispatch.
- F9: templates can be shallow (grade usage patterns + behavior); smart
  pointers modeled over the F7 heap.

By floor 9 a player has written: I/O, control flow, functions, containers,
classes, pointers, dynamic memory, polymorphism, and smart-pointer idioms —
a legitimate "proficient hobbyist" checklist.
