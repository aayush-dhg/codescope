"""Bounded, observational snapshots for CodeScope's real-Python Playground.

Default line events describe state BEFORE the highlighted line. Guided mode
reports completed simple statements with assignment and print animations.
Only the user's source is traced; imports execute normally without filling the timeline with internals.
This is a teaching tracer, not a security boundary for hostile Python.
"""
import ast
import builtins
import contextlib
import io
import itertools
import json
import sys
import types


class TraceLimit(BaseException):
    pass


def preview(value, depth=0, seen=None):
    """Do not invoke user-defined __repr__ or traverse unbounded containers."""
    kind = type(value)
    if kind is str:
        return repr(value[:120]) + ('…' if len(value) > 120 else '')
    if kind is int:
        return str(value) if value.bit_length() < 512 else '<large int>'
    if kind in (float, bool, complex, type(None)):
        return repr(value)
    if kind is bytes:
        return repr(value[:80]) + ('…' if len(value) > 80 else '')
    if kind in (list, tuple, dict, set, frozenset):
        seen = set() if seen is None else seen
        if id(value) in seen:
            return '<cycle>'
        if depth >= 2:
            return '<%s, %d items>' % (kind.__name__, len(value))
        seen = seen | {id(value)}
        if kind is dict:
            parts = [preview(k, depth + 1, seen) + ': ' + preview(v, depth + 1, seen)
                     for k, v in itertools.islice(value.items(), 6)]
            left, right = '{', '}'
        else:
            parts = [preview(v, depth + 1, seen) for v in itertools.islice(value, 6)]
            left, right = ('[', ']') if kind is list else ('(', ')') if kind is tuple else ('{', '}')
        if len(value) > 6:
            parts.append('…')
        text = left + ', '.join(parts) + (',' if kind is tuple and len(value) == 1 else '') + right
        if kind is set and not value:
            text = 'set()'
        if kind is frozenset:
            text = 'frozenset(' + text + ')'
        return text[:240]
    if kind is types.FunctionType:
        return '<function %s>' % value.__name__
    return '<%s>' % type.__getattribute__(kind, '__name__')


def snapshot(namespace):
    result = []
    for name, value in namespace.items():
        if not isinstance(name, str) or name == '__builtins__' or name.startswith('__'):
            continue
        if len(result) == 25:
            result.append({'name': '…', 'value': 'More variables omitted', 'valueType': 'summary'})
            break
        kind = type(value)
        value_type = 'boolean' if kind is bool else 'number' if kind in (int, float, complex) else 'list' if kind in (list, tuple, dict, set, frozenset) else 'string'
        result.append({'name': name[:120], 'value': preview(value), 'valueType': value_type,
                       'typeName': type.__getattribute__(kind, '__name__')})
    return result


def trace_program(source, stdin='', guided=False):
    filename = 'playground.py'
    steps = []
    namespace = {'__name__': '__main__'}
    captured = []
    output_size = 0
    snapshot_size = 0
    last_line = 1
    error = None
    lines = source.splitlines()
    statements = {}
    pending = {}
    written = {}

    class Output(io.TextIOBase):
        def writable(self):
            return True

        def write(self, text):
            nonlocal output_size
            room = max(0, 8000 - output_size)
            captured.append(text[:room])
            if guided:
                caller = sys._getframe(1)
                if id(caller) in pending:
                    written.setdefault(id(caller), []).append(text[:room])
            output_size += min(len(text), room)
            if len(text) > room:
                raise TraceLimit('Output limit reached (8,000 characters).')
            return len(text)

    def scopes_for(frame):
        frames = []
        while frame is not None:
            if frame.f_code.co_filename == filename and frame.f_code.co_name != '<module>':
                frames.append(frame)
            frame = frame.f_back
        scopes = [{'name': 'Global', 'objects': snapshot(namespace)}]
        if len(frames) > 7:
            scopes.append({'name': 'Earlier frames omitted', 'objects': []})
        for frame in reversed(frames[:7]):
            scopes.append({'name': frame.f_code.co_name + '() · Local', 'objects': snapshot(frame.f_locals)})
        return scopes

    def add_step(line, event, title, detail, scopes, flow, bounded=True, active=None, printed=None,
                 changes=None, expression=None, metadata=None):
        nonlocal snapshot_size
        output = ''.join(captured)
        objects = scopes[-1]['objects']
        previous_scopes = steps[-1]['visual']['scopes'] if steps else []
        same_frame = (len(previous_scopes) == len(scopes) and
                      [scope['name'] for scope in previous_scopes] == [scope['name'] for scope in scopes])
        previous = {obj['name']: obj['value'] for obj in previous_scopes[-1]['objects']} if same_frame else {}
        changed = [obj['name'] for obj in objects if previous.get(obj['name']) != obj['value']]
        step = {'line': max(1, line), 'explanation': detail, 'execution': detail,
                'variables': {obj['name']: obj['value'] for obj in objects},
                'output': output, 'hasOutput': bool(output),
                'visual': {'lesson': True, 'event': event, 'title': title, 'detail': detail,
                           'flow': flow, 'activeNames': changed if active is None else active,
                           'objects': objects, 'scopes': scopes}}
        if printed is not None:
            step['visual']['printedValues'] = [{'value': preview(printed), 'valueType': 'string', 'typeName': 'output'}]
        if changes:
            step['visual']['changes'] = changes
        if expression:
            step['visual'].update(expression)
        if metadata:
            step['visual'].update(metadata)
        snapshot_size += len(json.dumps(step))
        if bounded and (len(steps) >= 500 or snapshot_size > 2_000_000):
            raise TraceLimit('Trace limit reached (500 events or 2 MB of snapshots). Try a smaller example.')
        steps.append(step)

    def finish_line(frame):
        record = pending.pop(id(frame), None)
        if record is None:
            return
        line, before, reads, is_print, expression_info, function_definition = record
        scopes = scopes_for(frame)
        current = {obj['name']: obj for obj in scopes[-1]['objects']}
        changed = [name for name in current if current[name] != before.get(name)]
        removed = [name for name in before if name not in current]
        output_delta = ''.join(written.pop(id(frame), []))
        if function_definition and function_definition['name'] in current:
            signature = '%s(%s)' % (function_definition['name'], ', '.join(function_definition['parameters']))
            detail = 'Python defines %s. Its body will run only when the function is called.' % signature
            add_step(line, 'function_defined', 'Define ' + signature, detail, scopes,
                     [signature, '→', 'Ready to call'], active=[function_definition['name']],
                     metadata={'functionName': function_definition['name'],
                               'parameters': function_definition['parameters']})
        elif is_print and output_delta:
            detail = 'print() reads its arguments and writes %s to the console.' % preview(output_delta)
            add_step(line, 'variables_read', 'Values sent to print()', detail, scopes,
                     [preview(output_delta), '→', 'print()', '→', 'Console'],
                     active=reads, printed=output_delta)
        elif changed or removed:
            if expression_info and expression_info['target'] in current:
                result = current[expression_info['target']]['value']
                inputs = expression_info['inputs']
                input_text = ', '.join('%s = %s' % item for item in inputs.items())
                detail = ('Python reads %s. ' % input_text if input_text else '')
                detail += '%s evaluates to %s.' % (expression_info['source'], result)
                expression_scopes = [dict(scope) for scope in scopes]
                expression_scopes[-1]['objects'] = list(before.values())
                flow = ['%s = %s' % item for item in inputs.items()]
                flow += [expression_info['source'], '→', result]
                add_step(line, 'expression_evaluated', 'Evaluate expression', detail,
                         expression_scopes, flow, active=list(inputs), expression={
                             'expression': expression_info['source'],
                             'inputs': inputs,
                             'result': result,
                         })
            descriptions = [('%s changes from %s to %s.' % (name, before[name]['value'], current[name]['value'])
                             if name in before else '%s is created with %s.' % (name, current[name]['value']))
                            for name in changed]
            descriptions += ['%s is removed from this scope.' % name for name in removed]
            changes = [
                {'name': name, 'kind': 'updated' if name in before else 'created',
                 'from': before.get(name), 'to': current[name]}
                for name in changed
            ]
            changes += [{'name': name, 'kind': 'removed', 'from': before[name], 'to': None}
                        for name in removed]
            add_step(line, 'variable_updated' if any(name in before for name in changed) or removed else 'variable_created',
                     'Variables after line %d' % line, ' '.join(descriptions), scopes,
                     ['%s → %s' % (name, current[name]['value']) for name in changed] or ['Name removed'],
                     active=changed, changes=changes)
        else:
            add_step(line, 'executed', 'After line %d' % line,
                     'Line %d finished. The visible variable previews are unchanged.' % line,
                     scopes, [lines[line - 1].strip()[:240]], active=[])

    def trace(frame, event, arg):
        nonlocal last_line
        if frame.f_code.co_filename != filename:
            return None
        last_line = frame.f_lineno
        if guided:
            if event in ('line', 'return'):
                finish_line(frame)
            elif event == 'exception':
                # A failing statement must not be described as successfully executed.
                pending.pop(id(frame), None)
                written.pop(id(frame), None)
        if event == 'line':
            nodes = statements.get(last_line, [])
            simple = (ast.Assign, ast.AnnAssign, ast.AugAssign, ast.Expr, ast.Delete, ast.Import, ast.ImportFrom, ast.Pass)
            is_definition = (len(nodes) == 1 and isinstance(nodes[0], (ast.FunctionDef, ast.AsyncFunctionDef)))
            is_return = (len(nodes) == 1 and isinstance(nodes[0], ast.Return))
            if guided and is_return:
                # The return event below contains the actual value, so avoid a redundant before-line step.
                return trace
            if guided and nodes and (is_definition or
                                     all(isinstance(node, simple) and node.end_lineno == last_line for node in nodes)):
                node = nodes[0]
                is_print = (len(nodes) == 1 and isinstance(node, ast.Expr) and isinstance(node.value, ast.Call)
                            and isinstance(node.value.func, ast.Name) and node.value.func.id == 'print'
                            and frame.f_locals.get('print', frame.f_globals.get('print', builtins.print)) is builtins.print)
                reads = [arg.id for arg in node.value.args if isinstance(arg, ast.Name)] if is_print else []
                before = {obj['name']: obj for obj in snapshot(frame.f_locals)}
                expression_info = None
                function_definition = None
                if is_definition:
                    function_definition = {
                        'name': node.name,
                        'parameters': [argument.arg for argument in
                                       (node.args.posonlyargs + node.args.args + node.args.kwonlyargs)],
                    }
                value = (node.value if isinstance(node, (ast.Assign, ast.AnnAssign)) else None)
                target = None
                if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
                    target = node.targets[0].id
                elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
                    target = node.target.id
                if target and value is not None and any(isinstance(part, ast.BinOp) for part in ast.walk(value)):
                    names = []
                    for part in ast.walk(value):
                        if isinstance(part, ast.Name) and isinstance(part.ctx, ast.Load) and part.id not in names:
                            names.append(part.id)
                    inputs = {}
                    for name in names:
                        if name in frame.f_locals:
                            inputs[name] = preview(frame.f_locals[name])
                        elif name in frame.f_globals:
                            inputs[name] = preview(frame.f_globals[name])
                    expression_info = {
                        'target': target,
                        'source': ast.get_source_segment(source, value) or '<expression>',
                        'inputs': inputs,
                    }
                pending[id(frame)] = (last_line, before, reads, is_print, expression_info, function_definition)
                return trace
            text = lines[last_line - 1].strip() if 0 < last_line <= len(lines) else ''
            add_step(last_line, 'line', 'Before line %d' % last_line,
                     'About to execute line %d. Variables and output show the state before this line.' % last_line,
                     scopes_for(frame), [text[:240]])
        elif event == 'call' and frame.f_code.co_name != '<module>':
            scopes = scopes_for(frame)
            bindings = scopes[-1]['objects']
            binding_text = ', '.join('%s to %s' % (item['value'], item['name']) for item in bindings)
            detail = 'Python creates a local frame for %s().' % frame.f_code.co_name
            if binding_text:
                detail += ' It binds ' + binding_text + '.'
            flow = []
            for item in bindings:
                flow.extend([item['value'], '→', item['name']])
            add_step(last_line, 'function_called', 'Call ' + frame.f_code.co_name + '()', detail,
                     scopes, flow or [frame.f_code.co_name + '()', '→', 'Local frame'],
                     active=[item['name'] for item in bindings], metadata={
                         'functionName': frame.f_code.co_name,
                         'bindings': bindings,
                         'callDepth': len(scopes) - 1,
                     })
        elif event == 'return' and frame.f_code.co_name != '<module>':
            # Python also emits return events when a generator yields or an exception unwinds.
            returned = snapshot({'returnValue': arg})[0]
            add_step(last_line, 'function_returned', 'Return from ' + frame.f_code.co_name + '()',
                     '%s() returns %s to its caller.' % (frame.f_code.co_name, returned['value']),
                     scopes_for(frame), [frame.f_code.co_name + '()', 'returns', returned['value']],
                     active=[], metadata={
                         'functionName': frame.f_code.co_name,
                         'returnedValue': returned,
                     })
        elif event == 'exception':
            add_step(last_line, 'exception', 'Exception raised',
                     arg[0].__name__ + ' raised here; a surrounding handler may catch it.',
                     scopes_for(frame), [arg[0].__name__, '→', 'Check exception handlers'])
        return trace

    old_trace = sys.gettrace()
    old_stdin = sys.stdin
    try:
        if len(source) > 20000:
            raise TraceLimit('Source limit reached (20,000 characters).')
        code = compile(source, filename, 'exec')
        if guided:
            for node in ast.walk(ast.parse(source, filename)):
                if isinstance(node, ast.stmt):
                    statements.setdefault(node.lineno, []).append(node)
        sys.stdin = io.StringIO(stdin)
        with contextlib.redirect_stdout(Output()), contextlib.redirect_stderr(Output()):
            sys.settrace(trace)
            try:
                exec(code, namespace, namespace)
            finally:
                sys.settrace(old_trace)
    except BaseException as exc:
        if not (isinstance(exc, SystemExit) and exc.code in (None, 0)):
            if isinstance(exc, SyntaxError):
                last_line = exc.lineno or 1
            # Bound potentially lengthy exception messages; custom __str__ remains subject
            # to the worker's wall-clock timeout.
            error = '%s: %s' % (type(exc).__name__, str(exc)[:600])
    finally:
        sys.settrace(old_trace)
        sys.stdin = old_stdin
    add_step(last_line, 'error' if error else 'complete', 'Execution stopped' if error else 'Execution complete',
             error or 'Program finished. Final global variables and console output are shown below.',
             [{'name': 'Global', 'objects': snapshot(namespace)}],
             ['Stopped' if error else 'Finished'], bounded=False)
    return {'steps': steps, 'error': error}
