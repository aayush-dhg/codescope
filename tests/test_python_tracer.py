import pathlib
import runpy
import unittest

TRACE = runpy.run_path(str(pathlib.Path(__file__).resolve().parents[1] / 'python-tracer.py'))
run = TRACE['trace_program']


class PythonTracerTests(unittest.TestCase):
    def test_dictionary_entries_lookup_updates_and_removal(self):
        result = run('profile = {"name": "Maya", "score": 80}\nname = profile["name"]\nprofile["score"] = 95\nprofile["city"] = "Dallas"\nremoved = profile.pop("city")\nprint(name, removed)', guided=True)
        self.assertIsNone(result['error'])
        profiles = [next(obj for obj in step['visual']['objects'] if obj['name'] == 'profile')
                    for step in result['steps'][:5]]
        self.assertEqual(profiles[0]['entries'], [
            {'key': repr('name'), 'value': repr('Maya')},
            {'key': repr('score'), 'value': '80'},
        ])
        self.assertEqual(profiles[2]['entries'][1]['value'], '95')
        self.assertEqual([obj['length'] for obj in profiles], [2, 2, 2, 3, 2])
        self.assertEqual(result['steps'][-1]['output'], 'Maya Dallas\n')
        self.assertEqual(result['steps'][2]['visual']['changes'][0]['from']['entries'][1]['value'], '80')

    def test_tuples_index_unpack_and_create_new_tuple(self):
        result = run('point = (3, 4)\nfirst = point[0]\nx, y = point\nnew_point = point + (5,)\nprint(point, first, x, y, new_point)', guided=True)
        self.assertIsNone(result['error'])
        objects = {obj['name']: obj for obj in result['steps'][-1]['visual']['objects']}
        self.assertEqual(objects['point']['typeName'], 'tuple')
        self.assertEqual(objects['point']['items'], ['3', '4'])
        self.assertEqual(objects['new_point']['items'], ['3', '4', '5'])
        self.assertEqual(result['steps'][-1]['output'], '(3, 4) 3 3 4 (3, 4, 5)\n')
        failed = run('point = (3, 4)\npoint[0] = 9', guided=True)
        self.assertIn('TypeError', failed['error'])
        self.assertEqual(failed['steps'][-1]['variables']['point'], '(3, 4)')
        self.assertFalse(any(s['visual']['event'] == 'variable_updated' for s in failed['steps']))

    def test_sets_uniqueness_membership_noop_and_intersection(self):
        result = run('colors = {"red", "blue", "red"}\ncolors.add("green")\ncolors.add("red")\nhas_blue = "blue" in colors\ncolors.discard("blue")\nshared = colors & {"red", "yellow"}\nprint(len(colors), has_blue)', guided=True)
        self.assertIsNone(result['error'])
        self.assertEqual(result['steps'][0]['visual']['objects'][0]['length'], 2)
        self.assertEqual(result['steps'][1]['visual']['changes'][0]['to']['length'], 3)
        self.assertEqual(result['steps'][2]['visual']['event'], 'executed')
        objects = {obj['name']: obj for obj in result['steps'][-1]['visual']['objects']}
        self.assertEqual(set(objects['colors']['items']), {repr('red'), repr('green')})
        self.assertEqual(objects['shared']['items'], [repr('red')])
        self.assertEqual(result['steps'][-1]['output'], '2 True\n')

    def test_collection_previews_empty_nested_cycles_and_bounds(self):
        objects = TRACE['snapshot']({'empty_dict': {}, 'empty_tuple': (), 'empty_set': set(),
                                     'single': (5,), 'frozen': frozenset({1, 2}),
                                     'large_dict': dict.fromkeys(range(30)),
                                     'large_tuple': tuple(range(30)), 'large_set': set(range(30))})
        values = {obj['name']: obj for obj in objects}
        self.assertEqual(values['empty_dict']['entries'], [])
        self.assertEqual(values['empty_tuple']['items'], [])
        self.assertEqual(values['empty_set']['value'], 'set()')
        self.assertEqual(values['single']['value'], '(5,)')
        self.assertEqual(values['frozen']['typeName'], 'frozenset')
        for name in ('large_dict', 'large_tuple', 'large_set'):
            self.assertEqual(values[name]['length'], 30)
            self.assertEqual(len(values[name].get('entries', values[name].get('items'))), 12)
        circular = {}
        circular['self'] = circular
        self.assertEqual(TRACE['snapshot']({'data': circular})[0]['entries'][0]['value'], '<cycle>')
        nested = TRACE['snapshot']({'point': ([1], {'a': 2})})[0]
        self.assertEqual(nested['items'], ['[1]', "{'a': 2}"])

    def test_collection_errors_preserve_prior_output(self):
        for source, error in [('data = {}\nprint("before")\ndata["missing"]', 'KeyError'),
                              ('values = {1, 2}\nprint("before")\nvalues[0]', 'TypeError'),
                              ('values = set()\nprint("before")\nvalues.add([])', 'TypeError')]:
            result = run(source, guided=True)
            self.assertIn(error, result['error'])
            self.assertEqual(result['steps'][-1]['output'], 'before\n')

    def test_guided_list_lesson_snapshots(self):
        result = run('numbers = [2, 4, 6]\nfirst = numbers[0]\nnumbers[1] = 8\nnumbers.append(10)\nlast = numbers.pop()\nprint(numbers)\nprint(first, last)', guided=True)
        self.assertIsNone(result['error'])
        lists = [next(obj for obj in step['visual']['objects'] if obj['name'] == 'numbers')
                 for step in result['steps'][:5]]
        self.assertEqual([obj['items'] for obj in lists],
                         [['2', '4', '6'], ['2', '4', '6'], ['2', '8', '6'],
                          ['2', '8', '6', '10'], ['2', '8', '6']])
        self.assertEqual(result['steps'][-1]['output'], '[2, 8, 6]\n2 10\n')
        self.assertEqual(result['steps'][3]['visual']['changes'][0]['from']['length'], 3)

    def test_list_previews_are_bounded_and_handle_cycles(self):
        result = run('items = list(range(30))\nitems[8] = 99\nempty = []\nempty.append(empty)', guided=True)
        change = result['steps'][1]['visual']['changes'][0]
        self.assertEqual(change['to']['items'][8], '99')
        self.assertEqual(change['from']['items'][8], '8')
        self.assertEqual(len(change['to']['items']), 12)
        self.assertEqual(change['to']['length'], 30)
        self.assertEqual(result['steps'][-1]['visual']['objects'][1]['items'], ['<cycle>'])
        invalid = run('items = []\nitems.pop()', guided=True)
        self.assertIn('IndexError', invalid['error'])
        self.assertFalse(any(s['line'] == 2 and s['visual']['event'] == 'variable_updated'
                             for s in invalid['steps']))

    def test_guided_assignments_reassignment_and_prints(self):
        result = run('x = 5\nx = x + 2\nprint(x)\nprint(x * 3)', guided=True)
        self.assertIsNone(result['error'])
        steps = result['steps']
        self.assertEqual([step['line'] for step in steps], [1, 2, 2, 3, 4, 4])
        self.assertEqual(steps[0]['visual']['event'], 'variable_created')
        self.assertEqual(steps[1]['visual']['event'], 'expression_evaluated')
        self.assertEqual(steps[1]['visual']['expression'], 'x + 2')
        self.assertEqual(steps[1]['visual']['inputs'], {'x': '5'})
        self.assertEqual(steps[1]['visual']['result'], '7')
        self.assertEqual(steps[1]['variables']['x'], '5')
        self.assertEqual(steps[2]['visual']['event'], 'variable_updated')
        self.assertEqual(steps[2]['variables']['x'], '7')
        self.assertEqual(steps[2]['visual']['changes'], [{
            'name': 'x',
            'kind': 'updated',
            'from': {'name': 'x', 'value': '5', 'valueType': 'number', 'typeName': 'int'},
            'to': {'name': 'x', 'value': '7', 'valueType': 'number', 'typeName': 'int'},
        }])
        self.assertEqual(steps[3]['visual']['activeNames'], ['x'])
        self.assertEqual(steps[3]['output'], '7\n')
        self.assertEqual(steps[4]['output'], '7\n21\n')
        self.assertEqual(steps[4]['visual']['printedValues'][0]['value'], repr('21\n'))

    def test_guided_computed_assignment_emits_expression_then_variable(self):
        result = run('x = 5\ny = 3\ntotal = x + y', guided=True)
        self.assertIsNone(result['error'])
        events = [step['visual']['event'] for step in result['steps']]
        self.assertEqual(events, ['variable_created', 'variable_created',
                                  'expression_evaluated', 'variable_created', 'complete'])
        expression = result['steps'][2]
        self.assertEqual(expression['line'], 3)
        self.assertEqual(expression['visual']['inputs'], {'x': '5', 'y': '3'})
        self.assertEqual(expression['visual']['result'], '8')
        self.assertNotIn('total', expression['variables'])
        self.assertEqual(result['steps'][3]['variables']['total'], '8')

    def test_guided_blank_lines_comments_and_multiple_variables(self):
        result = run('# comment\n\na = 2\nb = a * 4\na += 1\nprint(a, b, sep=" / ")', guided=True)
        self.assertEqual([step['line'] for step in result['steps']], [3, 4, 4, 5, 6, 6])
        self.assertEqual(result['steps'][-1]['output'], '3 / 8\n')
        self.assertEqual(result['steps'][-2]['visual']['activeNames'], ['a', 'b'])

    def test_guided_failed_statement_is_not_shown_as_successful(self):
        result = run('x = 3\ny = 1 / 0', guided=True)
        self.assertIn('ZeroDivisionError', result['error'])
        self.assertEqual(result['steps'][0]['variables']['x'], '3')
        self.assertFalse(any(step['line'] == 2 and step['visual']['event'] == 'variable_created' for step in result['steps']))
        self.assertFalse(any(step['line'] == 2 and step['visual']['event'] == 'expression_evaluated' for step in result['steps']))

    def test_guided_function_calls_and_nested_prints(self):
        result = run('def f():\n    print("inside")\n    return 4\nx = f()\nprint(f())', guided=True)
        self.assertIsNone(result['error'])
        self.assertEqual(result['steps'][-1]['output'], 'inside\ninside\n4\n')
        prints = [step for step in result['steps'] if step['visual']['event'] == 'variables_read']
        self.assertEqual([step['visual']['printedValues'][0]['value'] for step in prints], [repr('inside\n'), repr('inside\n'), repr('4\n')])
        assignment = next(step for step in result['steps'] if step['line'] == 4 and step['visual']['event'] == 'variable_created')
        self.assertEqual(assignment['variables']['x'], '4')

    def test_guided_function_definition_call_bindings_and_return(self):
        result = run('def add(a, b):\n    result = a + b\n    return result\n\nanswer = add(3, 4)', guided=True)
        self.assertIsNone(result['error'])
        events = [step['visual']['event'] for step in result['steps']]
        self.assertEqual(events, [
            'function_defined', 'function_called', 'expression_evaluated',
            'variable_created', 'function_returned', 'variable_created', 'complete'
        ])
        defined, called = result['steps'][:2]
        returned = result['steps'][4]
        self.assertEqual(defined['visual']['parameters'], ['a', 'b'])
        self.assertEqual([(item['name'], item['value']) for item in called['visual']['bindings']],
                         [('a', '3'), ('b', '4')])
        self.assertEqual(called['visual']['callDepth'], 1)
        self.assertEqual(returned['line'], 3)
        self.assertEqual(returned['visual']['returnedValue']['value'], '7')
        self.assertEqual(result['steps'][5]['variables']['answer'], '7')

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
