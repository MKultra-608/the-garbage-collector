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
| 0 | Sub-basement (DONE) | main, cout/endl, variables, const, arithmetic (/ %), relational & logical ops | Flush, Increment, Branch Guard | — (elevator gate) |
| 1 | Mailroom | cin, if/else-if ladder, switch/case/default, char, a first whole program | `Switch Case` (multi-hit that picks per enemy) | MISLABEL — a package that lies about its type |
| 2 | Archives | while, for, nested loops, accumulators | `Loop Lash` (repeats X times, X = loop the player wrote) | OFF-BY-ONE — attacks on i <= n, one hit too many |
| 3 | Cubicle Maze (DONE) | arrays, 2D arrays, functions/params/return, strings as sequences, structs (Labs 6-11) | `Subroutine` (one heavy well-factored strike) | STACK OVERFLOW — recursion without a base case |
| 4 | IT Department | vectors, iterators, algorithms | `Batch Job` (hit all enemies — first multi-target) | SEGFAULT — attacks index[-1], punishable when it whiffs |
| 5 | HR | structs, classes, encapsulation, methods | `Union Rep` (summon a struct ally) | PRIVATE MEMBER — invulnerable until accessed via its public method |
| 6 | Accounting | pointers, references, nullptr — THE TWIST: there was never a GC | `Dereference` (bypass guard, hit the real HP) | NULL DEREF — crashes itself if baited correctly |
| 7 | Legal | new/delete, ownership, RAII | `Scope Bind` (damage-over-time that auto-releases) | DOUBLE FREE — hits itself when it re-deletes |
| 8 | Executive | inheritance, virtual, polymorphism | `Override` (copy the enemy's last move, improved) | THE BOARD — five enemies sharing a base class, each overriding one move |
| 9 | Server Penthouse | templates, STL (map/sort), smart pointers | `unique_ptr` (one-target guaranteed delete) | THE LEAK — final boss; grows every turn unless ownership is claimed |

## Chapter 0 (implemented) — challenge list

Remade 2026-07-10 around a C-fundamentals lab course (CS1160 Labs 1–2),
translated into the game's real-C++ dialect (cout/cin, not printf/scanf).

1. FIRST SHIFT — hello world, cout, semicolons, endl/two lines → Flush
2. CRATE MATH — variables, const, arithmetic (cube volume + surface) → Increment
3. LOAD BALANCE — int division truncates + % remainder, chained << → +2 max RAM
4. GATE LOGIC — relational ops as bools (print 1/0), && || ! → Branch Guard

## Chapter 1 (implemented) — challenge list

Remade 2026-07-10 around CS1160 Lab 3 (control statements).

1. INTAKE — cin reads a value, print it back labeled (no hardcoding) → +2 max RAM
2. CLIMATE CONTROL — if / else-if ladder (temperature classification) → +2 max RAM
3. SORTING CODE — switch/case/break/default on an int (4 routes) → Switch Case
4. POSTAGE CALC — calculator: cin >> op >> a >> b + switch on char (boss prep) → +3 max RAM
   Boss: MISLABEL, weak to Switch Case (weakness revealed by Scan).

## Chapter 2 (implemented) — challenge list

1. CLOCK OUT — while loop countdown (cin + n--) → +2 max RAM
2. SHELF SCAN — for loop counting up → Loop Lash
3. TALLY — accumulator (sum += i over a loop) → +2 max RAM
4. GRID FILE — nested loops printing an n×n block → +3 max RAM
   Boss: OFF-BY-ONE, weak to Loop Lash (correctly-counted 3-hit); Scan teaches
   the `i <= n` vs `i < n` off-by-one lesson.

## Chapter 3 (implemented) — challenge list

CS1160 Labs 6-11 in five challenges (2026-07-10). Every challenge lists
glossary `terms` — definitions + naming rationale — on the F1 GLOSSARY page.

1. BIN ROW — int arrays, fill + reverse print (Lab 6) → +2 max RAM
2. FLOOR PLAN — 2D array, nested-loop max (Lab 7) → +2 max RAM
3. DELEGATE — int average(a,b,c), define & call (Labs 8-9) → Subroutine
4. NAME TAG — string length + count a letter via s[i] (Lab 10) → +2 max RAM
5. PERSONNEL FILE — struct Badge, cin into fields, dot access (Lab 11) → +3 max RAM
   Boss: STACK OVERFLOW, weak to Subroutine (recursion-without-base-case lore).

## Interpreter support needed per floor

- F0: `const` declarations — DONE (must be initialized; assignment/++/cin into
  a const are teachable errors; see interp.ts + interp.test.ts).
- F1: `switch/case/default` statement — DONE (fall-through, break, default,
  char/int subjects; see interp.ts + interp.test.ts).
- F2: loops — DONE (while/for/break/continue already supported; challenge
  reference solutions covered in interp.test.ts + solutions.test.ts).
- F3: DONE — user-defined functions (call-by-value, recursion + stack-overflow
  depth error), 1D/2D arrays with bounds errors, string s[i]/.length()/.size(),
  structs with fields and copy semantics. All in interp.test.ts.
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
