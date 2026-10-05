import test from 'node:test';
import assert from 'node:assert/strict';
import { getPhaseById, getExerciseById } from '../src/data/phases.js';
import { buildLearningSnapshot } from '../src/lib/learning.js';
import { gradeChoiceExercise } from '../src/lib/grade.js';
import { startApp } from './helpers.js';

const FUNDAMENTAL_TOPICS = [
  'javascript-core__variables',
  'javascript-core__types',
  'javascript-core__operators',
  'javascript-core__conditionals',
  'javascript-core__loops',
  'javascript-core__functions',
];

test('MVP JavaScript fundamentals exist as curriculum data, not UI components', () => {
  const phase = getPhaseById('javascript-core');
  for (const id of FUNDAMENTAL_TOPICS) {
    assert.ok(phase.topics.some((topic) => topic.id === id), `missing topic ${id}`);
    const topic = phase.topics.find((item) => item.id === id);
    const headings = topic.content.filter((block) => block.type === 'h').map((block) => block.text);
    assert.ok(headings.includes('Definition'));
    assert.ok(headings.includes('Why it matters'));
    assert.ok(headings.includes('Mental model'));
    assert.ok(headings.includes('Common mistakes'));
  }
  assert.equal(getExerciseById('javascript-core__map-bug').exercise.type, 'debug');
  assert.equal(gradeChoiceExercise(getExerciseById('javascript-core__map-bug').exercise, 1).passed, true);
});

test('empty snapshot tells a new learner to Start Phase 0', () => {
  const snapshot = buildLearningSnapshot({
    completed: [],
    topics: [],
    exercises: {},
    quizzes: {},
    misses: {},
    reviews: {},
    learner: null,
  });
  assert.equal(snapshot.current.id, 'environment');
  assert.equal(snapshot.current.label, 'Phase 0');
  assert.equal(snapshot.action.title, 'Start Phase 0.');
});

test('authenticated profile and data-driven shell', async (t) => {
  const { call } = await startApp(t);
  const me = await (await call('/api/profile')).json();
  assert.equal(me.user.username, 'ada');
  assert.equal(me.learner.name, 'Ada');

  const renamed = await call('/api/profile', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Ada Lovelace' }),
  });
  assert.equal(renamed.status, 200);
  assert.equal((await renamed.json()).learner.name, 'Ada Lovelace');

  const shell = await (await call('/api/shell')).json();
  assert.ok(shell.habits.some((habit) => /Foundations before frameworks/i.test(habit.title)));
  assert.ok(shell.projectMilestones.length >= 8);
  assert.match(shell.landing.title, /practice, prove/i);
  assert.match(shell.landing.eyebrow, /apprenticeship/i);

  const rejected = await call('/api/profile', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: '   ' }),
  });
  assert.equal(rejected.status, 400);
});
