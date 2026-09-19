import pathlib
import runpy
import unittest

TRACE = runpy.run_path(str(pathlib.Path(__file__).resolve().parents[1] / 'python-tracer.py'))
run = TRACE['trace_program']


class PythonTracerTests(unittest.TestCase):
    def test_guided_assignments_reassignment_and_prints(self):
        result = run('x = 5\nx = x + 2\nprint(x)\nprint(x * 3)', guided=True)
        self.assertIsNone(result['error'])
        steps = result['steps']
        self.assertEqual([step['line'] for step in steps], [1, 2, 3, 4, 4])
        self.assertEqual(steps[0]['visual']['event'], 'variable_created')
        self.assertEqual(steps[1]['visual']['event'], 'variable_updated')
        self.assertEqual(steps[1]['variables']['x'], '7')
        self.assertEqual(steps[1]['visual']['changes'], [{
            'name': 'x',
            'kind': 'updated',
            'from': {'name': 'x', 'value': '5', 'valueType': 'number', 'typeName': 'int'},
            'to': {'name': 'x', 'value': '7', 'valueType': 'number', 'typeName': 'int'},
        }])
        self.assertEqual(steps[2]['visual']['activeNames'], ['x'])
        self.assertEqual(steps[2]['output'], '7\n')
        self.assertEqual(steps[3]['output'], '7\n21\n')
        self.assertEqual(steps[3]['visual']['printedValues'][0]['value'], repr('21\n'))

    def test_guided_blank_lines_comments_and_multiple_variables(self):
        result = run('# comment\n\na = 2\nb = a * 4\na += 1\nprint(a, b, sep=" / ")', guided=True)
        self.assertEqual([step['line'] for step in result['steps']], [3, 4, 5, 6, 6])
        self.assertEqual(result['steps'][-1]['output'], '3 / 8\n')
        self.assertEqual(result['steps'][-2]['visual']['activeNames'], ['a', 'b'])

    def test_guided_failed_statement_is_not_shown_as_successful(self):
        result = run('x = 3\ny = 1 / 0', guided=True)
        self.assertIn('ZeroDivisionError', result['error'])
        self.assertEqual(result['steps'][0]['variables']['x'], '3')
        self.assertFalse(any(step['line'] == 2 and step['visual']['event'] == 'variable_created' for step in result['steps']))

    def test_guided_function_calls_and_nested_prints(self):
        result = run('def f():\n    print("inside")\n    return 4\nx = f()\nprint(f())', guided=True)
        self.assertIsNone(result['error'])
        self.assertEqual(result['steps'][-1]['output'], 'inside\ninside\n4\n')
        prints = [step for step in result['steps'] if step['visual']['event'] == 'variables_read']
        self.assertEqual([step['visual']['printedValues'][0]['value'] for step in prints], [repr('inside\n'), repr('inside\n'), repr('4\n')])
        assignment = next(step for step in result['steps'] if step['line'] == 4 and step['visual']['event'] == 'variable_created')
        self.assertEqual(assignment['variables']['x'], '4')

    def test_guided_shadowed_print_multiline_and_loops(self):
        result = run('print = lambda x: x\ny = print(2)\nvalues = [\n    1,\n    2\n]\nfor n in values:\n    y += n', guided=True)
        self.assertIsNone(result['error'])
        self.assertEqual(result['steps'][-1]['variables']['y'], '5')
        self.assertFalse(any(step['visual']['event'] == 'variables_read' for step in result['steps']))

    def test_real_python_recursion_comprehensions_and_imports(self):
        result = run('import math\ndef f(n):\n    return 1 if n < 2 else n * f(n-1)\nvalues = {n: f(n) for n in range(3, 6)}\nprint(values, math.sqrt(9))')
        self.assertIsNone(result['error'])
        self.assertEqual(result['steps'][-1]['output'], '{3: 6, 4: 24, 5: 120} 3.0\n')
        self.assertTrue(any(len(step['visual']['scopes']) > 2 for step in result['steps']))

    def test_line_events_are_before_execution_and_final_state_is_after(self):
        result = run('\nx = 1\nx = 2\nprint(x)')
        steps = [step for step in result['steps'] if step['visual']['event'] == 'line']
        self.assertEqual([step['line'] for step in steps], [2, 3, 4])
        self.assertNotIn('x', steps[0]['variables'])
        self.assertEqual(steps[1]['variables']['x'], '1')
        self.assertEqual(steps[2]['variables']['x'], '2')
        self.assertEqual(result['steps'][-1]['output'], '2\n')

    def test_mutation_snapshots_do_not_change_retroactively(self):
        result = run('items = [1]\nitems.append(2)\nprint(items)')
        self.assertEqual(result['steps'][1]['variables']['items'], '[1]')
        self.assertEqual(result['steps'][-1]['variables']['items'], '[1, 2]')

    def test_input_and_partial_output(self):
        result = run('name = input("Name: ")\nprint("Hello", name, end="!")', 'Maya\n')
        self.assertEqual(result['steps'][-1]['output'], 'Name: Hello Maya!')
        self.assertIn('EOFError', run('input()')['error'])

    def test_exceptions_keep_prior_output_and_handled_exceptions_continue(self):
        result = run('print("before")\nx = 1 / 0')
        self.assertIn('ZeroDivisionError', result['error'])
        self.assertEqual(result['steps'][-1]['output'], 'before\n')
        self.assertEqual(result['steps'][-1]['line'], 2)
        caught = run('try:\n    1 / 0\nexcept ZeroDivisionError:\n    print("caught")')
        self.assertIsNone(caught['error'])
        self.assertEqual(caught['steps'][-1]['output'], 'caught\n')

    def test_syntax_errors_and_clean_run_state(self):
        result = run('x = 1\nif :')
        self.assertIn('SyntaxError', result['error'])
        self.assertEqual(result['steps'][-1]['line'], 2)
        run('secret = 5')
        self.assertIn('NameError', run('print(secret)')['error'])

    def test_limits_bound_loops_output_and_source(self):
        result = run('while True:\n    x = 1')
        self.assertIn('Trace limit', result['error'])
        self.assertLessEqual(len(result['steps']), 501)
        output = run('print("x" * 10000)')
        self.assertIn('Output limit', output['error'])
        self.assertEqual(len(output['steps'][-1]['output']), 8000)
        self.assertIn('Source limit', run('#' * 20001)['error'])

    def test_repr_does_not_execute_user_code_and_cycles_are_bounded(self):
        result = run('class Thing:\n    def __repr__(self):\n        raise RuntimeError("do not call")\nthing = Thing()\nitems = []\nitems.append(items)')
        self.assertIsNone(result['error'])
        self.assertEqual(result['steps'][-1]['variables']['thing'], '<Thing>')
        self.assertEqual(result['steps'][-1]['variables']['items'], '[<cycle>]')

    def test_supported_while_elif_classes_and_generator(self):
        result = run('class Counter:\n    def __init__(self):\n        self.value = 2\nc = Counter()\nwhile c.value:\n    c.value -= 1\nif c.value:\n    print("wrong")\nelif c.value == 0:\n    print(sum(n*n for n in range(4)))')
        self.assertIsNone(result['error'])
        self.assertEqual(result['steps'][-1]['output'], '14\n')


if __name__ == '__main__':
    unittest.main()
