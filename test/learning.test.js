import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeQuiz, gradeChoiceExercise, publicPhase } from '../src/lib/grade.js';
import { getPhaseById, getExerciseById } from '../src/data/phases.js';
import { deepEqual } from '../src/lib/equal.js';

test('quiz grading requires a passing score and hides answers in public phases', () => {
  const phase = getPhaseById('javascript-core');
  const perfect = Object.fromEntries(phase.quiz.questions.map((question) => [question.id, question.answer]));
  const graded = gradeQuiz(phase.quiz, perfect);
  assert.equal(graded.passed, true);
  assert.equal(graded.score, 100);

  const empty = gradeQuiz(phase.quiz, {});
  assert.equal(empty.passed, false);

  const published = publicPhase(phase);
  assert.equal(published.quiz.questions[0].answer, undefined);
  assert.ok(published.exercises.find((exercise) => exercise.id === 'javascript-core__active-names').tests[0].expected);
  assert.equal(published.exercises.find((exercise) => exercise.id === 'javascript-core__active-names').solution, undefined);
});

test('choice exercises and deep equality support the in-app runner', () => {
  const { exercise } = getExerciseById('javascript-core__closure');
  assert.equal(gradeChoiceExercise(exercise, exercise.answer).passed, true);
  assert.equal(gradeChoiceExercise(exercise, 0).passed, false);
  assert.equal(deepEqual({ fulfilled: [1, 2], rejected: ['nope'] }, { rejected: ['nope'], fulfilled: [1, 2] }), true);
  assert.equal(deepEqual([1, 2], [1, 3]), false);
});
