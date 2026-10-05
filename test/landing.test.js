import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { landing } from '../src/data/shell.js';
import { parseRoute, isPublicRoute } from '../src/public/js/router.js';
import { startApp, frontendBundle } from './helpers.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('empty hash is the public landing; overview is the authenticated home', () => {
  assert.equal(parseRoute('#/').name, 'landing');
  assert.equal(parseRoute('').name, 'landing');
  assert.equal(parseRoute('#/overview').name, 'overview');
  assert.equal(isPublicRoute(parseRoute('#/')), true);
  assert.equal(isPublicRoute(parseRoute('#/register')), true);
  assert.equal(isPublicRoute(parseRoute('#/overview')), false);
});

test('landing HTML paints public first with distinct evidence cards', async (t) => {
  const html = await readFile(join(root, 'src/public/index.html'), 'utf8');
  assert.match(html, /<body class="public">/);
  assert.match(html, /Learn, practice, prove it, then move on/);
  assert.match(html, /Create your learner account/);
  assert.equal(html.includes('Loading the apprenticeship'), false);
  assert.match(html, /href="#\/overview"/);
  for (const card of landing.cards) {
    assert.match(html, new RegExp(card.question.replace(/[?]/g, '\\?')));
    assert.match(html, new RegExp(card.evidence.slice(0, 28).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  const { call } = await startApp(t, { authed: false });
  const home = await (await call('/')).text();
  assert.match(home, /<body class="public">/);
  assert.match(home, /Learn, practice, prove it, then move on/);

  const shell = await (await call('/api/shell')).json();
  assert.ok(shell.landing.cards.length >= 4);
  const evidence = shell.landing.cards.map((card) => card.evidence);
  assert.equal(new Set(evidence).size, evidence.length);
  assert.equal(evidence.some((text) => text === 'The portal answers this from evidence, not from pages opened.'), false);
  for (const card of shell.landing.cards) {
    assert.match(home, new RegExp(card.question.replace(/[?]/g, '\\?')));
    assert.match(home, new RegExp(card.evidence.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  const ui = (await frontendBundle()).text;
  assert.match(ui, /#\/overview/);
  assert.match(ui, /isPublicRoute/);
});
