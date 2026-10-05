import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, frontendBundle } from './helpers.js';

test('profile lives in the account menu, not the left navigation', async (t) => {
  const { call } = await startApp(t);
  const html = await (await call('/')).text();
  const nav = html.match(/<nav id="sidebarNav">[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.equal(/href="#\/profile"/.test(nav), false);
  assert.match(html, /id="accountMenu"/);
  assert.match(html, /id="accountBtn"/);

  const shell = await (await call('/api/shell')).json();
  const labels = shell.accountMenu.items.map((item) => item.label);
  assert.ok(labels.includes('Profile'));
  assert.ok(labels.includes('Settings'));
  assert.ok(labels.includes('Sign out'));

  const ui = (await frontendBundle()).text;
  assert.match(ui, /bindAccountMenu/);
  assert.match(ui, /#\/settings/);
  assert.match(ui, /export function renderSettings/);
  assert.match(html, /class="account"/);
});
