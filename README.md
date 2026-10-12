# CALCULATOR

A web-based scientific calculator built with plain HTML, CSS and JavaScript — no build step or dependencies.

## Usage

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Features

- Arithmetic with correct operator precedence, parentheses (auto-closed on `=`), and implicit multiplication (`2π`, `3(4+1)`)
- Trigonometry: `sin`, `cos`, `tan` and inverses (`2nd`), hyperbolic variants (`HYP`), DEG/RAD modes
- Powers and roots: `x²`, `x³`, `xʸ`, `√x`, `∛x`, `10ˣ`, `2ˣ`, `eˣ`, `1/x`
- Logarithms: `log`, `log₂`, `ln`
- `n!` (gamma function for non-integers), `|x|`, `mod`, `%`, `+/−`, `EXP` scientific notation, constants `π` and `e`
- Memory (`MC`, `MR`, `M+`, `M−`, `MS`) and a clickable calculation history, both saved in `localStorage`
- Live result preview while typing and friendly error messages (e.g. "Cannot divide by zero")
- Keyboard support: digits, `+ - * / ^ ( ) . ! %`, `Enter`/`=`, `Backspace`, `Esc` (clear), `Delete` (clear entry),
  `s`/`c`/`t` (sin/cos/tan), `l` (log), `n` (ln), `r` (√), `q` (x²), `p` (π), `e`, `m` (mod)

Expressions are evaluated by a small recursive-descent parser in `js/evaluator.js` (no `eval`).

## Tests

```sh
npm test
```
