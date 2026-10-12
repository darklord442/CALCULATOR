(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Evaluator = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class CalcError extends Error {}

  const FUNCTIONS = [
    'asinh', 'acosh', 'atanh', 'sinh', 'cosh', 'tanh',
    'asin', 'acos', 'atan', 'sin', 'cos', 'tan',
    'log2', 'log', 'ln', 'sqrt', 'cbrt', 'abs', 'exp',
  ];
  const CONSTANTS = ['pi', 'e', 'Ans'];
  const WORDS = FUNCTIONS.concat(CONSTANTS, ['mod']).sort((a, b) => b.length - a.length);

  const SYMBOLS = {
    '+': ['op', '+'],
    '-': ['op', '-'], '−': ['op', '-'],
    '*': ['op', '*'], '×': ['op', '*'],
    '/': ['op', '/'], '÷': ['op', '/'],
    '^': ['op', '^'],
    '!': ['op', '!'], '%': ['op', '%'], '²': ['op', '²'], '³': ['op', '³'],
    '(': ['('], ')': [')'],
    'π': ['const', 'pi'],
    '√': ['func', 'sqrt'], '∛': ['func', 'cbrt'],
  };

  const NUMBER_RE = /^(\d+\.?\d*|\.\d+)(E[+\-−]?\d+)?/;

  function tokenize(input) {
    const tokens = [];
    let i = 0;
    while (i < input.length) {
      const ch = input[i];
      if (/\s/.test(ch)) { i++; continue; }

      const num = NUMBER_RE.exec(input.slice(i));
      if (num) {
        if (input[i + num[0].length] === '.') throw new CalcError('Syntax error');
        tokens.push({ type: 'num', value: parseFloat(num[0].replace('−', '-')) });
        i += num[0].length;
        continue;
      }

      if (SYMBOLS[ch]) {
        const [type, value] = SYMBOLS[ch];
        tokens.push({ type, value });
        i++;
        continue;
      }

      if (/[A-Za-z]/.test(ch)) {
        const word = WORDS.find((w) => input.startsWith(w, i));
        if (!word) throw new CalcError('Syntax error');
        if (word === 'mod') tokens.push({ type: 'op', value: 'mod' });
        else if (CONSTANTS.includes(word)) tokens.push({ type: 'const', value: word });
        else tokens.push({ type: 'func', value: word });
        i += word.length;
        continue;
      }

      throw new CalcError('Syntax error');
    }
    return tokens;
  }

  const LANCZOS = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];

  function gamma(z) {
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z -= 1;
    let x = LANCZOS[0];
    for (let i = 1; i < LANCZOS.length; i++) x += LANCZOS[i] / (z + i);
    const t = z + 7.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }

  function factorial(n) {
    if (Number.isInteger(n)) {
      if (n < 0) throw new CalcError('Invalid input');
      if (n > 170) throw new CalcError('Overflow');
      let r = 1;
      for (let i = 2; i <= n; i++) r *= i;
      return r;
    }
    return gamma(n + 1);
  }

  function mod(a, b) {
    return a - b * Math.floor(a / b);
  }

  function snap(x) {
    return Math.abs(x) < 1e-15 ? 0 : x;
  }

  function makeFunctions(angleMode) {
    const deg = angleMode === 'deg';
    const toRad = (x) => (deg ? (mod(x, 360) * Math.PI) / 180 : x);
    const fromRad = (x) => (deg ? (x * 180) / Math.PI : x);
    const requireDomain = (ok) => {
      if (!ok) throw new CalcError('Invalid input');
    };

    return {
      sin: (x) => (deg && mod(x, 180) === 0 ? 0 : snap(Math.sin(toRad(x)))),
      cos: (x) => (deg && mod(x - 90, 180) === 0 ? 0 : snap(Math.cos(toRad(x)))),
      tan: (x) => {
        if (deg && mod(x, 180) === 0) return 0;
        if (deg && mod(x, 180) === 90) throw new CalcError('Invalid input');
        return snap(Math.tan(toRad(x)));
      },
      asin: (x) => { requireDomain(x >= -1 && x <= 1); return fromRad(Math.asin(x)); },
      acos: (x) => { requireDomain(x >= -1 && x <= 1); return fromRad(Math.acos(x)); },
      atan: (x) => fromRad(Math.atan(x)),
      sinh: Math.sinh,
      cosh: Math.cosh,
      tanh: Math.tanh,
      asinh: Math.asinh,
      acosh: (x) => { requireDomain(x >= 1); return Math.acosh(x); },
      atanh: (x) => { requireDomain(x > -1 && x < 1); return Math.atanh(x); },
      log: (x) => { requireDomain(x > 0); return Math.log10(x); },
      log2: (x) => { requireDomain(x > 0); return Math.log2(x); },
      ln: (x) => { requireDomain(x > 0); return Math.log(x); },
      sqrt: (x) => { requireDomain(x >= 0); return Math.sqrt(x); },
      cbrt: Math.cbrt,
      abs: Math.abs,
      exp: Math.exp,
    };
  }

  function power(base, exponent) {
    if (base < 0 && !Number.isInteger(exponent)) {
      // Allow odd roots of negative numbers, e.g. (−8)^(1/3) = −2.
      const inv = 1 / exponent;
      if (Number.isInteger(Math.round(inv)) && Math.abs(inv - Math.round(inv)) < 1e-10 && Math.round(inv) % 2 !== 0) {
        return -Math.pow(-base, exponent);
      }
      throw new CalcError('Invalid input');
    }
    if (base === 0 && exponent < 0) throw new CalcError('Cannot divide by zero');
    return Math.pow(base, exponent);
  }

  function evaluate(expression, options) {
    const opts = options || {};
    const fns = makeFunctions(opts.angleMode || 'deg');
    const constants = { pi: Math.PI, e: Math.E, Ans: opts.ans || 0 };
    const tokens = tokenize(String(expression));
    if (tokens.length === 0) throw new CalcError('Empty expression');

    let pos = 0;
    const peek = () => tokens[pos];
    const next = () => tokens[pos++];
    const isOp = (t, v) => t && t.type === 'op' && t.value === v;
    const startsOperand = (t) =>
      t && (t.type === 'num' || t.type === 'const' || t.type === 'func' || t.type === '(');

    function parseExpr() {
      let value = parseTerm();
      while (isOp(peek(), '+') || isOp(peek(), '-')) {
        const op = next().value;
        const rhs = parseTerm();
        value = op === '+' ? value + rhs : value - rhs;
      }
      return value;
    }

    function parseTerm() {
      let value = parseUnary();
      for (;;) {
        const t = peek();
        if (isOp(t, '*')) {
          next();
          value *= parseUnary();
        } else if (isOp(t, '/') || isOp(t, 'mod')) {
          next();
          const rhs = parseUnary();
          if (rhs === 0) throw new CalcError('Cannot divide by zero');
          value = t.value === '/' ? value / rhs : mod(value, rhs);
        } else if (startsOperand(t)) {
          value *= parseUnary();
        } else {
          return value;
        }
      }
    }

    function parseUnary() {
      if (isOp(peek(), '-')) { next(); return -parseUnary(); }
      if (isOp(peek(), '+')) { next(); return parseUnary(); }
      return parsePower();
    }

    function parsePower() {
      const base = parsePostfix();
      if (isOp(peek(), '^')) {
        next();
        return power(base, parseUnary());
      }
      return base;
    }

    function parsePostfix() {
      let value = parsePrimary();
      for (;;) {
        const t = peek();
        if (isOp(t, '!')) { next(); value = factorial(value); }
        else if (isOp(t, '%')) { next(); value /= 100; }
        else if (isOp(t, '²')) { next(); value = value * value; }
        else if (isOp(t, '³')) { next(); value = value * value * value; }
        else return value;
      }
    }

    function parsePrimary() {
      const t = next();
      if (!t) throw new CalcError('Incomplete expression');
      switch (t.type) {
        case 'num':
          return t.value;
        case 'const':
          return constants[t.value];
        case '(': {
          const value = parseExpr();
          const close = peek();
          if (close && close.type === ')') next();
          else if (close) throw new CalcError('Syntax error');
          return value;
        }
        case 'func': {
          const arg = peek() && peek().type === '(' ? parsePrimary() : parseUnary();
          return fns[t.value](arg);
        }
        default:
          throw new CalcError('Syntax error');
      }
    }

    const result = parseExpr();
    if (pos < tokens.length) throw new CalcError('Syntax error');
    if (Number.isNaN(result)) throw new CalcError('Invalid input');
    if (!Number.isFinite(result)) throw new CalcError('Overflow');
    return result;
  }

  function format(value) {
    if (!Number.isFinite(value)) return 'Error';
    if (value === 0) return '0';
    const rounded = Number(value.toPrecision(12));
    const abs = Math.abs(rounded);
    if (abs >= 1e15 || abs < 1e-6) {
      return rounded.toExponential().replace('e', 'E');
    }
    return String(rounded);
  }

  return { evaluate, format, tokenize, CalcError };
});
