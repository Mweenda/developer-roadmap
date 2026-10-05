import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startApp, frontendBundle } from './helpers.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('Start Phase opens the lesson studio and the frontend defines renderTopic', async (t) => {
  const ui = (await frontendBundle()).text;
  assert.match(ui, /from '\.\/js\/views-learn\.js'/);
  assert.match(ui, /export function renderTopic/);
  assert.match(ui, /learn-studio/);
  assert.match(ui, /studio-terminal/);

  const { call } = await startApp(t);
  const learning = await (await call('/api/learning')).json();
  assert.match(learning.action.href, /\/phase\/environment\/learn\//);
  const html = await (await call('/')).text();
  assert.match(html, /id="tutorFab"/);
  assert.match(html, /class="tutor-fab"[\s\S]*?<svg/i);
  const nav = html.match(/<nav id="sidebarNav">[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.equal(nav.includes('?'), false);
  assert.doesNotMatch(html, /id="avatar"[^>]*>\s*\?/);
});

test('auth inputs are compact fields, not a code editor', async () => {
  const css = await readFile(join(root, 'src', 'styles', 'input.css'), 'utf8');
  assert.match(css, /input\.auth-input[\s\S]*min-height:\s*42px/);
  assert.match(css, /\.button:hover|\.primary-btn:hover/);
  assert.match(css, /\.tutor-fab:hover/);
  assert.match(css, /--popup/);
  assert.match(css, /\.tutor-panel[\s\S]*hsl\(var\(--popup\)/);
  assert.match(css, /\.celebrate-dialog[\s\S]*hsl\(var\(--popup\)/);
});
