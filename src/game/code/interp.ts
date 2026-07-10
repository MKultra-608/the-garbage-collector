/**
 * A miniature C++ interpreter, sized for the beginner subset the game
 * teaches (floors 0-3): int/double/bool/char/std::string variables, const,
 * arithmetic, cout/cin, if/else, switch, while, for, break/continue,
 * user-defined functions (call-by-value, recursion with a depth limit),
 * 1D/2D arrays with bounds checking, string indexing + .length()/.size(),
 * and structs with fields (value copy semantics).
 *
 * It exists so challenges can genuinely RUN the player's program and check
 * its output instead of regex-matching source text. It is intentionally not
 * a full compiler: no pointers, references, classes/methods, or templates
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
const SINGLE_OPS = '+-*/%=<>!(){};,&:[].'

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
/** Runtime value kinds: the scalar CppTypes plus aggregates. */
type VType = CppType | 'array' | 'struct'
interface Value {
  t: VType
  v: number | boolean | string
  /** Declared const — reassignment is a (teachable) error. */
  ro?: boolean
  /** array: the element Values (mutating them in place makes refs work). */
  elems?: Value[]
  /** array: what each element is ('array' again for 2D). */
  elemT?: VType
  /** struct: the struct type's name, and its field Values. */
  sname?: string
  fields?: Map<string, Value>
}

interface FnDef {
  ret: CppType | 'void'
  params: { type: CppType; name: string }[]
  /** Token index of the first statement inside the body (just after '{'). */
  body: number
  line: number
}

interface StructDef {
  fields: { type: CppType; name: string }[]
}

const TYPE_WORDS = ['int', 'double', 'float', 'bool', 'char', 'string', 'long']

function normType(w: string): CppType {
  if (w === 'float') return 'double'
  if (w === 'long') return 'int'
  return w as CppType
}

function zeroVal(type: CppType): Value {
  return type === 'string' ? { t: 'string', v: '' }
    : type === 'char' ? { t: 'char', v: '\0' }
    : type === 'bool' ? { t: 'bool', v: false }
    : { t: type, v: 0 }
}

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
  private fns = new Map<string, FnDef>()
  private structs = new Map<string, StructDef>()
  private callDepth = 0
  private retVal: Value | undefined

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

  /**
   * Collects top-level struct definitions and function definitions before the
   * program runs, so functions may be defined before OR after main (and
   * prototypes like `int f(int);` are tolerated and skipped).
   */
  private prepass(): void {
    const n = this.toks.length
    let i = 0
    while (i < n) {
      const t = this.toks[i]
      // struct Name { type field; ... };
      if (t.t === 'id' && t.v === 'struct' && this.toks[i + 1]?.t === 'id' && this.toks[i + 2]?.v === '{') {
        const name = this.toks[i + 1].v
        const fields: { type: CppType; name: string }[] = []
        let j = i + 3
        while (j < n && this.toks[j].v !== '}') {
          const ft = this.toks[j]
          if (ft.t === 'id' && TYPE_WORDS.includes(ft.v) && this.toks[j + 1]?.t === 'id') {
            fields.push({ type: normType(ft.v), name: this.toks[j + 1].v })
            j += 2
            while (j < n && this.toks[j].v !== ';') j++ // tolerate junk to the ';'
            j++
          } else {
            j++
          }
        }
        this.structs.set(name, { fields })
        i = j + 1 // past '}'
        if (this.toks[i]?.v === ';') i++
        continue
      }
      // ret-type name ( ... ) { body }   |   ret-type name ( ... ) ;  (prototype)
      if (
        t.t === 'id' && (TYPE_WORDS.includes(t.v) || t.v === 'void') &&
        this.toks[i + 1]?.t === 'id' && this.toks[i + 2]?.v === '('
      ) {
        const name = this.toks[i + 1].v
        let j = i + 3
        let d = 0
        while (j < n && !(this.toks[j].v === ')' && d === 0)) {
          if (this.toks[j].v === '(') d++
          if (this.toks[j].v === ')') d--
          j++
        }
        const after = this.toks[j + 1]
        if (after?.v === ';') {
          i = j + 2 // prototype — the definition will be picked up elsewhere
          continue
        }
        if (after?.v === '{') {
          if (name !== 'main') {
            const params: { type: CppType; name: string }[] = []
            let k = i + 3
            while (k < j) {
              const pt = this.toks[k]
              if (pt.t === 'id' && TYPE_WORDS.includes(pt.v) && this.toks[k + 1]?.t === 'id') {
                params.push({ type: normType(pt.v), name: this.toks[k + 1].v })
                k += 2
              } else {
                k++
              }
            }
            this.fns.set(name, {
              ret: t.v === 'void' ? 'void' : normType(t.v),
              params,
              body: j + 2,
              line: t.line,
            })
          }
          // skip the body
          let bd = 1
          let m = j + 2
          while (m < n && bd > 0) {
            if (this.toks[m].v === '{') bd++
            if (this.toks[m].v === '}') bd--
            m++
          }
          i = m
          continue
        }
      }
      i++
    }
  }

  run(): string {
    this.prepass()
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
          this.retVal = this.peek()?.v !== ';' ? this.expression() : undefined
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
      // struct variable declarations: `struct Badge b;` or C++-style `Badge b;`
      if (t.v === 'struct' && this.peek(1)?.t === 'id' && this.structs.has(this.peek(1)!.v)) {
        this.next() // 'struct'
        this.structDeclStmt()
        return undefined
      }
      if (this.structs.has(t.v) && this.peek(1)?.t === 'id') {
        this.structDeclStmt()
        return undefined
      }
      if (t.v === 'struct') {
        throw new CppError(
          'define the struct ABOVE main — struct Name { ... }; — then declare variables of it here',
          t.line,
        )
      }
    }
    this.expression()
    this.expect(';', `expected ';' after statement (line ${t.line})`)
    return undefined
  }

  private zeroStruct(sname: string, line: number): Value {
    const def = this.structs.get(sname)
    if (!def) throw new CppError(`unknown struct '${sname}'`, line)
    return { t: 'struct', v: 0, sname, fields: new Map(def.fields.map((f) => [f.name, zeroVal(f.type)])) }
  }

  /** Copies the fields of struct `src` into `dst` in place (value semantics). */
  private copyStructInto(dst: Value, src: Value, line: number): void {
    if (src.t !== 'struct' || src.sname !== dst.sname) {
      throw new CppError(`can only assign another ${dst.sname} here`, line)
    }
    for (const [k, f] of dst.fields!) {
      const s = src.fields!.get(k)!
      f.v = s.v
    }
  }

  private structDeclStmt(): void {
    const typeTok = this.next() // struct type name
    while (true) {
      const nameTok = this.next()
      if (nameTok.t !== 'id') throw new CppError('expected a variable name here', nameTok.line)
      const val = this.zeroStruct(typeTok.v, nameTok.line)
      if (this.peek()?.v === '=') {
        this.next()
        this.copyStructInto(val, this.expression(), nameTok.line)
      }
      this.declare(nameTok.v, val, nameTok.line)
      if (this.peek()?.v === ',') {
        this.next()
        continue
      }
      this.expect(';', `did you forget the ';' after declaring '${nameTok.v}'?`)
      return
    }
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
      if (this.peek()?.v === '[') {
        // array declaration: int a[5]; int a[] = {..}; int m[2][3]; ...
        if (ro) throw new CppError('const arrays are not supported here — use a plain array', nameTok.line)
        val = this.arrayDecl(type as CppType, nameTok.line)
      } else if (this.peek()?.v === '=') {
        this.next()
        val = this.coerce(this.expression(), type, nameTok.line)
      } else {
        if (ro) {
          throw new CppError(`a const variable must be initialized: const ${type} ${nameTok.v} = ...;`, nameTok.line)
        }
        // uninitialized — C++ would give you garbage; we give you the lesson instead
        val = zeroVal(type as CppType)
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

  /** Parses `[dims]...` (+ optional `= {init}`) after an array's name. */
  private arrayDecl(elemType: CppType, line: number): Value {
    const dims: number[] = []
    while (this.peek()?.v === '[') {
      this.next()
      if (this.peek()?.v === ']') {
        dims.push(-1) // size to be inferred from the init list
        this.next()
      } else {
        const sz = Math.trunc(asNum(this.expression()))
        if (sz <= 0) throw new CppError('an array size must be a positive number', line)
        if (sz > 10_000) throw new CppError('that array is far too big for this terminal', line)
        this.expect(']', "an array size needs its closing ']'")
        dims.push(sz)
      }
    }
    if (dims.length > 2) throw new CppError('only 1D and 2D arrays are supported here', line)
    let init: Value | null = null
    if (this.peek()?.v === '=') {
      this.next()
      init = this.parseInitList(elemType, dims, 0, line)
    }
    if (init) return init
    if (dims.includes(-1)) {
      throw new CppError('int a[] needs an init list to know its size: int a[] = {1, 2};', line)
    }
    return this.makeArray(elemType, dims)
  }

  private makeArray(elemType: CppType, dims: number[]): Value {
    if (dims.length === 1) {
      return { t: 'array', v: 0, elemT: elemType, elems: Array.from({ length: dims[0] }, () => zeroVal(elemType)) }
    }
    return {
      t: 'array', v: 0, elemT: 'array',
      elems: Array.from({ length: dims[0] }, () => this.makeArray(elemType, dims.slice(1))),
    }
  }

  /** Parses `{a, b, ...}` (or nested `{{..},{..}}`) into an array Value. */
  private parseInitList(elemType: CppType, dims: number[], depth: number, line: number): Value {
    this.expect('{', 'an array init list starts with {')
    const items: Value[] = []
    const nested = depth + 1 < dims.length
    while (this.peek()?.v !== '}') {
      if (nested) items.push(this.parseInitList(elemType, dims, depth + 1, line))
      else items.push(this.coerce(this.expression(), elemType, line))
      if (this.peek()?.v === ',') this.next()
      else break
    }
    this.expect('}', "an init list needs its closing '}'")
    const want = dims[depth]
    if (want !== -1 && items.length > want) {
      throw new CppError(`too many initializers — the array only holds ${want}`, line)
    }
    const size = want === -1 ? items.length : want
    while (items.length < size) {
      items.push(nested ? this.makeArray(elemType, dims.slice(depth + 1)) : zeroVal(elemType))
    }
    return { t: 'array', v: 0, elemT: nested ? 'array' : elemType, elems: items }
  }

  private coerce(v: Value, type: CppType, line: number): Value {
    if (v.t === 'array' || v.t === 'struct') {
      throw new CppError(`cannot store a whole ${v.t} in a ${type}`, line)
    }
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

  /** Runs a user-defined function body with its own scope stack. */
  private callFn(name: string, args: Value[], line: number): Value {
    const fn = this.fns.get(name)!
    if (args.length !== fn.params.length) {
      throw new CppError(`${name} takes ${fn.params.length} argument(s), but got ${args.length}`, line)
    }
    if (++this.callDepth > 48) {
      this.callDepth = 0
      throw new CppError(`stack overflow — ${name} keeps calling itself with no base case to stop it`, line)
    }
    // call by value: each parameter is a fresh copy of its argument
    const frame = new Map<string, Value>()
    fn.params.forEach((p, i) => frame.set(p.name, this.coerce(args[i], p.type, line)))
    const savedScopes = this.scopes
    const savedPos = this.pos
    const savedRet = this.retVal
    this.scopes = [frame]
    this.pos = fn.body
    this.retVal = undefined
    this.block()
    const rv = this.retVal
    this.scopes = savedScopes
    this.pos = savedPos
    this.retVal = savedRet
    this.callDepth--
    if (fn.ret === 'void') return { t: 'int', v: 0 } // never printed; calls used as statements
    if (rv === undefined) return zeroVal(fn.ret) // fell off the end without return — be gentle
    return this.coerce(rv, fn.ret, line)
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
      const val = this.expression()
      if (val.t === 'array') {
        throw new CppError('cannot print a whole array — print its elements one at a time', this.lastLine())
      }
      if (val.t === 'struct') {
        throw new CppError('cannot print a whole struct — print its fields one at a time', this.lastLine())
      }
      this.out += fmt(val)
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
      const nameTok = this.peek()
      if (!nameTok || nameTok.t !== 'id') {
        throw new CppError('cin needs a variable to read into', nameTok?.line ?? this.lastLine())
      }
      const tgt = this.tryChainTarget() // handles x, a[i], m[i][j], b.field, s[i]
      if (!tgt) throw new CppError('cin cannot read into that', nameTok.line)
      if ('ref' in tgt) {
        if (tgt.ref.ro) throw new CppError(`'${nameTok.v}' is const — cin cannot overwrite it`, nameTok.line)
        if (tgt.ref.t === 'array' || tgt.ref.t === 'struct') {
          throw new CppError(`cin cannot read a whole ${tgt.ref.t} — read one element at a time`, nameTok.line)
        }
      }
      const word = this.stdin.shift()
      if (word === undefined) {
        throw new CppError('the program asked for more input than was provided', nameTok.line)
      }
      if ('strOwner' in tgt) {
        const s = tgt.strOwner.v as string
        tgt.strOwner.v = s.slice(0, tgt.idx) + (word[0] ?? '\0') + s.slice(tgt.idx + 1)
        continue
      }
      const target = tgt.ref
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
    const ASSIGN_OPS = ['=', '+=', '-=', '*=', '/=', '%=']
    const t = this.peek()
    const t1 = this.peek(1)
    // fast path: a bare variable name being assigned
    if (t?.t === 'id' && t1?.t === 'op' && ASSIGN_OPS.includes(t1.v)) {
      const name = this.next().v
      const op = this.next().v
      const target = this.lookup(name, t.line)
      return this.assignInto(target, op, name, t.line)
    }
    // chained target: a[i] = ..., m[i][j] = ..., b.field = ..., s[i] = 'c'
    if (t?.t === 'id' && t1?.t === 'op' && (t1.v === '[' || t1.v === '.')) {
      const save = this.pos
      const tgt = this.tryChainTarget()
      if (tgt) {
        const opTok = this.peek()
        if (opTok?.t === 'op' && ASSIGN_OPS.includes(opTok.v)) {
          this.next()
          if ('strOwner' in tgt) {
            if (opTok.v !== '=') throw new CppError("a string character only supports plain '='", t.line)
            const ch = this.coerce(this.assign(), 'char', t.line)
            const s = tgt.strOwner.v as string
            tgt.strOwner.v = s.slice(0, tgt.idx) + (ch.v as string) + s.slice(tgt.idx + 1)
            return { t: 'char', v: ch.v }
          }
          return this.assignInto(tgt.ref, opTok.v, t.v, t.line)
        }
      }
      this.pos = save // it was a read, not an assignment — reparse as an expression
    }
    return this.or()
  }

  /** Applies `target op= rhs`, with const/aggregate guards. */
  private assignInto(target: Value, op: string, name: string, line: number): Value {
    if (target.ro) throw new CppError(`'${name}' is const — its value cannot be changed`, line)
    const rhs = this.assign()
    if (target.t === 'struct') {
      if (op !== '=') throw new CppError(`structs only support plain '='`, line)
      this.copyStructInto(target, rhs, line)
      return { ...target }
    }
    if (target.t === 'array') {
      throw new CppError('cannot assign a whole array — assign one element, like a[0] = ...', line)
    }
    if (op === '=') {
      target.v = this.coerce(rhs, target.t, line).v
    } else {
      const combined = this.binOp(op[0], target, rhs, line)
      target.v = this.coerce(combined, target.t, line).v
    }
    return { ...target }
  }

  /**
   * Parses `name ([idx] | .field)*` and resolves it to an assignable place.
   * Returns null when the chain turns out not to be assignable (e.g. a
   * method call like .length()) — the caller restores position and reparses.
   */
  private tryChainTarget(): { ref: Value } | { strOwner: Value; idx: number } | null {
    const idTok = this.next()
    let cur = this.lookup(idTok.v, idTok.line)
    while (true) {
      const t = this.peek()
      if (t?.t === 'op' && t.v === '[') {
        this.next()
        const idx = Math.trunc(asNum(this.expression()))
        this.expect(']', "indexing needs its closing ']'")
        if (cur.t === 'array') {
          const elems = cur.elems!
          if (idx < 0 || idx >= elems.length) {
            throw new CppError(`index ${idx} is past the end of this array (size ${elems.length})`, t.line)
          }
          cur = elems[idx]
          continue
        }
        if (cur.t === 'string') {
          const s = cur.v as string
          if (idx < 0 || idx >= s.length) {
            throw new CppError(`index ${idx} is past the end of this string (length ${s.length})`, t.line)
          }
          return { strOwner: cur, idx }
        }
        throw new CppError('only arrays and strings can be indexed with [ ]', t.line)
      }
      if (t?.t === 'op' && t.v === '.') {
        if (cur.t !== 'struct') return null // .length() and friends — a read
        this.next()
        const nameTok = this.next()
        if (nameTok.t !== 'id') throw new CppError("'.' needs a member name after it", nameTok.line)
        const f = cur.fields!.get(nameTok.v)
        if (!f) throw new CppError(`${cur.sname} has no field named '${nameTok.v}'`, nameTok.line)
        cur = f
        continue
      }
      return { ref: cur }
    }
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
    let v: Value & { ref?: Value } = this.primary()
    while (true) {
      const t = this.peek()
      if (t?.t === 'op' && t.v === '[') {
        this.next()
        const idx = Math.trunc(asNum(this.expression()))
        this.expect(']', "indexing needs its closing ']'")
        if (v.t === 'array') {
          const elems = v.elems!
          if (idx < 0 || idx >= elems.length) {
            throw new CppError(`index ${idx} is past the end of this array (size ${elems.length})`, t.line)
          }
          const el = elems[idx]
          v = { ...el, ref: el }
          continue
        }
        if (v.t === 'string') {
          const s = v.v as string
          if (idx < 0 || idx >= s.length) {
            throw new CppError(`index ${idx} is past the end of this string (length ${s.length})`, t.line)
          }
          v = { t: 'char', v: s[idx] }
          continue
        }
        throw new CppError('only arrays and strings can be indexed with [ ]', t.line)
      }
      if (t?.t === 'op' && t.v === '.') {
        this.next()
        const nameTok = this.next()
        if (nameTok.t !== 'id') throw new CppError("'.' needs a member name after it", nameTok.line)
        if (v.t === 'string' && (nameTok.v === 'length' || nameTok.v === 'size')) {
          this.expect('(', `${nameTok.v} is called with parentheses: .${nameTok.v}()`)
          this.expect(')')
          v = { t: 'int', v: (v.v as string).length }
          continue
        }
        if (v.t === 'struct') {
          const f = v.fields!.get(nameTok.v)
          if (!f) throw new CppError(`${v.sname} has no field named '${nameTok.v}'`, nameTok.line)
          v = { ...f, ref: f }
          continue
        }
        throw new CppError(`'.${nameTok.v}' — only structs have fields (strings have .length() / .size())`, nameTok.line)
      }
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
      if (this.peek()?.v === '(') {
        // function call
        if (!this.fns.has(t.v)) {
          throw new CppError(`no function named '${t.v}' is defined`, t.line)
        }
        this.next() // (
        const args: Value[] = []
        if (this.peek()?.v !== ')') {
          args.push(this.expression())
          while (this.peek()?.v === ',') {
            this.next()
            args.push(this.expression())
          }
        }
        this.expect(')', `the call to ${t.v}(...) needs its closing ')'`)
        return this.callFn(t.v, args, t.line)
      }
      const ref = this.lookup(t.v, t.line)
      // aggregates carry their elems/fields along so chains ([i], .field) work
      return { ...ref, ref }
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
