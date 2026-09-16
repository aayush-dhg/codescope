/* Fresh worker per run: terminating it stops Python even in an untraced native call. */
const PYODIDE_ROOT = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
self.onmessage = async ({ data }) => {
  if (data.type !== 'run') return;
  try {
    self.postMessage({ type: 'status', message: 'Loading Python… The first run downloads the runtime.' });
    const { loadPyodide } = await import(PYODIDE_ROOT + 'pyodide.mjs');
    const pyodide = await loadPyodide({ indexURL: PYODIDE_ROOT, stdin: () => null });
    const response = await fetch(new URL('./python-tracer.py?v=1', self.location.href));
    if (!response.ok) throw new Error('Could not load the Python tracer. Refresh and try again.');
    pyodide.runPython(await response.text());
    pyodide.globals.set('_codescope_source', data.source);
    pyodide.globals.set('_codescope_stdin', data.stdin || '');
    self.postMessage({ type: 'running' });
    const result = pyodide.runPython('json.dumps(trace_program(_codescope_source, _codescope_stdin))');
    self.postMessage({ type: 'result', result: JSON.parse(result) });
  } catch (error) {
    self.postMessage({ type: 'error', message: 'Python could not run: ' + String(error.message || error).slice(0, 1200) });
  }
};
