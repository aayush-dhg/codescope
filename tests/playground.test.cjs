const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PythonPlayground } = require('../playground.js');
function fixture() {
  const workers = [], timers = new Map();
  let next = 0;
  const runner = new PythonPlayground({
    createWorker: () => {
      const worker = { terminate() { this.terminated = true; }, postMessage(message) { this.sent = message; } };
      workers.push(worker); return worker;
    },
    schedule: (fn, ms) => { const id = ++next; timers.set(id, { fn, ms }); return id; },
    cancel: id => timers.delete(id)
  });
  return { runner, workers, timers, send: data => workers.at(-1).onmessage({data}) };
}
test('successful results terminate worker and clear loading/running timers', async () => {
  const f = fixture(), status = [];
  const pending = f.runner.run('print(1)', '', value => status.push(value));
  assert.equal([...f.timers.values()][0].ms, 90000);
  f.send({type:'running'});
  assert.equal([...f.timers.values()][0].ms, 10000);
  f.send({type:'result',result:{steps:[{output:'1\n'}],error:null}});
  assert.equal((await pending).steps[0].output, '1\n');
  assert.equal(f.workers[0].terminated, true);
  assert.equal(f.timers.size, 0);
  assert.equal(status.length, 1);
});
test('stop cancels a busy worker and allows another run', async () => {
  const f = fixture();
  const first = f.runner.run('while True: pass', '');
  f.runner.stop();
  assert.match((await first).error, /stopped/);
  const second = f.runner.run('print(2)', '');
  f.workers[0].onmessage({data:{type:'result',result:{steps:['stale']}}});
  assert.equal(f.runner.active.worker, f.workers[1]);
  f.send({type:'result',result:{steps:['fresh']}});
  assert.deepEqual((await second).steps, ['fresh']);
});
test('deadline terminates Python even when it sends no events', async () => {
  const f = fixture();
  const pending = f.runner.run('import time; time.sleep(60)', '');
  f.send({type:'running'});
  [...f.timers.values()][0].fn();
  assert.match((await pending).error, /10 seconds/);
  assert.equal(f.workers[0].terminated, true);
});
test('loading failure and worker errors resolve and are retryable', async () => {
  const f = fixture();
  const loading = f.runner.run('print(1)', '');
  [...f.timers.values()][0].fn();
  assert.match((await loading).error, /loading timed out/);
  const failing = f.runner.run('print(1)', '');
  f.workers.at(-1).onerror({preventDefault(){}});
  assert.match((await failing).error, /could not load/);
  assert.equal(f.runner.active, null);
});
test('oversized input and unavailable Worker produce useful errors', async () => {
  const f = fixture();
  assert.match((await f.runner.run('x'.repeat(20001), '')).error, /20,000/);
  assert.equal(f.workers.length, 0);
  const runner = new PythonPlayground({createWorker:()=>{throw new Error('blocked');}});
  assert.match((await runner.run('', '')).error, /local server/);
});
test('default timer functions support successful cleanup', async () => {
  const worker = {postMessage(){}, terminate(){this.terminated=true;}};
  const runner = new PythonPlayground({createWorker:()=>worker});
  const pending = runner.run('print(1)', '');
  worker.onmessage({data:{type:'running'}});
  worker.onmessage({data:{type:'result',result:{steps:[]}}});
  assert.deepEqual(await pending, {steps:[]});
  assert.equal(worker.terminated, true);
});
