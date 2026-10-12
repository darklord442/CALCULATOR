const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate, format, CalcError } = require('../js/evaluator.js');

const calc = (expr, opts) => format(evaluate(expr, opts));
const rad = { angleMode: 'rad' };

test('basic arithmetic and precedence', () => {
  assert.equal(calc('1+2×3'), '7');
  assert.equal(calc('(1+2)×3'), '9');
  assert.equal(calc('10÷4'), '2.5');
  assert.equal(calc('7−10'), '-3');
  assert.equal(calc('0.1+0.2'), '0.3');
  assert.equal(calc('2*3/4-1'), '0.5');
});

test('unary minus and powers', () => {
  assert.equal(calc('−3²'), '-9');
  assert.equal(calc('(−3)²'), '9');
  assert.equal(calc('2^3^2'), '512');
  assert.equal(calc('2^−1'), '0.5');
  assert.equal(calc('2³'), '8');
  assert.equal(calc('(−8)^(1÷3)'), '-2');
  assert.equal(calc('2−−3'), '5');
});

test('implicit multiplication', () => {
  assert.equal(calc('2π'), format(2 * Math.PI));
  assert.equal(calc('2(3+4)'), '14');
  assert.equal(calc('(1+1)(2+2)'), '8');
  assert.equal(calc('3sin(90)'), '3');
});

test('trigonometry in degrees and radians', () => {
  assert.equal(calc('sin(30)'), '0.5');
  assert.equal(calc('cos(60)'), '0.5');
  assert.equal(calc('tan(45)'), '1');
  assert.equal(calc('sin(180)'), '0');
  assert.equal(calc('cos(90)'), '0');
  assert.equal(calc('asin(1)'), '90');
  assert.equal(calc('atan(1)'), '45');
  assert.equal(calc('sin(π÷2)', rad), '1');
  assert.equal(calc('cos(π)', rad), '-1');
  assert.equal(calc('acos(−1)', rad), format(Math.PI));
  assert.throws(() => evaluate('tan(90)'), CalcError);
  assert.throws(() => evaluate('asin(2)'), CalcError);
});

test('hyperbolic functions', () => {
  assert.equal(calc('sinh(0)'), '0');
  assert.equal(calc('cosh(0)'), '1');
  assert.equal(calc('tanh(1)'), format(Math.tanh(1)));
  assert.equal(calc('asinh(sinh(2))'), '2');
});

test('logs, roots and exponentials', () => {
  assert.equal(calc('log(1000)'), '3');
  assert.equal(calc('log2(8)'), '3');
  assert.equal(calc('ln(e)'), '1');
  assert.equal(calc('e^2'), format(Math.E ** 2));
  assert.equal(calc('10^3'), '1000');
  assert.equal(calc('√(16)'), '4');
  assert.equal(calc('√16+1'), '5');
  assert.equal(calc('∛(27)'), '3');
  assert.equal(calc('∛(−27)'), '-3');
  assert.equal(calc('abs(−5)'), '5');
  assert.throws(() => evaluate('log(0)'), CalcError);
  assert.throws(() => evaluate('√(−1)'), CalcError);
});

test('factorial, percent and mod', () => {
  assert.equal(calc('5!'), '120');
  assert.equal(calc('0!'), '1');
  assert.equal(calc('3!²'), '36');
  assert.equal(calc('0.5!'), format(Math.sqrt(Math.PI) / 2));
  assert.equal(calc('50%'), '0.5');
  assert.equal(calc('200×15%'), '30');
  assert.equal(calc('17 mod 5'), '2');
  assert.equal(calc('−7 mod 3'), '2');
  assert.throws(() => evaluate('(−1)!'), CalcError);
  assert.throws(() => evaluate('171!'), CalcError);
});

test('scientific notation and Ans', () => {
  assert.equal(calc('1.5E3'), '1500');
  assert.equal(calc('2E−3'), '0.002');
  assert.equal(calc('Ans×2', { ans: 21 }), '42');
  assert.equal(calc('1E20'), '1E+20');
  assert.equal(calc('1÷3'), '0.333333333333');
  assert.equal(calc(format(1e-12) + '×1'), '1E-12');
});

test('auto-closes trailing parentheses', () => {
  assert.equal(calc('sin(30'), '0.5');
  assert.equal(calc('2×(3+4'), '14');
});

test('errors', () => {
  assert.throws(() => evaluate(''), CalcError);
  assert.throws(() => evaluate('1÷0'), /divide by zero/);
  assert.throws(() => evaluate('5 mod 0'), /divide by zero/);
  assert.throws(() => evaluate('2+'), CalcError);
  assert.throws(() => evaluate('3)'), CalcError);
  assert.throws(() => evaluate('1.2.3'), CalcError);
  assert.throws(() => evaluate('alert(1)'), CalcError);
  assert.throws(() => evaluate('10^400'), /Overflow/);
});
