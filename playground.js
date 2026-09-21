/* Worker lifecycle is separate from the lesson UI and injectable for tests. */
class PythonPlayground {
  constructor({ createWorker = () => new Worker('./python-worker.js?v=3', { type: 'module' }),
    schedule = (fn, ms) => setTimeout(fn, ms), cancel = id => clearTimeout(id), loadTimeout = 90000, runTimeout = 10000 } = {}) {
    Object.assign(this, { createWorker, schedule, cancel, loadTimeout, runTimeout });
    this.active = null;
  }

  stop(message = 'Execution stopped. You can edit your code and run again.') {
    if (this.active) this.active.finish({ error: message, steps: [] });
  }

  run(source, stdin, onStatus = () => {}, { guided = false } = {}) {
    this.stop();
    if (source.length > 20000 || stdin.length > 8000) {
      return Promise.resolve({ steps: [], error: 'Use at most 20,000 code characters and 8,000 input characters.' });
    }
    return new Promise(resolve => {
      let worker;
      try { worker = this.createWorker(); }
      catch { resolve({ steps: [], error: 'The Python worker could not start. Open CodeScope through a local server or HTTPS site.' }); return; }
      const run = { worker, timer: null, finish: result => {
        if (this.active !== run) return;
        this.cancel(run.timer);
        worker.terminate();
        this.active = null;
        resolve(result);
      } };
      this.active = run;
      const deadline = (duration, message) => {
        this.cancel(run.timer);
        run.timer = this.schedule(() => run.finish({ steps: [], error: message }), duration);
      };
      deadline(this.loadTimeout, 'Python loading timed out. Check your connection and try Run Python again.');
      worker.onmessage = ({ data }) => {
        if (this.active !== run) return;
        if (data.type === 'status') onStatus(data.message);
        if (data.type === 'running') {
          onStatus('Running Python… You can stop execution at any time.');
          deadline(this.runTimeout, 'Execution exceeded 10 seconds and was stopped. Try a smaller example.');
        }
        if (data.type === 'result') run.finish(data.result);
        if (data.type === 'error') run.finish({ steps: [], error: data.message });
      };
      worker.onerror = event => {
        event.preventDefault?.();
        run.finish({ steps: [], error: 'Python could not load or the worker failed. Check your connection and try again.' });
      };
      worker.onmessageerror = () => run.finish({ steps: [], error: 'Could not read Python execution results. Please try again.' });
      try { worker.postMessage({ type: 'run', source, stdin, guided }); }
      catch { run.finish({ steps: [], error: 'Could not send code to Python. Please try again.' }); }
    });
  }
}
if (typeof module !== 'undefined') module.exports = { PythonPlayground };
