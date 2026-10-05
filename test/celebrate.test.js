import test from 'node:test';
import assert from 'node:assert/strict';
import { getPhaseById } from '../src/data/phases.js';
import { stageNavigation, celebrationCopy } from '../src/public/js/stage.js';
import { celebrate } from '../src/data/celebrate.js';
import { startApp, frontendBundle } from './helpers.js';

const env = getPhaseById('environment');
const firstTopic = env.topics[0];
const secondTopic = env.topics[1];
const firstExercise = env.exercises[0];

test('proceed stays locked until the current lesson or exercise is complete', () => {
  const empty = { completed: [], topics: [], exercises: {}, quizzes: {} };
  const lesson = stageNavigation(env, empty, { kind: 'topic', topicId: firstTopic.id });
  assert.equal(lesson.next.enabled, false);
  assert.equal(lesson.back.href, `#/phase/${env.id}`);
  assert.match(lesson.next.href, new RegExp(secondTopic.id));

  const afterLesson = stageNavigation(env, { ...empty, topics: [firstTopic.id] }, { kind: 'topic', topicId: firstTopic.id });
  assert.equal(afterLesson.next.enabled, true);

  const drill = stageNavigation(env, empty, { kind: 'exercise', exerciseId: firstExercise.id });
  assert.equal(drill.next.enabled, false);
  const passed = stageNavigation(env, {
    ...empty,
    exercises: { [firstExercise.id]: { passed: true, completed: true } },
  }, { kind: 'exercise', exerciseId: firstExercise.id });
  assert.equal(passed.next.enabled, true);
});

test('celebration copy is stage-aware and never spoils the answer', () => {
  const pass = celebrationCopy({
    kind: 'exercise',
    phase: env,
    exercise: firstExercise,
    explanation: 'Node reads the file and executes it.',
  });
  assert.match(pass.title, /proved|correct|passed/i);
  assert.match(pass.insight, /Developer environment|Node/i);
  assert.doesNotMatch(pass.insight, /npm hello\.js/);
  assert.equal(pass.backLabel, celebrate.backLabel);
  assert.equal(pass.nextLabel, celebrate.nextLabel);
});

test('pass UI includes fireworks overlay, center dialog, and stage nav', async (t) => {
  const ui = (await frontendBundle()).text;
  assert.match(ui, /celebratePass|fireworks|celebrate-dialog/);
  assert.match(ui, /stage-nav/);
  const { call } = await startApp(t);
  const html = await (await call('/')).text();
  assert.match(html, /id="celebrateLayer"/);
  assert.match(html, /id="fireworks"/);
  assert.match(html, /id="celebrateDialog"/);
  const shell = await (await call('/api/shell')).json();
  assert.equal(shell.celebrate.backLabel, 'Go back');
  assert.equal(shell.celebrate.nextLabel, 'Proceed');
});
