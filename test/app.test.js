import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, frontendBundle } from './helpers.js';
import { getPhaseById, getExerciseById } from '../src/data/phases.js';

test('API serves roadmap documentation and persists progress', async (t) => {
  const { call } = await startApp(t);

  const home = await call('/');
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Full-stack JavaScript/);
  const frontendScript = await call('/app.js');
  assert.equal(frontendScript.status, 200);
  assert.match((await frontendBundle()).text, /renderQuiz/);

  const roadmap = await call('/api/phases');
  assert.equal(roadmap.status, 200);
  assert.equal((await roadmap.json()).phases.length, 17);

  const doc = await call('/api/phases/javascript-core');
  assert.equal(doc.status, 200);
  const phase = await doc.json();
  assert.ok(phase.expected.length);
  assert.ok(phase.snippets[0].code.includes('map('));
  assert.equal(phase.quiz.questions[0].answer, undefined);
  assert.equal(phase.quiz.questions[0].explanation, undefined);
  assert.ok(phase.topics.length >= 3);
  assert.ok(phase.exercises.length >= 2);

  const invalid = await call('/api/progress', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phaseId: 'unknown', completed: true }) });
  assert.equal(invalid.status, 400);
  const saved = await call('/api/progress', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phaseId: 'javascript-core', completed: true }) });
  assert.equal(saved.status, 200);
  assert.deepEqual((await saved.json()).completed, ['javascript-core']);
  assert.deepEqual((await (await call('/api/progress')).json()).completed, ['javascript-core']);
});

test('quizzes are graded on the server and documentation is listed', async (t) => {
  const { call } = await startApp(t);
  const phase = getPhaseById('environment');
  const answers = Object.fromEntries(phase.quiz.questions.map((question) => [question.id, question.answer]));
  const passed = await call('/api/phases/environment/quiz', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  assert.equal(passed.status, 200);
  const body = await passed.json();
  assert.equal(body.passed, true);
  assert.equal(body.score, 100);
  assert.ok(body.results[0].explanation);

  const failed = await call('/api/phases/environment/quiz', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ answers: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 } }),
  });
  assert.equal((await failed.json()).passed, false);

  const docs = await call('/api/docs');
  assert.equal(docs.status, 200);
  const catalog = await docs.json();
  assert.ok(catalog.articles.length >= 17);
  const article = await call(`/api/docs/${encodeURIComponent(catalog.articles[0].id)}`);
  assert.equal(article.status, 200);
  assert.ok((await article.json()).content.length);

  const library = await call('/api/library');
  assert.equal(library.status, 200);
  const shelf = await library.json();
  assert.equal(shelf.categories.length, 8);
  assert.ok(shelf.sources.some((source) => source.id === 'mdn-guide' && source.url.includes('developer.mozilla.org')));
  const mdn = await call('/api/library/mdn-guide');
  assert.equal(mdn.status, 200);
  assert.match((await mdn.json()).rule, /JavaScript feature/);
});

test('choice exercises grade answers and code solutions stay hidden until revealed', async (t) => {
  const { call } = await startApp(t);
  const { exercise } = getExerciseById('environment__commands');
  const wrong = await call('/api/exercises/environment__commands/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ selected: 0 }),
  });
  const wrongBody = await wrong.json();
  assert.equal(wrong.status, 200);
  assert.equal(wrongBody.passed, false);
  assert.equal(wrongBody.answer, exercise.answer);

  const right = await call('/api/exercises/environment__commands/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ selected: exercise.answer }),
  });
  assert.equal((await right.json()).passed, true);

  const publicPhase = await (await call('/api/phases/javascript-core')).json();
  const codeExercise = publicPhase.exercises.find((item) => item.id === 'javascript-core__active-names');
  assert.equal(codeExercise.solution, undefined);

  const reveal = await call('/api/exercises/javascript-core__active-names/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reveal: true }),
  });
  assert.match((await reveal.json()).solution, /filter/);
});

test('a phase auto-completes after its exercises and quiz are passed', async (t) => {
  const { call } = await startApp(t);
  const phase = getPhaseById('environment');
  for (const exercise of phase.exercises) {
    const body = exercise.type === 'build'
      ? { completed: true }
      : exercise.type === 'terminal'
        ? { commands: exercise.expectedCommands }
        : exercise.type === 'code'
          ? { passed: true }
          : { selected: exercise.answer };
    const response = await call(`/api/exercises/${exercise.id}/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).passed, true);
  }
  const answers = Object.fromEntries(phase.quiz.questions.map((question) => [question.id, question.answer]));
  const quiz = await call('/api/phases/environment/quiz', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  const result = await quiz.json();
  assert.equal(result.passed, true);
  assert.ok(result.progress.completed.includes('environment'));
});
