import test from 'node:test';
import assert from 'node:assert/strict';
import { isPhaseUnlocked, previousPhaseId, THRESHOLDS } from '../src/data/learning-model.js';
import { buildLearningSnapshot } from '../src/lib/learning.js';
import { startApp } from './helpers.js';

test('later phases stay locked until the previous phase is complete', () => {
  assert.equal(previousPhaseId('environment'), null);
  assert.equal(previousPhaseId('react'), 'auth-security');
  assert.equal(isPhaseUnlocked('environment', []), true);
  assert.equal(isPhaseUnlocked('javascript-core', []), false);
  assert.equal(isPhaseUnlocked('javascript-core', ['environment', 'web-fundamentals']), true);
  assert.equal(THRESHOLDS.quizMastery, 80);
});

test('learning snapshot names the next action and does not treat an opened lesson as mastery', () => {
  const empty = buildLearningSnapshot({ completed: [], topics: [], exercises: {}, quizzes: {}, misses: {}, reviews: {} });
  assert.equal(empty.current.id, 'environment');
  assert.equal(empty.current.state, 'AVAILABLE');
  assert.equal(empty.phases.find((phase) => phase.id === 'react').unlocked, false);
  assert.equal(empty.action.title, 'Start Phase 0.');
  assert.equal(empty.current.mastery, 0);
  assert.equal(empty.overall.progressPercent, 0);
  assert.match(empty.action.href, /\/phase\/environment\/learn\//);

  const afterSection = buildLearningSnapshot({
    completed: [],
    topics: ['environment__terminal'],
    exercises: {},
    quizzes: {},
    misses: {},
    reviews: {},
  });
  assert.ok(afterSection.overall.progressPercent > 0);

  const afterRead = buildLearningSnapshot({
    completed: [],
    topics: ['environment__terminal'],
    exercises: {},
    quizzes: {},
    misses: {},
    reviews: {},
  });
  assert.equal(afterRead.current.state, 'LEARNING');
  assert.notEqual(afterRead.current.state, 'MASTERED');
});

test('a mastered phase becomes REVIEW_DUE when the scheduled review arrives', () => {
  const snapshot = buildLearningSnapshot({
    completed: ['environment'],
    topics: ['environment__terminal', 'environment__git', 'environment__runtime'],
    exercises: {
      environment__commands: { completed: true, passed: true, attempts: 1 },
      environment__shell: { completed: true, passed: true, attempts: 1 },
      environment__hello: { completed: true, passed: true, attempts: 1 },
    },
    quizzes: { environment: { score: 100, passed: true, attempts: 1, missed: [] } },
    misses: {},
    reviews: { environment: new Date(Date.now() - 86400000).toISOString() },
  });
  const env = snapshot.phases.find((phase) => phase.id === 'environment');
  assert.equal(env.state, 'REVIEW_DUE');
  assert.equal(env.reviewDue, true);
});

test('learning API returns the apprenticeship command center', async (t) => {
  const { call } = await startApp(t);

  const response = await call('/api/learning');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.current.id, 'environment');
  assert.ok(body.today.length >= 3);
  assert.equal(body.phases.find((phase) => phase.id === 'react').unlocked, false);

  await call('/api/progress', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phaseId: 'environment', completed: true }),
  });
  const next = await (await call('/api/learning')).json();
  assert.equal(next.phases.find((phase) => phase.id === 'web-fundamentals').unlocked, true);
  assert.equal(next.phases.find((phase) => phase.id === 'javascript-core').unlocked, false);
});
