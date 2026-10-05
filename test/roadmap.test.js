import test from 'node:test';
import assert from 'node:assert/strict';
import { phases, getPhaseById, getExerciseById, getTopicById, listDocs } from '../src/data/phases.js';

test('roadmap has 17 ordered phases and phase documentation', () => {
  assert.equal(phases.length, 17);
  assert.equal(phases[0].id, 'environment');
  assert.equal(phases[7].id, 'databases-sql');
  assert.equal(phases[8].id, 'express-api');
  for (const phase of phases) {
    assert.ok(phase.title, `${phase.id} has a title`);
    assert.ok(phase.expected.length >= 2, `${phase.id} has expectations`);
    assert.ok(phase.snippets.length >= 1, `${phase.id} has a code snippet`);
    assert.ok(phase.resources.length >= 1, `${phase.id} has documentation links`);
    assert.ok(phase.topics.length >= 1, `${phase.id} has documentation lessons`);
    assert.ok(phase.exercises.length >= 2, `${phase.id} has exercises`);
    assert.ok(phase.quiz.questions.length >= 5, `${phase.id} has a quiz`);
    assert.equal(phase.quiz.id, phase.id);
    for (const question of phase.quiz.questions) {
      assert.ok(question.choices.length >= 2, `${phase.id} ${question.id} has choices`);
      assert.ok(Number.isInteger(question.answer));
      assert.ok(question.answer >= 0 && question.answer < question.choices.length);
    }
  }
});

test('phase lookup returns a matching phase or null', () => {
  assert.equal(getPhaseById('javascript-core').title, 'JavaScript core');
  assert.equal(getPhaseById('no-such-phase'), null);
});

test('javascript core documentation and exercises are the source of truth', () => {
  const phase = getPhaseById('javascript-core');
  assert.ok(phase.snippets[0].code.includes('map('));
  assert.ok(phase.topics.some((topic) => topic.id === 'javascript-core__scope'));
  assert.equal(getTopicById('javascript-core__scope').phase.id, 'javascript-core');
  assert.equal(getExerciseById('javascript-core__active-names').exercise.functionName, 'activeNames');
  assert.ok(listDocs().length >= 17);
});
