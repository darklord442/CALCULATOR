(function () {
  'use strict';

  const { evaluate, format } = window.Evaluator;

  const els = {
    display: document.getElementById('display'),
    preview: document.getElementById('preview'),
    memoryIndicator: document.getElementById('memory-indicator'),
    angleMode: document.getElementById('angle-mode'),
    hypMode: document.getElementById('hyp-mode'),
    secondKey: document.getElementById('second-key'),
    keys: document.querySelector('.keys'),
    memoryRow: document.querySelector('.memory-row'),
    history: document.getElementById('history'),
    historyList: document.getElementById('history-list'),
    historyEmpty: document.getElementById('history-empty'),
    historyClear: document.getElementById('history-clear'),
    historyToggle: document.getElementById('history-toggle'),
  };

  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        /* storage unavailable */
      }
    },
  };

  const state = {
    expr: '',
    angleMode: storage.get('calc.angleMode', 'deg'),
    second: false,
    hyp: false,
    memory: storage.get('calc.memory', 0),
    ans: 0,
    justEvaluated: false,
    error: null,
    lastExpression: '',
    history: storage.get('calc.history', []),
  };

  const OPERATOR_END = /(\+|−|×|÷|\^| mod )$/;
  const FUNC_PREFIX = {
    sin: 'sin(', cos: 'cos(', tan: 'tan(',
    asin: 'asin(', acos: 'acos(', atan: 'atan(',
    sinh: 'sinh(', cosh: 'cosh(', tanh: 'tanh(',
    asinh: 'asinh(', acosh: 'acosh(', atanh: 'atanh(',
    log: 'log(', log2: 'log2(', ln: 'ln(', abs: 'abs(',
    '√': '√(', '∛': '∛(',
  };
  const POWER_PREFIX = { pow10: '10^', pow2: '2^', powe: 'e^' };
  const BACKSPACE_CHUNK = /((?:a?(?:sin|cos|tan)h?|log2|log|ln|abs)\(|Ans| mod )$/;

  // ----- Expression helpers -----

  function toDisplayNumber(value) {
    return format(value).replace(/-/g, '−');
  }

  function asOperand(value) {
    const text = toDisplayNumber(value);
    return text.startsWith('−') ? '(' + text + ')' : text;
  }

  function endsWithOperand(expr) {
    return /[\d.)πe!%²³]$|Ans$/.test(expr);
  }

  function openParenCount(expr) {
    let depth = 0;
    for (const ch of expr) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
    }
    return depth;
  }

  // Splits the expression into [before, lastOperand]. lastOperand is '' when
  // the expression doesn't end with a complete operand.
  function splitLastOperand(expr) {
    let end = expr.length;
    while (end > 0 && '!%²³'.includes(expr[end - 1])) end--;
    let start;

    if (expr[end - 1] === ')') {
      let depth = 0;
      start = end - 1;
      for (; start >= 0; start--) {
        if (expr[start] === ')') depth++;
        else if (expr[start] === '(') depth--;
        if (depth === 0) break;
      }
      if (start < 0) return [expr, ''];
      const fn = /(?:[a-z]+\d?|[√∛])$/.exec(expr.slice(0, start));
      if (fn) start -= fn[0].length;
    } else {
      const head = expr.slice(0, end);
      const match = /(?:\d+\.?\d*|\.\d+)(?:E[+−]?\d+)?$|π$|e$|Ans$/.exec(head);
      if (!match) return [expr, ''];
      start = match.index;
    }
    return [expr.slice(0, start), expr.slice(start)];
  }

  function isWrapped(operand) {
    if (!operand.startsWith('(') || !operand.endsWith(')')) return false;
    return splitLastOperand(operand)[0] === '';
  }

  function group(operand) {
    return /^(?:\d+\.?\d*|\.\d+|π|e|Ans)$/.test(operand) || isWrapped(operand)
      ? operand
      : '(' + operand + ')';
  }

  // ----- Input actions -----

  function startFresh() {
    if (state.justEvaluated || state.error) {
      state.expr = '';
      state.justEvaluated = false;
      state.error = null;
    }
  }

  function continueFromResult() {
    if (state.justEvaluated && /^−[^+−×÷^ ]*$/.test(state.expr)) {
      state.expr = '(' + state.expr + ')';
    }
    state.justEvaluated = false;
    if (state.error) {
      state.expr = '';
      state.error = null;
    }
  }

  function inputDigit(digit) {
    startFresh();
    if (/[)πe!%²³]$|Ans$/.test(state.expr)) state.expr += '×';
    state.expr += digit;
  }

  function inputDecimal() {
    startFresh();
    const current = /[\d.]*$/.exec(state.expr)[0];
    if (current.includes('.') || /E[+−]?\d*$/.test(state.expr)) return;
    if (/[)πe!%²³]$|Ans$/.test(state.expr)) state.expr += '×';
    state.expr += current === '' ? '0.' : '.';
  }

  function inputOperator(op) {
    continueFromResult();
    const expr = state.expr;
    if (expr === '' || expr.endsWith('(')) {
      if (op === '−') state.expr += op;
      return;
    }
    if (OPERATOR_END.test(expr)) {
      const allowNegative = op === '−' && /(×|÷|\^| mod )$/.test(expr);
      if (allowNegative) {
        state.expr += op;
      } else {
        // Replace trailing operator(s), e.g. "5×−" followed by "+" becomes "5+".
        state.expr = expr.replace(/(?:\+|−|×|÷|\^| mod )+$/, '') + op;
      }
      return;
    }
    if (/E$/.test(expr)) {
      if (op === '−' || op === '+') state.expr += op;
      return;
    }
    state.expr += op;
  }

  function inputPostfix(symbol) {
    continueFromResult();
    if (endsWithOperand(state.expr)) state.expr += symbol;
  }

  function inputConstant(symbol) {
    startFresh();
    if (endsWithOperand(state.expr)) state.expr += '×';
    state.expr += symbol;
  }

  function inputFunction(name) {
    continueFromResult();
    const [before, operand] = splitLastOperand(state.expr);

    if (name === 'reciprocal') {
      state.expr = operand ? before + '(1÷' + group(operand) + ')' : state.expr + '1÷(';
      return;
    }
    if (POWER_PREFIX[name]) {
      state.expr = operand
        ? before + POWER_PREFIX[name] + group(operand)
        : state.expr + POWER_PREFIX[name] + '(';
      return;
    }
    const prefix = FUNC_PREFIX[name];
    if (operand) {
      const inner = isWrapped(operand) ? operand.slice(1, -1) : operand;
      state.expr = before + prefix + inner + ')';
    } else {
      state.expr += prefix;
    }
  }

  function inputOpenParen() {
    startFresh();
    if (endsWithOperand(state.expr)) state.expr += '×';
    state.expr += '(';
  }

  function inputCloseParen() {
    continueFromResult();
    if (openParenCount(state.expr) > 0 && endsWithOperand(state.expr)) state.expr += ')';
  }

  function inputExp() {
    continueFromResult();
    const [, operand] = splitLastOperand(state.expr);
    if (/^(?:\d+\.?\d*|\.\d+)$/.test(operand)) state.expr += 'E';
  }

  function negate() {
    continueFromResult();
    const [before, operand] = splitLastOperand(state.expr);
    if (!operand) {
      if (state.expr === '' || /[(]$|(×|÷|\^| mod )$/.test(state.expr)) state.expr += '−';
      return;
    }
    const negated = /^\(−(.*)\)$/.exec(operand);
    if (negated && isWrapped(operand)) {
      state.expr = before + negated[1];
    } else {
      state.expr = before + '(−' + operand + ')';
    }
  }

  function backspace() {
    if (state.error || state.justEvaluated) {
      clearAll();
      return;
    }
    const chunk = BACKSPACE_CHUNK.exec(state.expr);
    state.expr = state.expr.slice(0, state.expr.length - (chunk ? chunk[0].length : 1));
  }

  function clearEntry() {
    if (state.error || state.justEvaluated) {
      clearAll();
      return;
    }
    const [before, operand] = splitLastOperand(state.expr);
    state.expr = operand ? before : state.expr;
  }

  function clearAll() {
    state.expr = '';
    state.error = null;
    state.justEvaluated = false;
    state.lastExpression = '';
  }

  function compute(expr) {
    return evaluate(expr, { angleMode: state.angleMode, ans: state.ans });
  }

  function equals() {
    if (state.error || state.expr === '') return;
    const expr = state.expr + ')'.repeat(Math.max(0, openParenCount(state.expr)));
    try {
      const value = compute(expr);
      const result = toDisplayNumber(value);
      addHistory(expr, result);
      state.lastExpression = expr + ' =';
      state.expr = result;
      state.ans = value;
      state.justEvaluated = true;
    } catch (err) {
      state.lastExpression = expr + ' =';
      state.error = err.message || 'Error';
    }
  }

  // ----- Memory -----

  function currentValue() {
    if (state.error || state.expr === '') return null;
    try {
      return compute(state.expr);
    } catch (err) {
      state.error = err.message || 'Error';
      return null;
    }
  }

  function setMemory(value) {
    state.memory = value;
    storage.set('calc.memory', value);
  }

  function memory(action) {
    if (action === 'clear') {
      setMemory(0);
      return;
    }
    if (action === 'recall') {
      startFresh();
      const [before, operand] = splitLastOperand(state.expr);
      const base = operand ? before : state.expr;
      state.expr = base + (base === '' ? toDisplayNumber(state.memory) : asOperand(state.memory));
      return;
    }
    const value = currentValue();
    if (value === null) return;
    if (action === 'store') setMemory(value);
    else if (action === 'add') setMemory(state.memory + value);
    else if (action === 'subtract') setMemory(state.memory - value);
    state.justEvaluated = true;
  }

  // ----- History -----

  function addHistory(expr, result) {
    state.history.unshift({ expr, result });
    state.history = state.history.slice(0, 50);
    storage.set('calc.history', state.history);
  }

  function renderHistory() {
    els.historyList.replaceChildren(
      ...state.history.map((item, index) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'history-item';
        btn.dataset.index = String(index);
        const exprEl = document.createElement('span');
        exprEl.className = 'history-expr';
        exprEl.textContent = item.expr + ' =';
        const resultEl = document.createElement('span');
        resultEl.className = 'history-result';
        resultEl.textContent = item.result;
        btn.append(exprEl, resultEl);
        li.append(btn);
        return li;
      })
    );
    els.historyEmpty.hidden = state.history.length > 0;
  }

  // ----- Rendering -----

  function updateKeyLabels() {
    els.keys.querySelectorAll('[data-alt-label]').forEach((key) => {
      key.textContent = state.second ? key.dataset.altLabel : key.dataset.label;
    });
    if (state.hyp) {
      els.keys.querySelectorAll('[data-value="sin"],[data-value="cos"],[data-value="tan"]').forEach((key) => {
        key.textContent = (state.second ? key.dataset.altLabel : key.dataset.label).replace(/^(sin|cos|tan)/, '$1h');
      });
    }
    els.secondKey.setAttribute('aria-pressed', String(state.second));
    els.hypMode.setAttribute('aria-pressed', String(state.hyp));
    els.angleMode.textContent = state.angleMode.toUpperCase();
  }

  function render() {
    const text = state.error || state.expr || '0';
    els.display.textContent = text;
    els.display.classList.toggle('error', Boolean(state.error));
    els.display.classList.toggle('medium', !state.error && text.length > 14 && text.length <= 20);
    els.display.classList.toggle('small', !state.error && text.length > 20);
    els.display.scrollLeft = els.display.scrollWidth;

    let preview = state.lastExpression;
    if (!state.justEvaluated && !state.error && state.expr) {
      preview = '';
      if (/[^\d.]/.test(state.expr.replace(/^−/, ''))) {
        try {
          preview = '= ' + toDisplayNumber(compute(state.expr));
        } catch (e) {
          preview = '';
        }
      }
    }
    els.preview.textContent = preview;
    els.memoryIndicator.hidden = state.memory === 0;
    updateKeyLabels();
    renderHistory();
  }

  // ----- Dispatch -----

  function resolveFunction(key) {
    let name = state.second && key.dataset.alt ? key.dataset.alt : key.dataset.value;
    if (state.hyp && /^a?(sin|cos|tan)$/.test(name)) name += 'h';
    return name;
  }

  function handle(action, value, key) {
    switch (action) {
      case 'digit': inputDigit(value); break;
      case 'decimal': inputDecimal(); break;
      case 'operator': inputOperator(value); break;
      case 'postfix': inputPostfix(state.second && key && key.dataset.alt ? key.dataset.alt : value); break;
      case 'constant': inputConstant(value); break;
      case 'func': inputFunction(key ? resolveFunction(key) : value); break;
      case 'open-paren': inputOpenParen(); break;
      case 'close-paren': inputCloseParen(); break;
      case 'exp': inputExp(); break;
      case 'negate': negate(); break;
      case 'backspace': backspace(); break;
      case 'clear-entry': clearEntry(); break;
      case 'clear': clearAll(); break;
      case 'equals': equals(); break;
      case 'memory': memory(value); break;
      case 'second': state.second = !state.second; break;
      default: return;
    }
    if (state.second && key && action !== 'second' && key.dataset.alt) state.second = false;
    render();
  }

  function onKeyClick(event) {
    const key = event.target.closest('button[data-action]');
    if (!key) return;
    handle(key.dataset.action, key.dataset.value, key);
  }

  els.keys.addEventListener('click', onKeyClick);
  els.memoryRow.addEventListener('click', onKeyClick);

  els.angleMode.addEventListener('click', () => {
    state.angleMode = state.angleMode === 'deg' ? 'rad' : 'deg';
    storage.set('calc.angleMode', state.angleMode);
    render();
  });

  els.hypMode.addEventListener('click', () => {
    state.hyp = !state.hyp;
    render();
  });

  els.historyToggle.addEventListener('click', () => {
    els.history.classList.toggle('open');
  });

  els.historyClear.addEventListener('click', () => {
    state.history = [];
    storage.set('calc.history', []);
    render();
  });

  els.historyList.addEventListener('click', (event) => {
    const item = event.target.closest('.history-item');
    if (!item) return;
    const entry = state.history[Number(item.dataset.index)];
    state.expr = entry.result;
    state.lastExpression = entry.expr + ' =';
    state.error = null;
    state.justEvaluated = true;
    try {
      state.ans = compute(entry.result);
    } catch (e) {
      /* keep previous Ans */
    }
    render();
  });

  const KEYMAP = {
    '+': ['operator', '+'], '-': ['operator', '−'], '*': ['operator', '×'], 'x': ['operator', '×'],
    '/': ['operator', '÷'], '^': ['operator', '^'],
    '!': ['postfix', '!'], '%': ['postfix', '%'],
    '(': ['open-paren'], ')': ['close-paren'],
    '.': ['decimal'], ',': ['decimal'],
    'Enter': ['equals'], '=': ['equals'],
    'Backspace': ['backspace'], 'Escape': ['clear'], 'Delete': ['clear-entry'],
    'p': ['constant', 'π'], 'e': ['constant', 'e'],
    's': ['func', 'sin'], 'c': ['func', 'cos'], 't': ['func', 'tan'],
    'l': ['func', 'log'], 'n': ['func', 'ln'], 'r': ['func', '√'],
    'q': ['postfix', '²'], 'm': ['operator', ' mod '],
  };

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    let mapping = /^\d$/.test(event.key) ? ['digit', event.key] : KEYMAP[event.key];
    if (!mapping) return;
    event.preventDefault();
    let [action, value] = mapping;
    if (action === 'func' && state.hyp && /^(sin|cos|tan)$/.test(value)) value += 'h';
    handle(action, value, null);
    flashKey(action, value);
  });

  function flashKey(action, value) {
    const selector = value === undefined
      ? `button[data-action="${action}"]`
      : `button[data-action="${action}"][data-value="${CSS.escape(value)}"]`;
    const key = els.keys.querySelector(selector);
    if (!key) return;
    key.classList.add('pressed');
    setTimeout(() => key.classList.remove('pressed'), 100);
  }

  render();
})();
