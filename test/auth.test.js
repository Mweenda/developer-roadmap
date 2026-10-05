import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp } from './helpers.js';

test('unauthenticated learners cannot read progress', async (t) => {
  const { call } = await startApp(t, { authed: false });
  const response = await call('/api/progress');
  assert.equal(response.status, 401);
});

test('register and login create a session cookie', async (t) => {
  const { call, base } = await startApp(t, { authed: false });
  const registered = await call('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Ada', username: 'ada', password: 'password123' }),
  });
  assert.equal(registered.status, 201);
  const created = await registered.json();
  assert.equal(created.user.username, 'ada');
  assert.equal(created.user.hash, undefined);

  const cookie = registered.headers.getSetCookie?.()[0] ?? registered.headers.get('set-cookie');
  assert.match(String(cookie), /sid=/);
  assert.match(String(cookie), /HttpOnly/i);

  const me = await fetch(`${base}/api/auth/me`, { headers: { cookie: cookie.split(';')[0] } });
  assert.equal((await me.json()).user.name, 'Ada');

  const denied = await call('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'ada', password: 'wrong-password' }),
  });
  assert.equal(denied.status, 401);

  const duplicate = await call('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Ada', username: 'ada', password: 'password123' }),
  });
  assert.equal(duplicate.status, 409);
});

test('landing copy is data, not a hardcoded page component', async (t) => {
  const { call } = await startApp(t, { authed: false });
  const shell = await (await call('/api/shell')).json();
  assert.match(shell.landing.title, /practice, prove/i);
  assert.match(shell.landing.eyebrow, /apprenticeship/i);
  assert.ok(shell.landing.bullets.length >= 3);
  const home = await call('/');
  assert.equal(home.status, 200);
  assert.match(await home.text(), /fieldnotes/);
});
