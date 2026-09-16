/* A deliberately small Python subset. Source is parsed, never evaluated as JavaScript. */
const PythonLessons = (() => {
  const keywords = new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield print range'.split(' '));
  const fail = message => { throw new Error(message); };
  const validName = name => /^[A-Za-z_]\w*$/.test(name) && !keywords.has(name);
  const format = value => Array.isArray(value) ? `[${value.map(format).join(', ')}]` : typeof value === 'string' ? JSON.stringify(value) : value === true ? 'True' : value === false ? 'False' : value === null ? 'None' : String(value);
  const output = value => typeof value === 'string' ? value : format(value);
  const truth = value => Array.isArray(value) ? value.length > 0 : Boolean(value);

  function tokenize(source) {
    const tokens = [];
    let i = 0;
    while (i < source.length) {
      const rest = source.slice(i);
      if (/^\s/.test(rest)) { i++; continue; }
      if (rest[0] === '"' || rest[0] === "'") {
        const quote = rest[0];
        let value = '', closed = false;
        i++;
        while (i < source.length) {
          const char = source[i++];
          if (char === quote) { closed = true; break; }
          if (char === '\\') {
            const escape = source[i++];
            const escapes = { n: '\n', t: '\t', r: '\r', '\\': '\\', '"': '"', "'": "'" };
            if (!Object.hasOwn(escapes, escape)) fail('Supported string escapes: \\n, \\t, \\r, quotes, and backslash.');
            value += escapes[escape];
          } else value += char;
        }
        if (!closed) fail('Close the string with a matching quote.');
        tokens.push({ kind: 'value', value });
        continue;
      }
      const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      if (number) {
        if (/^0\d/.test(number[0]) && !number[0].includes('.')) fail('Remove leading zeros from numbers.');
        const value = Number(number[0]);
        if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) fail('Use smaller numbers in these lessons.');
        tokens.push({ kind: 'value', value }); i += number[0].length; continue;
      }
      const name = rest.match(/^[A-Za-z_]\w*/);
      if (name) { tokens.push({ kind: 'name', value: name[0] }); i += name[0].length; continue; }
      const operator = rest.match(/^(?:\/\/|==|!=|<=|>=|[+\-*/%<>()\[\],])/);
      if (!operator) fail(`Unsupported syntax near ${rest.slice(0, 15)}.`);
      tokens.push({ kind: 'symbol', value: operator[0] }); i += operator[0].length;
    }
    return tokens;
  }

  function expression(source) {
    const tokens = tokenize(source);
    let pos = 0;
    const peek = value => tokens[pos]?.kind === 'symbol' && tokens[pos]?.value === value;
    const take = value => { if (peek(value)) { pos++; return true; } return false; };
    const expect = value => { if (!take(value)) fail(`Expected ${value}.`); };
    function sequence(end) {
      const items = [];
      if (take(end)) return items;
      do { items.push(compare()); } while (take(',') && !peek(end));
      expect(end);
      return items;
    }
    function atom() {
      if (take('+')) return { kind: 'unary', op: '+', value: atom() };
      if (take('-')) return { kind: 'unary', op: '-', value: atom() };
      if (take('(')) { const result = compare(); expect(')'); return result; }
      if (take('[')) return { kind: 'list', items: sequence(']') };
      const token = tokens[pos++];
      if (!token) fail('Expected a value or variable.');
      if (token.kind === 'value') return { kind: 'literal', value: token.value };
      if (token.kind === 'name') {
        if (['True', 'False', 'None'].includes(token.value)) return { kind: 'literal', value: { True: true, False: false, None: null }[token.value] };
        if (keywords.has(token.value) && !['range', 'print'].includes(token.value)) fail(`${token.value} is not supported in expressions.`);
        if (take('(')) return { kind: 'call', name: token.value, args: sequence(')') };
        return { kind: 'name', name: token.value };
      }
      fail('Expected a value, variable, or parenthesized expression.');
    }
    function binary(next, operators) {
      let left = next();
      while (tokens[pos]?.kind === 'symbol' && operators.includes(tokens[pos].value)) {
        const op = tokens[pos++].value;
        left = { kind: 'binary', op, left, right: next() };
      }
      return left;
    }
    const multiply = () => binary(atom, ['*', '/', '//', '%']);
    const add = () => binary(multiply, ['+', '-']);
    function compare() {
      let left = add();
      const comparisons = ['==', '!=', '<', '>', '<=', '>='];
      if (tokens[pos]?.kind === 'symbol' && comparisons.includes(tokens[pos].value)) {
        const op = tokens[pos++].value;
        left = { kind: 'binary', op, left, right: add() };
        if (comparisons.includes(tokens[pos]?.value)) fail('Use one comparison at a time.');
      }
      return left;
    }
    const result = compare();
    if (pos !== tokens.length) fail('Unsupported expression. Use numbers, variables, + - * / // %, and one comparison.');
    return result;
  }

  function stripComment(text) {
    let quote = null;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quote && c === '\\') { i++; continue; }
      if (quote === c) quote = null;
      else if (!quote && (c === '"' || c === "'")) quote = c;
      else if (!quote && c === '#') return text.slice(0, i);
    }
    return text;
  }

  function parse(source, topic) {
    if (source.length > 12000) fail('Keep lessons under 12,000 characters.');
    const lines = source.replace(/\r/g, '').split('\n').map((text, index) => {
      if (/^\s*\t/.test(text)) fail(`Line ${index + 1}: use spaces for indentation.`);
      const clean = stripComment(text).trimEnd();
      return { text: clean.trim(), indent: clean.length - clean.trimStart().length, line: index + 1 };
    }).filter(item => item.text);
    if (!lines.length || lines.length > 120) fail('Use between 1 and 120 nonempty lines.');
    let cursor = 0;
    function block(indent, inFunction = false, depth = 0) {
      if (depth > 8) fail('Keep nesting to eight levels or fewer.');
      const nodes = [];
      while (cursor < lines.length && lines[cursor].indent >= indent) {
        const row = lines[cursor];
        if (row.indent !== indent) fail(`Line ${row.line}: unexpected indentation.`);
        if (row.text === 'else:') break;
        cursor++;
        try {
          let match;
          const node = { line: row.line, source: row.text };
          function body(functionBody = inFunction) {
            if (!lines[cursor] || lines[cursor].indent <= indent) fail('Add an indented body.');
            return block(lines[cursor].indent, functionBody, depth + 1);
          }
          if ((match = row.text.match(/^if\s+(.+):$/))) {
            if (topic === 'arithmetic') fail('Use the If Statement lesson for conditions.');
            Object.assign(node, { kind: 'if', test: expression(match[1]), body: body(), otherwise: [] });
            if (lines[cursor]?.indent === indent && lines[cursor].text === 'else:') { cursor++; node.otherwise = body(); }
          } else if ((match = row.text.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+):$/))) {
            if (!['for-loop', 'function'].includes(topic)) fail('Use the For Loop lesson for loops.');
            if (!validName(match[1])) fail('Choose a valid loop variable name.');
            Object.assign(node, { kind: 'for', name: match[1], values: expression(match[2]), body: body() });
          } else if ((match = row.text.match(/^def\s+([A-Za-z_]\w*)\s*\(([^)]*)\):$/))) {
            if (topic !== 'function' || inFunction || depth !== 0) fail('Define functions at the top level in the Functions lesson.');
            const params = match[2].trim() ? match[2].split(',').map(name => name.trim()) : [];
            if (!validName(match[1]) || params.some(name => !validName(name)) || new Set(params).size !== params.length) fail('Use unique, valid parameter names.');
            Object.assign(node, { kind: 'def', name: match[1], params, body: body(true) });
          } else if ((match = row.text.match(/^return(?:\s+(.+))?$/))) {
            if (!inFunction) fail('return belongs inside a function.');
            Object.assign(node, { kind: 'return', value: match[1] ? expression(match[1]) : { kind: 'literal', value: null } });
          } else if ((match = row.text.match(/^([A-Za-z_]\w*)\s*(\+=|-=|\*=|\/=|=)\s*(.+)$/))) {
            if (!validName(match[1])) fail('Choose a variable name that is not a Python keyword or built-in.');
            Object.assign(node, { kind: 'assign', name: match[1], op: match[2], value: expression(match[3]) });
          } else {
            const value = expression(row.text);
            if (value.kind !== 'call') fail('Use an assignment or function call.');
            Object.assign(node, { kind: 'expression', value });
          }
          nodes.push(node);
        } catch (error) {
          if (/^Line \d+:/.test(error.message)) throw error;
          fail(`Line ${row.line}: ${error.message}`);
        }
      }
      return nodes;
    }
    const result = block(0);
    if (cursor !== lines.length) fail(`Line ${lines[cursor].line}: else needs a matching if.`);
    return result;
  }

  function build(source, topic) {
    const program = parse(source, topic);
    const globals = Object.create(null), functions = Object.create(null), frames = [], steps = [], printed = [];
    let work = 0;
    const limit = () => { if (++work > 2000 || steps.length >= 300) fail('Execution limit reached. Use fewer iterations or simpler code (maximum 300 steps).'); };
    const lookup = (name, env) => {
      if (Object.hasOwn(env, name)) return env[name];
      const frame = frames.find(frame => frame.env === env);
      if (frame?.localNames.has(name)) fail(`Local variable ${name} is read before it is assigned.`);
      if (Object.hasOwn(globals, name)) return globals[name];
      return fail(`${name} has not been defined.`);
    };
    function assignedNames(nodes, names = new Set()) {
      for (const node of nodes) {
        if (node.kind === 'assign' || node.kind === 'for') names.add(node.name);
        if (node.body) assignedNames(node.body, names);
        if (node.otherwise) assignedNames(node.otherwise, names);
      }
      return names;
    }
    const objects = env => Object.entries(env).map(([name, value]) => ({ name, value: format(value), valueType: Array.isArray(value) ? 'list' : typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string' }));
    function emit(node, env, event, title, detail, flow = [], activeNames = []) {
      limit();
      steps.push({ line: node.line, explanation: detail, execution: detail, variables: Object.fromEntries(Object.entries(env).map(([name, value]) => [name, format(value)])), output: printed.join('\n'), hasOutput: printed.length > 0,
        visual: { lesson: true, event, title, detail, flow: flow.map(String), activeNames, objects: objects(env), scopes: frames.length ? [{ name: 'Global', objects: objects(globals) }, ...frames.map(frame => ({ name: frame.name, objects: objects(frame.env) }))] : [{ name: 'Global', objects: objects(globals) }] } });
    }
    function calculate(op, a, b) {
      if (op === '==' || op === '!=') {
        const equal = Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((value, i) => calculate('==', value, b[i])) : typeof a === 'boolean' || typeof b === 'boolean' ? (typeof a === 'number' || typeof a === 'boolean') && (typeof b === 'number' || typeof b === 'boolean') && Number(a) === Number(b) : a === b;
        return op === '==' ? equal : !equal;
      }
      if (['<', '>', '<=', '>='].includes(op)) {
        if (!(typeof a === 'string' && typeof b === 'string') && !([a, b].every(value => typeof value === 'number' || typeof value === 'boolean'))) fail('Compare two numbers or two strings.');
        return op === '<' ? a < b : op === '>' ? a > b : op === '<=' ? a <= b : a >= b;
      }
      if (op === '+' && typeof a === 'string' && typeof b === 'string') { if (a.length + b.length > 4000) fail('Use shorter strings.'); return a + b; }
      if (![a, b].every(value => typeof value === 'number' || typeof value === 'boolean')) fail('Arithmetic supports numeric operands (or two strings with +).');
      a = Number(a); b = Number(b);
      if (['/', '//', '%'].includes(op) && b === 0) fail('Cannot divide by zero.');
      const result = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : op === '/' ? a / b : op === '//' ? Math.floor(a / b) : a - Math.floor(a / b) * b;
      if (!Number.isFinite(result) || Math.abs(result) > Number.MAX_SAFE_INTEGER) fail('Result is too large for this lesson.');
      return result;
    }
    function evaluate(ast, env, node) {
      limit();
      if (ast.kind === 'literal') return ast.value;
      if (ast.kind === 'name') return lookup(ast.name, env);
      if (ast.kind === 'list') return ast.items.map(item => evaluate(item, env, node));
      if (ast.kind === 'unary') {
        const value = evaluate(ast.value, env, node);
        if (!['number', 'boolean'].includes(typeof value)) fail('Unary + and - require a number.');
        return ast.op === '-' ? -Number(value) : Number(value);
      }
      if (ast.kind === 'binary') {
        const left = evaluate(ast.left, env, node), right = evaluate(ast.right, env, node);
        const value = calculate(ast.op, left, right);
        emit(node, env, 'calculation', 'Evaluate expression', `${format(left)} ${ast.op} ${format(right)} evaluates to ${format(value)}.`, [format(left), ast.op, format(right), '→', format(value)]);
        return value;
      }
      const args = ast.args.map(arg => evaluate(arg, env, node));
      if (ast.name === 'range') {
        if (node.kind !== 'for' || node.values !== ast) fail('Use range() directly after in in a for loop. Range objects outside loops are not supported yet.');
        if (args.length < 1 || args.length > 3 || !args.every(Number.isSafeInteger)) fail('range() needs one to three integers.');
        const [start, stop, stride] = args.length === 1 ? [0, args[0], 1] : [args[0], args[1], args[2] ?? 1];
        if (!stride) fail('range() step cannot be zero.');
        const count = Math.max(0, Math.ceil((stop - start) / stride));
        if (count > 100) fail('Limit range() to 100 values.');
        return Array.from({ length: count }, (_, i) => start + i * stride);
      }
      if (ast.name === 'print') {
        printed.push(args.map(output).join(' '));
        emit(node, env, 'print', 'Send values to the console', `print() displays ${args.map(format).join(', ') || 'a blank line'}.`, [...args.map(format), '→', 'print()', '→', 'Console']);
        return null;
      }
      const definition = functions[ast.name];
      if (Object.hasOwn(env, ast.name) || Object.hasOwn(globals, ast.name)) fail(`${ast.name} is a value, not a callable function.`);
      if (!definition) fail(`Function ${ast.name} is not defined. Supported built-ins: print() and range().`);
      if (args.length !== definition.params.length) fail(`${ast.name}() expects ${definition.params.length} arguments, received ${args.length}.`);
      if (frames.length >= 8 || frames.some(frame => frame.functionName === ast.name)) fail('Recursive calls are not supported yet.');
      const local = Object.fromEntries(definition.params.map((param, i) => [param, args[i]]));
      frames.push({ name: `${ast.name}() · Local`, functionName: ast.name, env: local, localNames: assignedNames(definition.body, new Set(definition.params)) });
      emit(node, local, 'call', `Call ${ast.name}()`, 'Arguments bind to parameters in a new local frame.', args.map((value, i) => `${format(value)} → ${definition.params[i]}`), definition.params);
      const result = execute(definition.body, local);
      const value = result?.value ?? null;
      if (!result) emit(definition, local, 'return', 'Implicit return', `${ast.name}() reaches the end and returns None.`, ['None', '→', 'Caller']);
      frames.pop();
      emit(node, env, 'resume', 'Back to the caller', `${ast.name}() returned ${format(value)}. Its local frame is removed.`, [ast.name + '()', '→', format(value)]);
      return value;
    }
    function execute(nodes, env) {
      for (const node of nodes) {
        try {
          limit();
          if (node.kind === 'assign') {
            // Resolve augmented-assignment targets before evaluating their right-hand side.
            const before = node.op === '=' ? null : lookup(node.name, env);
            let value = evaluate(node.value, env, node);
            if (node.op !== '=') {
              const right = value;
              value = calculate(node.op[0], before, right);
              emit(node, env, 'calculation', 'Update calculation', `${format(before)} ${node.op[0]} ${format(right)} evaluates to ${format(value)}.`, [format(before), node.op[0], format(right), '→', format(value)]);
            }
            const existed = Object.hasOwn(env, node.name);
            env[node.name] = value;
            emit(node, env, 'assignment', existed ? 'Update variable' : 'Create variable', `${node.name} now refers to ${format(value)}.`, [format(value), '→', node.name], [node.name]);
          } else if (node.kind === 'expression') evaluate(node.value, env, node);
          else if (node.kind === 'if') {
            const passed = truth(evaluate(node.test, env, node));
            emit(node, env, 'condition', 'Choose a branch', `The condition is ${format(passed)}. ${passed ? 'Run the if block.' : node.otherwise.length ? 'Run the else block.' : 'Skip the if block.'}`, ['Condition', '→', format(passed), '→', passed ? 'if block' : node.otherwise.length ? 'else block' : 'Skip block']);
            const result = execute(passed ? node.body : node.otherwise, env);
            if (result) return result;
          } else if (node.kind === 'for') {
            const values = evaluate(node.values, env, node);
            if (!Array.isArray(values)) fail('Loop over a list or range().');
            if (values.length > 100) fail('Limit loops to 100 iterations.');
            for (let i = 0; i < values.length; i++) {
              env[node.name] = values[i];
              emit(node, env, 'iteration', `Iteration ${i + 1} of ${values.length}`, `${node.name} takes ${format(values[i])}; run the loop body.`, [format(values), '→', `${node.name} = ${format(values[i])}`], [node.name]);
              const result = execute(node.body, env);
              if (result) return result;
            }
            emit(node, env, 'loop_end', 'Loop complete', values.length ? 'No values remain. Continue after the loop.' : 'The iterable is empty. Skip the loop body.', ['No more values', '→', 'Continue']);
          } else if (node.kind === 'def') {
            if (Object.hasOwn(globals, node.name)) fail('Use a function name that is different from existing variables.');
            functions[node.name] = node;
            emit(node, env, 'definition', `Define ${node.name}()`, 'The function is ready to call. Its body has not run yet.', [`${node.name}(${node.params.join(', ')})`, '→', 'Ready to call']);
          } else if (node.kind === 'return') {
            const value = evaluate(node.value, env, node);
            emit(node, env, 'return', 'Return a value', `Send ${format(value)} back to the caller.`, [format(value), '→', 'Caller']);
            return { value };
          }
        } catch (error) {
          if (/^Line \d+:/.test(error.message)) throw error;
          fail(`Line ${node.line}: ${error.message}`);
        }
      }
    }
    execute(program, globals);
    if (!steps.length) fail('Add an assignment, print(), or a function definition to visualize.');
    return steps;
  }
  return { build };
})();
if (typeof module !== 'undefined') module.exports = PythonLessons;
