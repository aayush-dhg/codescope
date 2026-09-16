const { test } = require('node:test');
const assert = require('node:assert/strict');
const { build } = require('../lesson-engine.js');
const last = steps => steps.at(-1);

test('arithmetic respects precedence and emits calculation before assignment', () => {
  const steps = build('a = 8\nb = 3\ntotal = a + b * 2\nprint(total)', 'arithmetic');
  assert.equal(last(steps).output, '14');
  assert.deepEqual(steps.filter(s => s.visual.event === 'calculation').map(s => s.visual.flow.at(-1)), ['6', '14']);
  assert.equal(last(steps).variables.total, '14');
});
test('division, negative floor division, modulo, and parentheses', () => {
  assert.equal(last(build('x = (8 + 4) / 3\ny = -7 // 3\nz = -7 % 3\nprint(x, y, z)', 'arithmetic')).output, '4 -3 2');
});
test('if and else execute only the selected branch', () => {
  for (const [age, expected] of [[20, 'Adult'], [15, 'Minor']]) {
    const steps = build(`age = ${age}\nif age >= 18:\n    status = "Adult"\nelse:\n    status = "Minor"\nprint(status)`, 'if-statement');
    assert.equal(last(steps).output, expected);
    assert.equal(steps.some(s => s.line === (age === 20 ? 5 : 3)), false);
  }
});
test('false branch without else is skipped and empty lists are false', () => {
  const steps = build('x = 1\nif []:\n    x = 99\nprint(x)', 'if-statement');
  assert.equal(last(steps).output, '1');
});
test('loops accumulate and print preserves output history', () => {
  const steps = build('numbers = [2, 4, 6]\ntotal = 0\nfor number in numbers:\n    total += number\n    print(total)\nprint(total)', 'for-loop');
  assert.equal(last(steps).output, '2\n6\n12\n12');
  assert.deepEqual(steps.filter(s => s.visual.event === 'iteration').map(s => s.variables.number), ['2', '4', '6']);
  assert.equal(steps[0].variables.total, undefined);
});
test('descending range, empty loops, and nested control flow', () => {
  assert.equal(last(build('total = 0\nfor n in range(5, 0, -2):\n    if n > 1:\n        total += n\nprint(total)', 'for-loop')).output, '8');
  const steps = build('total = 0\nfor n in []:\n    total += n\nprint(total)', 'for-loop');
  assert.equal(last(steps).output, '0');
  assert.equal(last(steps).variables.n, undefined);
});
test('functions bind positional arguments and remove locals after returning', () => {
  const steps = build('a = 100\ndef add(a, b):\n    result = a + b\n    return result\nanswer = add(3, 4)\nprint(a, answer)', 'function');
  assert.equal(last(steps).output, '100 7');
  const call = steps.find(s => s.visual.event === 'call');
  assert.equal(call.visual.scopes[0].objects[0].value, '100');
  assert.equal(call.variables.a, '3');
  assert.equal(last(steps).variables.result, undefined);
  assert.equal(last(steps).visual.scopes.length, 1);
});
test('function returns from inside a branch and defaults to None', () => {
  assert.equal(last(build('def choose(x):\n    if x > 0:\n        return x\n    return 0\nanswer = choose(5)\nprint(answer)', 'function')).output, '5');
  assert.equal(last(build('def greet():\n    print("Hi")\nanswer = greet()\nprint(answer)', 'function')).output, 'Hi\nNone');
});
test('blank lines, comments, quoted symbols, and escapes preserve source locations', () => {
  const steps = build('\n# intro\nx = "<b># hello</b>"\n\nprint(x, "a\\nb", ")")', 'arithmetic');
  assert.equal(steps[0].line, 3);
  assert.equal(last(steps).line, 5);
  assert.equal(last(steps).output, '<b># hello</b> a\nb )');
});
test('errors are actionable and line numbered', () => {
  const cases = [
    ['x = 1 / 0', 'arithmetic', /Line 1: Cannot divide by zero/],
    ['print(missing)', 'arithmetic', /Line 1: missing has not been defined/],
    ['if True:\nx = 1', 'if-statement', /Line 1: Add an indented body/],
    ['for x in range(1, 3, 0):\n    print(x)', 'for-loop', /step cannot be zero/],
    ['def add(a, b):\n    return a + b\nx = add(1)', 'function', /expects 2 arguments/],
    ['import os', 'function', /not supported/],
    ['x = 2 ** 3', 'arithmetic', /Expected a value/],
    ['x = 1 < 2 < 3', 'arithmetic', /one comparison/]
  ];
  for (const [source, topic, error] of cases) assert.throws(() => build(source, topic), error);
});
test('execution limits and recursion fail predictably', () => {
  assert.throws(() => build('for n in range(1000):\n    print(n)', 'for-loop'), /100 values/);
  assert.throws(() => build('for n in range(100):\n    for m in range(100):\n        print(m)', 'for-loop'), /Execution limit/);
  assert.throws(() => build('def f(x):\n    return f(x)\nf(1)', 'function'), /Recursive calls/);
});
test('print of a blank string is still output', () => {
  const step = last(build('print("")', 'arithmetic'));
  assert.equal(step.output, '');
  assert.equal(step.hasOutput, true);
});
test('local assignment does not silently read a same-named global', () => {
  assert.throws(() => build('x = 10\ndef f():\n    x += 1\n    return x\nf()', 'function'), /Local variable x is read before it is assigned/);
  assert.equal(last(build('x = 10\ndef f():\n    return x + 1\nprint(f())', 'function')).output, '11');
});
test('range values outside loop headers are rejected rather than misrepresented as lists', () => {
  assert.throws(() => build('x = range(3)\nprint(x)', 'for-loop'), /Range objects outside loops/);
});
