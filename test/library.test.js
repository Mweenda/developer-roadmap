import test from 'node:test';
import assert from 'node:assert/strict';
import { librarySources, getLibrarySource, libraryForPhase, listLibrary } from '../src/data/library.js';
import { toPublicPhase, getPhaseById } from '../src/data/phases.js';

const required = [
  'mdn-guide', 'mdn-reference', 'javascript-info',
  'node-docs', 'node-learn', 'npm-docs',
  'express-docs', 'mdn-http',
  'react-docs', 'react-api', 'mdn-web-apis',
  'postgres-docs', 'typescript-handbook',
  'vitest', 'testing-library', 'playwright', 'supertest',
  'git-docs', 'github-docs', 'docker-docs',
];

test('reference library is the official bookmark bar, not a cover-to-cover syllabus', () => {
  assert.deepEqual(required.sort(), librarySources.map((source) => source.id).sort());
  for (const source of librarySources) {
    assert.ok(source.url.startsWith('https://'), source.id);
    assert.equal(source.url.includes('utm_source'), false, `${source.id} should not carry tracker query params`);
    assert.ok(source.useFor.length >= 1);
    assert.ok(source.rule);
  }
  assert.equal(getLibrarySource('postgres-docs').later, true);
  assert.equal(getLibrarySource('javascript-info').later, false);
  assert.equal(getLibrarySource('javascript-info').role, 'learn');
  assert.equal(getLibrarySource('mdn-guide').role, 'reference');
  assert.ok(getLibrarySource('mdn-guide').phaseIds.includes('javascript-core'));
  assert.ok(listLibrary().whenToRead.length >= 10);
  assert.equal(listLibrary().categories.length, 8);
});

test('each phase names which official docs to use now and what to skip', () => {
  const js = libraryForPhase('javascript-core');
  assert.deepEqual(js.sources.map((source) => source.id).sort(), ['javascript-info', 'mdn-guide', 'mdn-reference'].sort());
  assert.match(js.use, /JavaScript.info/);
  assert.match(js.skip, /React/);
  const published = toPublicPhase(getPhaseById('javascript-core'));
  assert.ok(published.library.sources.some((source) => source.id === 'javascript-info'));
  assert.equal(libraryForPhase('databases-sql').sources[0].id, 'postgres-docs');
  assert.equal(libraryForPhase('environment').sources.some((source) => source.id === 'docker-docs'), false);
});
