import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressStore } from '../src/server/progress-store.js';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const empty = { completed: [], topics: [], exercises: {}, quizzes: {}, misses: {}, reviews: {}, projectReviews: {}, hints: {}, learner: null, updatedAt: null };

test('progress store starts empty, persists updates, and validates phase ids', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'roadmap-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'progress.json');
  const store = createProgressStore(path, ['environment', 'javascript-core'], {
    topicIds: ['javascript-core__scope'],
    exerciseIds: ['javascript-core__active-names'],
    quizIds: ['javascript-core'],
  });
  assert.deepEqual(await store.get(), empty);
  const saved = await store.update('javascript-core', true);
  assert.deepEqual(saved.completed, ['javascript-core']);
  assert.ok(saved.updatedAt);
  assert.deepEqual(JSON.parse(await readFile(path, 'utf8')).byUser.default.completed, ['javascript-core']);
  assert.deepEqual((await store.update('javascript-core', false)).completed, []);
  await assert.rejects(store.update('unknown-phase', true), { code: 'INVALID_PHASE' });

  const withTopic = await store.completeTopic('javascript-core__scope', true);
  assert.deepEqual(withTopic.topics, ['javascript-core__scope']);
  const withExercise = await store.recordExercise('javascript-core__active-names', { completed: true, passed: true });
  assert.equal(withExercise.exercises['javascript-core__active-names'].passed, true);
  const withQuiz = await store.recordQuiz('javascript-core', { score: 80, passed: true });
  assert.equal(withQuiz.quizzes['javascript-core'].score, 80);
  assert.ok(withQuiz.reviews['javascript-core']);
  assert.deepEqual(withQuiz.misses['javascript-core'], []);
  await assert.rejects(store.completeTopic('missing', true), { code: 'INVALID_TOPIC' });
});
