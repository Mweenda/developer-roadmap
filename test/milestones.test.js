import test from 'node:test';
import assert from 'node:assert/strict';
import { SANDBOX, runFunction } from '../src/lib/sandbox.js';
import { buildAdaptive } from '../src/lib/adaptive.js';
import { scoreProject, REVIEW_CRITERIA } from '../src/lib/project-review.js';
import { gitWorkflow } from '../src/data/git-workflow.js';
import { debugLab } from '../src/data/debug-lab.js';
import { mentorHelp, MENTOR_LEVELS } from '../src/data/mentor.js';
import { knowledgeGraph } from '../src/data/graph.js';
import { phases } from '../src/data/phases.js';
import { gradeChoiceExercise } from '../src/lib/grade.js';
import { startApp, frontendBundle } from './helpers.js';

test('M5 sandbox never evals on the server and times out runaway work in the runner policy', async (t) => {
  assert.equal(SANDBOX.serverEval, false);
  assert.ok(SANDBOX.timeoutMs >= 100);
  const { actual } = runFunction({
    source: 'function add(a, b) { return a + b; }',
    functionName: 'add',
    args: [2, 3],
  });
  assert.equal(actual, 5);

  const hung = runFunction({
    source: 'function hang() { while (true) {} }',
    functionName: 'hang',
    args: [],
    timeoutMs: 80,
  });
  assert.equal(hung.timedOut, true);

  const { call } = await startApp(t);
  const policy = await (await call('/api/sandbox')).json();
  assert.equal(policy.serverEval, false);
  assert.equal(policy.isolate, 'browser');

  const started = Date.now();
  const response = await call('/api/exercises/javascript-core__add/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source: 'while (true) {}', passed: false }),
  });
  assert.equal(response.status, 200);
  assert.ok(Date.now() - started < 2000);
  const body = await response.json();
  assert.equal(body.passed, false);
  assert.equal(body.evaluatedOnServer, false);

  const frontend = (await frontendBundle()).text;
  assert.match(frontend, /Worker/);
  assert.match(frontend, /timeoutMs|RUNNER_TIMEOUT/);
});

test('M9 adaptive engine lists strong, weak, and recommended work', () => {
  const adaptive = buildAdaptive(
    [
      { id: 'environment', title: 'Developer environment', unlocked: true, mastery: 90, reviewDue: false },
      { id: 'javascript-core', title: 'JavaScript core', unlocked: true, mastery: 40, reviewDue: true },
    ],
    [{ id: 'closures', title: 'Closures', reason: 'Missed twice', href: '#/phase/javascript-core' }],
  );
  assert.equal(adaptive.strong[0].id, 'environment');
  assert.ok(adaptive.recommended.length >= 1);
  assert.ok(adaptive.forgotten.some((item) => item.id === 'javascript-core'));
});

test('M13 project review scores dimensions and names the next improvement', () => {
  const result = scoreProject({
    functionality: 9,
    quality: 7,
    architecture: 6,
    errors: 4,
    a11y: 8,
    security: 7,
    testing: 7,
    git: 8,
    docs: 5,
  });
  assert.equal(REVIEW_CRITERIA.length, 9);
  assert.equal(result.scores.errors, 4);
  assert.ok(result.overall < 8);
  assert.match(result.nextImprovement, /error handling/i);
});

test('M14–M17 git workflow, debug lab, mentor ladder, and knowledge graph are data', () => {
  assert.ok(gitWorkflow.steps.length >= 7);
  assert.ok(gitWorkflow.commits.some((item) => item.example.startsWith('feat:')));
  const bug = debugLab.find((item) => item.id === 'bug-map-return');
  assert.equal(gradeChoiceExercise(bug, bug.answer).passed, true);
  assert.equal(MENTOR_LEVELS.length, 6);
  assert.match(mentorHelp('javascript-core__add', 1).text, /function/i);
  assert.match(mentorHelp('javascript-core__add', 0).text, /quiet/i);
  const graph = knowledgeGraph();
  assert.ok(graph.nodes.some((node) => node.id === 'javascript-core__functions'));
  assert.ok(graph.edges.some((edge) => edge.from === 'javascript-core__functions' && edge.to === 'javascript-core__scope'));
});

test('M19 every phase has lessons, exercises, and a quiz; fundamentals keep required headings', () => {
  assert.equal(phases.length, 17);
  for (const phase of phases) {
    assert.ok(phase.topics.length >= 1, phase.id);
    assert.ok(phase.exercises.length >= 2, phase.id);
    assert.ok(phase.quiz.questions.length >= 5, phase.id);
    for (const topic of phase.topics) {
      assert.ok(topic.content.length >= 2, topic.id);
    }
  }
});

test('M20 health endpoint and authenticated project review, mentor, git, lab, graph APIs', async (t) => {
  const { call } = await startApp(t);
  const health = await (await call('/api/health')).json();
  assert.equal(health.ok, true);
  assert.equal(health.service, 'developer-roadmap');

  const git = await (await call('/api/git-workflow')).json();
  assert.ok(git.steps.length >= 7);
  const lab = await (await call('/api/debug-lab')).json();
  assert.ok(lab.bugs.length >= 2);
  const graph = await (await call('/api/graph')).json();
  assert.ok(graph.edges.length >= 16);

  const hint = await (await call('/api/mentor?exerciseId=javascript-core__add&level=2')).json();
  assert.equal(hint.level, 2);

  const review = await call('/api/projects/todo-manager/review', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ratings: {
        functionality: 9, quality: 7, architecture: 6, errors: 4, a11y: 8, security: 7, testing: 7, git: 8, docs: 5,
      },
    }),
  });
  assert.equal(review.status, 200);
  const scored = await review.json();
  assert.match(scored.nextImprovement, /error handling/i);

  const learning = await (await call('/api/learning')).json();
  assert.ok(learning.adaptive);
  assert.ok(Array.isArray(learning.adaptive.recommended));

  const projects = await (await call('/api/projects')).json();
  assert.ok(projects.reviewCriteria.length >= 9);

  const html = await (await call('/')).text();
  assert.match(html, /Git workflow/);
  assert.match(html, /Debug lab/);
  assert.match(html, /styles\.css/);

  const css = await (await call('/styles.css')).text();
  assert.match(css, /--primary/);
  assert.match(css, /backdrop-filter/);
  assert.match(css, /box-shadow/);

  const ui = (await frontendBundle()).text;
  assert.match(ui, /renderGit/);
  assert.match(ui, /renderDebugLab/);
  assert.match(ui, /renderMentor|data-hint/);
  assert.match(ui, /reviewCriteria|data-review/);
  assert.match(ui, /adaptive/);
});
