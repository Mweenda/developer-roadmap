import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gradeTerminalExercise, publicExercise } from '../src/lib/grade.js';
import { exerciseGuideline } from '../src/data/exercise-brief.js';
import { getExerciseById } from '../src/data/phases.js';
import { resolveGeminiApiKey, firebaseClientConfig } from '../src/lib/firebase-config.js';
import { startFieldnotesAi } from '../src/lib/genkit.js';
import { createSandbox, runSandboxCommand } from '../src/public/js/term.js';
import { startApp, frontendBundle } from './helpers.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('every exercise has a briefing that explains how and what is expected', () => {
  const { exercise } = getExerciseById('environment__commands');
  const brief = exerciseGuideline(exercise);
  assert.match(brief.how, /read the prompt/i);
  assert.match(brief.expected, /correct choice/i);
  assert.equal(brief.prompt, exercise.prompt);
  assert.doesNotMatch(brief.how, /node hello\.js/);
});

test('terminal exercises are graded from the command transcript, never by executing on the server', () => {
  const { exercise } = getExerciseById('environment__shell');
  assert.equal(exercise.type, 'terminal');
  const published = publicExercise(exercise);
  assert.equal(published.expectedCommands, undefined);
  assert.ok(published.guideline.how);
  assert.equal(published.sandbox.cwd, '/home/learner');

  const failed = gradeTerminalExercise(exercise, ['pwd', 'ls']);
  assert.equal(failed.passed, false);
  assert.equal(failed.executed, false);

  const passed = gradeTerminalExercise(exercise, [
    'pwd',
    'mkdir javascript-learning',
    'cd javascript-learning',
    'ls',
    'touch hello.js README.md',
    'git init',
    'git status',
    'git add README.md hello.js',
    'git commit -m "Add hello world and project README"',
  ]);
  assert.equal(passed.passed, true);
  assert.equal(passed.executed, false);
  assert.equal(passed.evaluatedOnServer, true);
});

test('the in-app sandbox records commands and never shells out', () => {
  const sandbox = createSandbox({ cwd: '/home/learner' });
  const mkdir = runSandboxCommand(sandbox, 'mkdir javascript-learning');
  assert.equal(mkdir.ok, true);
  runSandboxCommand(sandbox, 'cd javascript-learning');
  runSandboxCommand(sandbox, 'touch hello.js README.md');
  assert.ok(sandbox.files['/home/learner/javascript-learning/hello.js']);
  assert.deepEqual(sandbox.history.map((item) => item.input), [
    'mkdir javascript-learning',
    'cd javascript-learning',
    'touch hello.js README.md',
  ]);
  assert.equal(sandbox.spawned, false);
});

test('exercise briefing popup, terminal canvas, and Genkit env are in the product', async (t) => {
  const example = await readFile(join(root, '.env.example'), 'utf8');
  assert.match(example, /^GOOGLE_GENAI_API_KEY=/m);
  assert.match(example, /^ENABLE_FIREBASE_MONITORING=/m);
  assert.match(example, /FIREBASE_PROJECT_ID=fieldnotes-apprenticeship/);

  const ui = (await frontendBundle()).text;
  assert.match(ui, /bindExerciseBrief/);
  assert.match(ui, /term-canvas/);
  assert.match(ui, /initializeApp/);
  assert.match(ui, /enableFirebaseTelemetry|bindFirebase/);

  const { call } = await startApp(t);
  const html = await (await call('/')).text();
  assert.match(html, /id="briefLayer"/);
  assert.match(html, /id="briefDialog"/);

  const published = await (await call('/api/phases/environment')).json();
  const shell = published.exercises.find((item) => item.id === 'environment__shell');
  assert.equal(shell.type, 'terminal');
  assert.equal(shell.expectedCommands, undefined);
  assert.match(shell.guideline.how, /sandbox/i);

  const config = await (await call('/api/config')).json();
  assert.equal(config.firebase.projectId, 'fieldnotes-apprenticeship');
  assert.equal(config.googleGenaiApiKey, undefined);
  assert.equal(JSON.stringify(config).includes('GOOGLE_GENAI_API_KEY'), false);

  const graded = await call('/api/exercises/environment__shell/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      commands: getExerciseById('environment__shell').exercise.expectedCommands,
    }),
  });
  const body = await graded.json();
  assert.equal(graded.status, 200);
  assert.equal(body.passed, true);
  assert.equal(body.executed, false);
  assert.equal(body.evaluatedOnServer, true);
});

test('GOOGLE_GENAI_API_KEY aliases GEMINI_API_KEY and Genkit flows are injectable', async () => {
  const previousGoogle = process.env.GOOGLE_GENAI_API_KEY;
  const previousGemini = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GOOGLE_GENAI_API_KEY;
    process.env.GEMINI_API_KEY = 'from-gemini';
    assert.equal(resolveGeminiApiKey(), 'from-gemini');
    process.env.GOOGLE_GENAI_API_KEY = 'from-google';
    assert.equal(resolveGeminiApiKey(), 'from-google');
  } finally {
    if (previousGoogle === undefined) delete process.env.GOOGLE_GENAI_API_KEY;
    else process.env.GOOGLE_GENAI_API_KEY = previousGoogle;
    if (previousGemini === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousGemini;
  }

  assert.equal(firebaseClientConfig().projectId, 'fieldnotes-apprenticeship');

  let telemetryCalls = 0;
  const ai = await startFieldnotesAi({
    apiKey: 'test-key',
    enableTelemetry: true,
    telemetryImpl: () => { telemetryCalls += 1; },
    generateImpl: async ({ prompt }) => `guided:${prompt}`,
  });
  assert.equal(telemetryCalls, 1);
  assert.equal(await ai.generate({ system: 'tutor', prompt: 'Why is this undefined?' }), 'guided:Why is this undefined?');
  assert.equal(typeof ai.tutorFlow, 'function');
});
