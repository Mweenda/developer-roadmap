import { deepEqual } from './html.js';

export const RUNNER_TIMEOUT_MS = 800;

export async function runIsolated(source, functionName, args, timeoutMs = RUNNER_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const worker = new Worker('/runner.js');
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ timedOut: true, error: `Timed out after ${timeoutMs}ms` });
    }, timeoutMs);
    worker.onmessage = (event) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(event.data);
    };
    worker.onerror = (event) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, error: event.message || 'Worker failed' });
    };
    worker.postMessage({ source, functionName, args });
  });
}

export async function runCodeExercise(exercise, source) {
  const results = [];
  for (const test of exercise.tests) {
    const outcome = await runIsolated(source, exercise.functionName, test.args, RUNNER_TIMEOUT_MS);
    if (outcome.timedOut) {
      results.push({ label: test.label, pass: false, error: outcome.error });
      continue;
    }
    if (outcome.ok === false) {
      results.push({ label: test.label, pass: false, error: outcome.error });
      continue;
    }
    const pass = deepEqual(outcome.actual, test.expected);
    results.push({ label: test.label, pass, expected: test.expected, actual: outcome.actual });
  }
  return results;
}
