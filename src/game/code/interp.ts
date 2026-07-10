/**
 * A miniature C++ interpreter, sized for the beginner subset the game
 * teaches (chapters 0-3): int/double/bool/char/std::string variables,
 * arithmetic, cout/cin, if/else, while, for, blocks, break/continue.
 *
 * It exists so challenges can genuinely RUN the player's program and check
 * its output instead of regex-matching source text. It is intentionally not
 * a full compiler: no user-defined functions, arrays, pointers or classes
 * yet — those chapters should extend this file (see docs/ROADMAP.md) or
 * swap in a WASM toolchain behind the same `runCpp` signature.
 */

export interface CppResult {
  output: string
  error?: string
}

// ------------------------------------------------------------------ lexer

type TokT = 'id' | 'num' | 'str' | 'chr' | 'op'
interface Tok {
  t: TokT
  v: string
  line: number
}

const MULTI_OPS = ['<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '::']
const SINGLE_OPS = '+-*/%=<>!(){};,&:'

class CppError extends Error {
  constructor(msg: string, readonly line: number) {
    super(msg)
  }
}

function lex(src: string): Tok[] {
  const toks: Tok[] = []
  let i = 0
  let line = 1
  const n = src.length
  while (i < n) {
    const c = src[i]
    if (c === '\n') {
      line++
      i++
      continue
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      i++
      continue
    }
    // preprocessor directives (#include etc.) — skip the whole line
    if (c === '#') {
      while (i < n && src[i] !== '\n') i++
      continue
    }
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      i += 2
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') line++
        i++
      }
      if (i >= n) throw new CppError('unterminated /* comment', line)
      i += 2
      continue
    }
    if (c === '"') {
      let s = ''
      i++
      while (i < n && src[i] !== '"') {
        if (src[i] === '\n') throw new CppError('string literal is missing its closing "', line)
        if (src[i] === '\\') {
          const e = src[i + 1]
          s += e === 'n' ? '\n' : e === 't' ? '\t' : e === '\\' ? '\\' : e === '"' ? '"' : e === "'" ? "'" : e === '0' ? '\0' : e
          i += 2
        } else {
          s += src[i]
          i++
        }
      }
      if (i >= n) throw new CppError('string literal is missing its closing "', line)
      i++
      toks.push({ t: 'str', v: s, line })
      continue
    }
    if (c === "'") {
      i++
      let ch = ''
      if (src[i] === '\\') {
        const e = src[i + 1]
        ch = e === 'n' ? '\n' : e === 't' ? '\t' : e === '\\' ? '\\' : e === "'" ? "'" : e === '0' ? '\0' : e
        i += 2
      } else {
        ch = src[i]
        i++
      }
      if (src[i] !== "'") throw new CppError("char literal is missing its closing '", line)
      i++
      toks.push({ t: 'chr', v: ch, line })
      continue
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let s = ''
      while (i < n && /[0-9.]/.test(src[i])) {
        s += src[i]
        i++
      }
      toks.push({ t: 'num', v: s, line })
      continue
    }
    if (/[A-Za-z_]/.test(c)) {
      let s = ''
      while (i < n && /[A-Za-z0-9_]/.test(src[i])) {
        s += src[i]
        i++
      }
      toks.push({ t: 'id', v: s, line })
      continue
    }
    const two = src.slice(i, i + 2)
    if (MULTI_OPS.includes(two)) {
      toks.push({ t: 'op', v: two, line })
      i += 2
      continue
    }
    if (SINGLE_OPS.includes(c)) {
      toks.push({ t: 'op', v: c, line })
      i++
      continue
    }
    throw new CppError(`unexpected character '${c}'`, line)
  }
  // Drop `using namespace std ;` and `std ::` prefixes so both spellings work.
  const out: Tok[] = []
  for (let j = 0; j < toks.length; j++) {
    const t = toks[j]
    if (
      t.t === 'id' && t.v === 'using' &&
      toks[j + 1]?.v === 'namespace' && toks[j + 2]?.v === 'std' && toks[j + 3]?.v === ';'
    ) {
      j += 3
      continue
    }
    if (t.t === 'id' && t.v === 'std' && toks[j + 1]?.v === '::') {
      j += 1
      continue
    }
    out.push(t)
  }
  return out
}

// ------------------------------------------------------------------ values

type CppType = 'int' | 'double' | 'bool' | 'char' | 'string'
interface Value {
  t: CppType
  v: number | boolean | string
  /** Declared const — reassignment is a (teachable) error. */
  ro?: boolean
}

const TYPE_WORDS = ['int', 'double', 'float', 'bool', 'char', 'string', 'long']

function isNumeric(v: Value): boolean {
  return v.t === 'int' || v.t === 'double' || v.t === 'bool' || v.t === 'char'
}

function asNum(v: Value): number {
  if (v.t === 'bool') return v.v ? 1 : 0
  if (v.t === 'char') return (v.v as string).charCodeAt(0) || 0
  return v.v as number
}

function fmt(v: Value): string {
  switch (v.t) {
    case 'bool':
      return v.v ? '1' : '0'
    case 'char':
    case 'string':
      return v.v as string
    case 'double': {
      // approximates std::cout default formatting (6 significant digits)
      const n = v.v as number
      return Number.isInteger(n) ? String(n) : String(parseFloat(n.toPrecision(6)))
    }
    default:
      return String(v.v)
  }
}

// ------------------------------------------------------------------ parser + evaluator (tree-walking, single pass)

const BREAK = Symbol('break')
const CONTINUE = Symbol('continue')
const RETURN = Symbol('return')

class Interp {
  private pos = 0
  private scopes: Map<string, Value>[] = [new Map()]
  private out = ''
  private stdin: string[]
  private steps = 0

  constructor(private toks: Tok[], stdin: string) {
    this.stdin = stdin.trim() === '' ? [] : stdin.trim().split(/\s+/)
  }

  // -- token helpers
  private peek(o = 0): Tok | undefined {
    return this.toks[this.pos + o]
  }
  private next(): Tok {
    const t = this.toks[this.pos++]
    if (!t) throw new CppError('unexpected end of program', this.toks[this.toks.length - 1]?.line ?? 1)
    return t
  }
  private expect(v: string, hint?: string): Tok {
    const t = this.peek()
    if (!t || t.v !== v) {
      throw new CppError(hint ?? `expected '${v}'${t ? ` but found '${t.v}'` : ''}`, t?.line ?? this.lastLine())
    }
    return this.next()
  }
  private lastLine(): number {
    return this.toks[Math.min(this.pos, this.toks.length - 1)]?.line ?? 1
  }
  private budget(): void {
    if (++this.steps > 200_000) throw new CppError('program ran too long — infinite loop?', this.lastLine())
  }

  // -- scopes
  private lookup(name: string, line: number): Value {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const v = this.scopes[i].get(name)
      if (v) return v
    }
    throw new CppError(`'${name}' was not declared`, line)
  }
  private declare(name: string, val: Value, line: number): void {
    const top = this.scopes[this.scopes.length - 1]
    if (top.has(name)) throw new CppError(`'${name}' is already declared in this scope`, line)
    top.set(name, val)
  }

  run(): string {
    // locate `int main ( ... ) {`
    let i = 0
    while (i < this.toks.length) {
      if (this.toks[i].v === 'int' && this.toks[i + 1]?.v === 'main') break
      i++
    }
    if (i >= this.toks.length) {
      throw new CppError('no `int main()` found — every C++ program starts there', 1)
    }
    this.pos = i + 2
    this.expect('(', 'main needs parentheses: int main()')
    while (this.peek() && this.peek()!.v !== ')') this.next() // tolerate main(void) etc.
    this.expect(')')
    this.expect('{', 'main needs a body wrapped in { }')
    const sig = this.block()
    if (sig === BREAK || sig === CONTINUE) {
      throw new CppError('break/continue used outside a loop', this.lastLine())
    }
    return this.out
  }

  /** Parses+executes statements until the matching '}'. */
  private block(): symbol | undefined {
    this.scopes.push(new Map())
    try {
      while (true) {
        const t = this.peek()
        if (!t) throw new CppError("missing '}' — check your braces", this.lastLine())
        if (t.v === '}') {
          this.next()
          return undefined
        }
        const sig = this.statement()
        if (sig) {
          // unwind to the end of this block without executing the rest
          this.skipToBlockEnd()
          return sig
        }
      }
    } finally {
      this.scopes.pop()
    }
  }

  private skipToBlockEnd(): void {
    let depth = 0
    while (true) {
      const t = this.peek()
      if (!t) throw new CppError("missing '}' — check your braces", this.lastLine())
      if (t.v === '{') depth++
      if (t.v === '}') {
        if (depth === 0) {
          this.next()
          return
        }
        depth--
      }
      this.next()
    }
  }

  /** Skips a statement without executing (for untaken if/else branches, loop bodies). */
  private skipStatement(): void {
    const t = this.peek()
    if (!t) return
    if (t.v === '{') {
      this.next()
      this.skipToBlockEnd()
      return
    }
    if (t.v === 'if') {
      this.next()
      this.skipParens()
      this.skipStatement()
      if (this.peek()?.v === 'else') {
        this.next()
        this.skipStatement()
      }
      return
    }
    if (t.v === 'while' || t.v === 'for' || t.v === 'switch') {
      this.next()
      this.skipParens()
      this.skipStatement()
      return
    }
    while (true) {
      const x = this.peek()
      if (!x) throw new CppError("missing ';'", this.lastLine())
      this.next()
      if (x.v === ';') return
    }
  }

  private skipParens(): void {
    this.expect('(')
    let depth = 0
    while (true) {
      const t = this.next()
      if (t.v === '(') depth++
      if (t.v === ')') {
        if (depth === 0) return
        depth--
      }
    }
  }

  private statement(): symbol | undefined {
    this.budget()
    const t = this.peek()!
    if (t.v === '{') {
      this.next()
      return this.block()
    }
    if (t.v === ';') {
      this.next()
      return undefined
    }
    if (t.t === 'id') {
      switch (t.v) {
        case 'if':
          return this.ifStmt()
        case 'while':
          return this.whileStmt()
        case 'for':
          return this.forStmt()
        case 'switch':
          return this.switchStmt()
        case 'return': {
          this.next()
          if (this.peek()?.v !== ';') this.expression()
          this.expect(';', "return needs a ';'")
          return RETURN
        }
        case 'break':
          this.next()
          this.expect(';', "break needs a ';'")
          return BREAK
        case 'continue':
          this.next()
          this.expect(';', "continue needs a ';'")
          return CONTINUE
        case 'cout':
          this.coutStmt()
          return undefined
        case 'cin':
          this.cinStmt()
          return undefined
      }
      if (t.v === 'const' || TYPE_WORDS.includes(t.v)) {
        this.declStmt()
        return undefined
      }
    }
    this.expression()
    this.expect(';', `expected ';' after statement (line ${t.line})`)
    return undefined
  }

  private declStmt(): void {
    let ro = false
    if (this.peek()?.v === 'const') {
      this.next()
      ro = true
      const after = this.peek()
      if (!after || after.t !== 'id' || !TYPE_WORDS.includes(after.v)) {
        throw new CppError("'const' needs a type after it, like: const int SIZE = 10;", after?.line ?? this.lastLine())
      }
    }
    const typeTok = this.next()
    let type = typeTok.v as CppType | 'float' | 'long'
    if (type === 'float') type = 'double'
    if (type === 'long') type = 'int'
    while (true) {
      const nameTok = this.next()
      if (nameTok.t !== 'id') throw new CppError('expected a variable name here', nameTok.line)
      let val: Value
      if (this.peek()?.v === '=') {
        this.next()
        val = this.coerce(this.expression(), type, nameTok.line)
      } else {
        if (ro) {
          throw new CppError(`a const variable must be initialized: const ${type} ${nameTok.v} = ...;`, nameTok.line)
        }
        // uninitialized — C++ would give you garbage; we give you the lesson instead
        val =
          type === 'string' ? { t: 'string', v: '' }
          : type === 'char' ? { t: 'char', v: '\0' }
          : type === 'bool' ? { t: 'bool', v: false }
          : { t: type, v: 0 }
      }
      if (ro) val = { ...val, ro: true }
      this.declare(nameTok.v, val, nameTok.line)
      if (this.peek()?.v === ',') {
        this.next()
        continue
      }
      this.expect(';', `did you forget the ';' after declaring '${nameTok.v}'?`)
      return
    }
  }

  private coerce(v: Value, type: CppType, line: number): Value {
    if (type === 'string') {
      if (v.t === 'string') return v
      if (v.t === 'char') return { t: 'string', v: v.v as string }
      throw new CppError(`cannot store a ${v.t} in a std::string`, line)
    }
    if (v.t === 'string') throw new CppError(`cannot store a string in a ${type}`, line)
    const n = asNum(v)
    if (type === 'int') return { t: 'int', v: Math.trunc(n) }
    if (type === 'bool') return { t: 'bool', v: n !== 0 }
    if (type === 'char') return { t: 'char', v: v.t === 'char' ? (v.v as string) : String.fromCharCode(Math.trunc(n)) }
    return { t: 'double', v: n }
  }

  private ifStmt(): symbol | undefined {
    this.next()
    this.expect('(', 'if needs a condition in parentheses')
    const cond = asNum(this.expression()) !== 0
    this.expect(')')
    let sig: symbol | undefined
    if (cond) {
      sig = this.execStatement()
      if (this.peek()?.v === 'else') {
        this.next()
        this.skipStatement()
      }
    } else {
      this.skipStatement()
      if (this.peek()?.v === 'else') {
        this.next()
        sig = this.execStatement()
      }
    }
    return sig
  }

  /** Executes one statement (which may be a block). */
  private execStatement(): symbol | undefined {
    const t = this.peek()
    if (t?.v === '{') {
      this.next()
      return this.block()
    }
    return this.statement()
  }

  private whileStmt(): symbol | undefined {
    this.next()
    const condStart = this.pos
    while (true) {
      this.budget()
      this.pos = condStart
      this.expect('(', 'while needs a condition in parentheses')
      const cond = asNum(this.expression()) !== 0
      this.expect(')')
      if (!cond) {
        this.skipStatement()
        return undefined
      }
      const sig = this.execStatement()
      if (sig === BREAK) {
        this.pos = condStart
        this.expect('(')
        this.skipCondAndBody()
        return undefined
      }
      if (sig === RETURN) return RETURN
      // CONTINUE and normal completion both loop again
    }
  }

  /**
   * switch on an integral value with C-style fall-through, `break`, and an
   * optional `default`. Case labels must be constant expressions (literals),
   * which is all the beginner subset uses. Implemented in two passes over the
   * body tokens: locate the target label, then execute with fall-through.
   */
  private switchStmt(): symbol | undefined {
    const line = this.peek()!.line
    this.next() // switch
    this.expect('(', 'switch needs a value in parentheses, like switch (day)')
    const subject = asNum(this.expression())
    this.expect(')')
    this.expect('{', 'a switch body must be wrapped in { }')
    const bodyStart = this.pos

    // Pass 1: scan labels at brace-depth 0 to find the jump target + body end.
    let depth = 0
    let i = bodyStart
    let target = -1
    let defaultPos = -1
    while (i < this.toks.length) {
      const tk = this.toks[i]
      if (tk.v === '{') {
        depth++
        i++
        continue
      }
      if (tk.v === '}') {
        if (depth === 0) break
        depth--
        i++
        continue
      }
      if (depth === 0 && tk.t === 'id' && tk.v === 'case') {
        const save = this.pos
        this.pos = i + 1
        const cv = asNum(this.expression())
        this.expect(':', "a case label needs a ':' after its value")
        const afterColon = this.pos
        this.pos = save
        if (cv === subject && target === -1) target = afterColon
        i = afterColon
        continue
      }
      if (depth === 0 && tk.t === 'id' && tk.v === 'default') {
        if (this.toks[i + 1]?.v !== ':') throw new CppError("default needs a ':' after it", tk.line)
        defaultPos = i + 2
        i += 2
        continue
      }
      i++
    }
    if (i >= this.toks.length) throw new CppError("missing '}' to close the switch", line)
    const endPos = i // index of the switch's closing '}'

    const jump = target !== -1 ? target : defaultPos
    if (jump === -1) {
      this.pos = endPos + 1 // no matching case and no default: skip the whole switch
      return undefined
    }

    // Pass 2: execute from the jump point, falling through case labels.
    this.scopes.push(new Map())
    try {
      this.pos = jump
      while (this.pos < endPos) {
        this.budget()
        this.skipCaseLabels(endPos)
        if (this.pos >= endPos) break
        const sig = this.statement()
        if (sig === BREAK) break // break exits the switch, not any enclosing loop
        if (sig === CONTINUE || sig === RETURN) {
          this.pos = endPos + 1
          return sig // propagate to an enclosing loop / function
        }
      }
    } finally {
      this.scopes.pop()
    }
    this.pos = endPos + 1
    return undefined
  }

  /** Consumes any `case <const>:` / `default:` labels at the current position. */
  private skipCaseLabels(endPos: number): void {
    while (this.pos < endPos) {
      const tk = this.peek()
      if (tk?.t === 'id' && tk.v === 'case') {
        this.next()
        this.expression()
        this.expect(':', "a case label needs a ':' after its value")
      } else if (tk?.t === 'id' && tk.v === 'default') {
        this.next()
        this.expect(':', "default needs a ':' after it")
      } else {
        break
      }
    }
  }

  private skipCondAndBody(): void {
    let depth = 0
    while (true) {
      const t = this.next()
      if (t.v === '(') depth++
      if (t.v === ')') {
        if (depth === 0) break
        depth--
      }
    }
    this.skipStatement()
  }

  private forStmt(): symbol | undefined {
    this.next()
    this.expect('(', 'for needs ( init; condition; step )')
    this.scopes.push(new Map())
    try {
      // init
      if (this.peek()?.v !== ';') {
        const t = this.peek()!
        if (t.t === 'id' && TYPE_WORDS.includes(t.v)) this.declStmt()
        else {
          this.expression()
          this.expect(';')
        }
      } else this.next()
      const condStart = this.pos
      while (true) {
        this.budget()
        this.pos = condStart
        let cond = true
        if (this.peek()?.v !== ';') cond = asNum(this.expression()) !== 0
        this.expect(';')
        const stepStart = this.pos
        // skip step expr to reach body
        let d = 0
        while (true) {
          const t = this.peek()
          if (!t) throw new CppError('unterminated for(...)', this.lastLine())
          if (t.v === '(') d++
          if (t.v === ')') {
            if (d === 0) break
            d--
          }
          this.next()
        }
        this.expect(')')
        if (!cond) {
          this.skipStatement()
          return undefined
        }
        const sig = this.execStatement()
        if (sig === RETURN) return RETURN
        if (sig === BREAK) return undefined
        // run step
        const after = this.pos
        this.pos = stepStart
        if (this.peek()?.v !== ')') this.expression()
        this.pos = after
      }
    } finally {
      this.scopes.pop()
    }
  }

  private coutStmt(): void {
    this.next() // cout
    if (this.peek()?.v !== '<<') {
      throw new CppError("cout prints with '<<', like: cout << \"hi\";", this.lastLine())
    }
    while (this.peek()?.v === '<<') {
      this.next()
      const t = this.peek()
      if (t?.t === 'id' && (t.v === 'endl' || t.v === 'flush')) {
        this.next()
        if (t.v === 'endl') this.out += '\n'
        continue
      }
      this.out += fmt(this.expression())
    }
    this.expect(';', "did you forget the ';' after cout?")
  }

  private cinStmt(): void {
    this.next() // cin
    if (this.peek()?.v !== '>>') {
      throw new CppError("cin reads with '>>', like: cin >> x;", this.lastLine())
    }
    while (this.peek()?.v === '>>') {
      this.next()
      const nameTok = this.next()
      if (nameTok.t !== 'id') throw new CppError('cin needs a variable to read into', nameTok.line)
      const target = this.lookup(nameTok.v, nameTok.line)
      if (target.ro) throw new CppError(`'${nameTok.v}' is const — cin cannot overwrite it`, nameTok.line)
      const word = this.stdin.shift()
      if (word === undefined) {
        throw new CppError('the program asked for more input than was provided', nameTok.line)
      }
      if (target.t === 'string') target.v = word
      else if (target.t === 'char') target.v = word[0] ?? '\0'
      else if (target.t === 'bool') target.v = word !== '0'
      else if (target.t === 'int') target.v = Math.trunc(parseFloat(word) || 0)
      else target.v = parseFloat(word) || 0
    }
    this.expect(';', "did you forget the ';' after cin?")
  }

  // -- expressions (precedence climbing)

  /**
   * True when the upcoming token is the OPERATOR `v`. Checking the token type
   * matters: a char literal like '+' has the same text as the operator, and
   * must never be treated as one (e.g. `case '-':` is not a negation).
   */
  private opIs(...ops: string[]): boolean {
    const t = this.peek()
    return t?.t === 'op' && ops.includes(t.v)
  }

  private expression(): Value {
    return this.assign()
  }

  private assign(): Value {
    const t = this.peek()
    const t1 = this.peek(1)
    if (t?.t === 'id' && t1?.t === 'op' && ['=', '+=', '-=', '*=', '/=', '%='].includes(t1.v)) {
      const name = this.next().v
      const op = this.next().v
      const target = this.lookup(name, t.line)
      if (target.ro) throw new CppError(`'${name}' is const — its value cannot be changed`, t.line)
      const rhs = this.assign()
      if (op === '=') {
        const nv = this.coerce(rhs, target.t, t.line)
        target.v = nv.v
      } else {
        const combined = this.binOp(op[0], target, rhs, t.line)
        target.v = this.coerce(combined, target.t, t.line).v
      }
      return { ...target }
    }
    return this.or()
  }

  private or(): Value {
    let l = this.and()
    while (this.opIs('||')) {
      this.next()
      const r = this.and()
      l = { t: 'bool', v: asNum(l) !== 0 || asNum(r) !== 0 }
    }
    return l
  }

  private and(): Value {
    let l = this.equality()
    while (this.opIs('&&')) {
      this.next()
      const r = this.equality()
      l = { t: 'bool', v: asNum(l) !== 0 && asNum(r) !== 0 }
    }
    return l
  }

  private equality(): Value {
    let l = this.relational()
    while (this.opIs('==', '!=')) {
      const op = this.next().v
      const r = this.relational()
      const eq = l.t === 'string' || r.t === 'string' ? l.v === r.v : asNum(l) === asNum(r)
      l = { t: 'bool', v: op === '==' ? eq : !eq }
    }
    return l
  }

  private relational(): Value {
    let l = this.additive()
    while (this.opIs('<', '>', '<=', '>=')) {
      const opTok = this.next()
      const r = this.additive()
      let res: boolean
      if (l.t === 'string' && r.t === 'string') {
        const a = l.v as string
        const b = r.v as string
        res = opTok.v === '<' ? a < b : opTok.v === '>' ? a > b : opTok.v === '<=' ? a <= b : a >= b
      } else {
        const a = asNum(l)
        const b = asNum(r)
        res = opTok.v === '<' ? a < b : opTok.v === '>' ? a > b : opTok.v === '<=' ? a <= b : a >= b
      }
      l = { t: 'bool', v: res }
    }
    return l
  }

  private additive(): Value {
    let l = this.multiplicative()
    while (this.opIs('+', '-')) {
      const opTok = this.next()
      const r = this.multiplicative()
      l = this.binOp(opTok.v, l, r, opTok.line)
    }
    return l
  }

  private multiplicative(): Value {
    let l = this.unary()
    while (this.opIs('*', '/', '%')) {
      const opTok = this.next()
      const r = this.unary()
      l = this.binOp(opTok.v, l, r, opTok.line)
    }
    return l
  }

  private binOp(op: string, l: Value, r: Value, line: number): Value {
    if (op === '+' && (l.t === 'string' || r.t === 'string')) {
      if ((l.t === 'string' || l.t === 'char') && (r.t === 'string' || r.t === 'char')) {
        return { t: 'string', v: (l.v as string) + (r.v as string) }
      }
      throw new CppError('C++ cannot add a number to a string directly (hint: print them separately)', line)
    }
    if (!isNumeric(l) || !isNumeric(r)) {
      throw new CppError(`cannot apply '${op}' to these types`, line)
    }
    const a = asNum(l)
    const b = asNum(r)
    const bothInt = l.t !== 'double' && r.t !== 'double'
    switch (op) {
      case '+':
        return bothInt ? { t: 'int', v: a + b } : { t: 'double', v: a + b }
      case '-':
        return bothInt ? { t: 'int', v: a - b } : { t: 'double', v: a - b }
      case '*':
        return bothInt ? { t: 'int', v: a * b } : { t: 'double', v: a * b }
      case '/':
        if (b === 0) throw new CppError('division by zero', line)
        // THE beginner lesson: int / int truncates
        return bothInt ? { t: 'int', v: Math.trunc(a / b) } : { t: 'double', v: a / b }
      case '%':
        if (!bothInt) throw new CppError("'%' works on integers only", line)
        if (b === 0) throw new CppError('modulo by zero', line)
        return { t: 'int', v: a % b }
    }
    throw new CppError(`unknown operator '${op}'`, line)
  }

  private unary(): Value {
    const t = this.peek()
    if (this.opIs('-')) {
      this.next()
      const v = this.unary()
      return v.t === 'double' ? { t: 'double', v: -asNum(v) } : { t: 'int', v: -asNum(v) }
    }
    if (this.opIs('+')) {
      this.next()
      return this.unary()
    }
    if (this.opIs('!')) {
      this.next()
      return { t: 'bool', v: asNum(this.unary()) === 0 }
    }
    if (t && this.opIs('++', '--')) {
      this.next()
      const nameTok = this.next()
      if (nameTok.t !== 'id') throw new CppError(`'${t.v}' needs a variable`, t.line)
      const target = this.lookup(nameTok.v, nameTok.line)
      if (target.ro) throw new CppError(`'${nameTok.v}' is const — its value cannot be changed`, t.line)
      if (!isNumeric(target)) throw new CppError(`cannot ${t.v === '++' ? 'increment' : 'decrement'} a ${target.t}`, t.line)
      target.v = this.stepValue(target, t.v === '++' ? 1 : -1)
      return { ...target }
    }
    return this.postfix()
  }

  /** Adds `delta` to a numeric value, preserving its type (char stays char, bool stays bool). */
  private stepValue(target: Value, delta: number): number | boolean | string {
    const n = asNum(target) + delta
    if (target.t === 'char') return String.fromCharCode(((n % 256) + 256) % 256)
    if (target.t === 'bool') return n !== 0
    return target.t === 'double' ? n : Math.trunc(n)
  }

  private postfix(): Value {
    const v = this.primary()
    const t = this.peek()
    if (this.opIs('++', '--') && t && v.ref) {
      this.next()
      const old = { t: v.ref.t, v: v.ref.v }
      if (v.ref.ro) throw new CppError(`it is const — its value cannot be changed`, t.line)
      if (!isNumeric(v.ref)) throw new CppError(`cannot ${t.v === '++' ? 'increment' : 'decrement'} a ${v.ref.t}`, t.line)
      v.ref.v = this.stepValue(v.ref, t.v === '++' ? 1 : -1)
      return old
    }
    return v
  }

  private primary(): Value & { ref?: Value } {
    const t = this.next()
    if (t.t === 'num') {
      return t.v.includes('.') ? { t: 'double', v: parseFloat(t.v) } : { t: 'int', v: parseInt(t.v, 10) }
    }
    if (t.t === 'str') return { t: 'string', v: t.v }
    if (t.t === 'chr') return { t: 'char', v: t.v }
    if (t.v === '(') {
      const v = this.expression()
      this.expect(')')
      return v
    }
    if (t.t === 'id') {
      if (t.v === 'true') return { t: 'bool', v: true }
      if (t.v === 'false') return { t: 'bool', v: false }
      const ref = this.lookup(t.v, t.line)
      return { t: ref.t, v: ref.v, ref }
    }
    throw new CppError(`unexpected '${t.v}' in expression`, t.line)
  }
}

/** Compile & run a beginner C++ program. Never throws. */
export function runCpp(code: string, stdin = ''): CppResult {
  try {
    const toks = lex(code)
    const interp = new Interp(toks, stdin)
    return { output: interp.run() }
  } catch (e) {
    if (e instanceof CppError) {
      return { output: '', error: `line ${e.line}: ${e.message}` }
    }
    return { output: '', error: 'the compiler tripped over something it did not understand' }
  }
}
