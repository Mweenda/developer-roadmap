import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createJournalStore } from '../src/server/journal-store.js';
import { startApp } from './helpers.js';

test('journal creates root files only, then phase folders on demand', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'journal-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = createJournalStore(dir, {
    getContext: async () => ({ currentPhaseId: 'environment', completed: [] }),
  });

  const listed = await store.get();
  assert.ok(listed.files.includes('README.md'));
  assert.ok(listed.files.includes('DECISIONS.md'));
  assert.ok(listed.files.includes('debugging.md'));
  assert.equal(listed.phases.find((phase) => phase.id === 'javascript-core').opened, false);
  assert.equal(listed.files.some((file) => file.startsWith('02-javascript/')), false);

  const opened = await store.openPhase('environment');
  assert.equal(opened.phases.find((phase) => phase.id === 'environment').opened, true);
  assert.ok(opened.files.includes('00-foundations/notes.md'));
  assert.ok(opened.files.includes('00-foundations/phase-gate.md'));
  assert.equal(opened.files.some((file) => file.startsWith('01-html-css/')), false);

  const note = await store.read('00-foundations/notes.md');
  assert.match(note.content, /My own explanation/);
  const saved = await store.write('00-foundations/notes.md', '# Functions\n\n## My own explanation\n\nA function is a reusable block.\n');
  assert.match(saved.content, /reusable block/);
  assert.match(await readFile(join(dir, 'README.md'), 'utf8'), /Foundations/);

  await assert.rejects(store.read('../package.json'), { code: 'INVALID_PATH' });
  await assert.rejects(store.openPhase('nope'), { code: 'INVALID_PHASE' });
});

test('journal API scaffolds a phase and refuses path traversal', async (t) => {
  const { call } = await startApp(t);

  const index = await call('/api/journal');
  assert.equal(index.status, 200);
  const body = await index.json();
  assert.equal(body.types.length, 9);
  assert.ok(body.files.includes('README.md'));

  const opened = await call('/api/journal/phases/javascript-core/open', { method: 'POST' });
  assert.equal(opened.status, 200);
  const js = await opened.json();
  assert.ok(js.files.includes('02-javascript/mental-models.md'));
  assert.equal(js.files.some((file) => file.startsWith('07-postgresql/')), false);

  const review = await call('/api/journal/file', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phaseId: 'javascript-core', type: 'weekly-review', title: 'Week 1' }),
  });
  assert.equal(review.status, 201);
  const created = await review.json();
  assert.match(created.path, /02-javascript\/weekly-reviews\//);
  assert.match(created.content, /Review gate/);

  const traverse = await call(`/api/journal/file?path=${encodeURIComponent('../package.json')}`);
  assert.equal(traverse.status, 400);
});
