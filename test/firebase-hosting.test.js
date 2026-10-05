import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAuthStore, sessionCookie, parseCookies, sessionShouldBeSecure } from '../src/server/auth-store.js';
import { createProgressStore } from '../src/server/progress-store.js';
import { createMemoryJsonIo, createJournalFileMap } from '../src/server/json-io.js';
import { createRuntimeData, isCloudRuntime } from '../src/server/cloud-data.js';
import { startApp, frontendBundle } from './helpers.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('Firebase Hosting serves the UI and rewrites /api to the Express function', async () => {
  const json = JSON.parse(await readFile(join(root, 'firebase.json'), 'utf8'));
  const hosting = json.hosting;
  assert.equal(hosting.site, 'fieldnotes-apprenticeship');
  assert.equal(hosting.public, 'src/public');
  const apiRewrite = hosting.rewrites.find((rule) => rule.source === '/api/**');
  assert.ok(apiRewrite, 'Hosting must rewrite /api; do not ship a static-only site');
  const functionId = typeof apiRewrite.function === 'string' ? apiRewrite.function : apiRewrite.function.functionId;
  assert.equal(functionId, 'api');
  const yaml = await readFile(join(root, 'apphosting.yaml'), 'utf8');
  assert.match(yaml, /FIELDNOTES_DATA/);
  assert.match(yaml, /value: firestore/);
  const rc = JSON.parse(await readFile(join(root, '.firebaserc'), 'utf8'));
  assert.equal(rc.projects.default, 'fieldnotes-apprenticeship');
  const ui = (await frontendBundle()).text;
  assert.match(ui, /\/api\//);
});

test('session cookies use __session so Firebase Hosting forwards them to the API', () => {
  const header = sessionCookie('abc123', { secure: true });
  assert.match(header, /^__session=abc123;/);
  assert.match(header, /HttpOnly/);
  assert.match(header, /Secure/);
  assert.equal(parseCookies('__session=abc123; other=1').__session, 'abc123');
  assert.equal(parseCookies('sid=legacy').sid, 'legacy');
  assert.equal(sessionShouldBeSecure({ headers: {} }, {}), false);
  assert.equal(sessionShouldBeSecure({ headers: { 'x-forwarded-proto': 'https' } }, {}), true);
  assert.equal(sessionShouldBeSecure({ headers: {} }, { VERCEL: '1' }), true);
});

test('auth and progress stores persist through injected JSON IO, not only local files', async () => {
  const users = createMemoryJsonIo();
  const progress = createMemoryJsonIo();
  const auth = createAuthStore('unused.json', { jsonIo: users });
  const store = createProgressStore('unused.json', ['environment'], { exerciseIds: [], topicIds: [], quizIds: ['environment'] }, { jsonIo: progress });
  const registered = await auth.register({ name: 'Ada', username: 'ada', password: 'password123' });
  assert.equal(registered.user.username, 'ada');
  const saved = await store.update('environment', true, registered.user.id);
  assert.deepEqual(saved.completed, ['environment']);
  const again = createProgressStore('unused.json', ['environment'], { exerciseIds: [], topicIds: [], quizIds: ['environment'] }, { jsonIo: progress });
  assert.deepEqual((await again.get(registered.user.id)).completed, ['environment']);
});

test('journal file map round-trips markdown without touching disk', async () => {
  const map = createJournalFileMap();
  await map.write('README.md', '# Hello\n');
  assert.equal((await map.read('README.md')).content, '# Hello\n');
  assert.deepEqual(await map.list(), ['README.md']);
});

test('cloud runtime uses Firestore; local runtime keeps disk files', async () => {
  assert.equal(isCloudRuntime({}), false);
  assert.equal(isCloudRuntime({ FIELDNOTES_DATA: 'firestore' }), true);
  assert.equal(isCloudRuntime({ K_SERVICE: 'fieldnotes' }), true);
  assert.equal(isCloudRuntime({ FUNCTION_TARGET: 'api' }), true);
  assert.equal(isCloudRuntime({ VERCEL: '1' }), true);
  const local = await createRuntimeData({ env: {} });
  assert.equal(local.storage, 'disk');
  assert.deepEqual(local.options, {});
  const fakeDb = {
    doc() {
      return { get: async () => ({ exists: false }), set: async () => undefined };
    },
  };
  const cloud = await createRuntimeData({ firestore: fakeDb, env: { FIELDNOTES_DATA: 'firestore' } });
  assert.equal(cloud.storage, 'firestore');
  assert.ok(cloud.options.authIo);
  assert.ok(cloud.options.progressIo);
  assert.ok(cloud.options.journalFileMap);
  const vercel = await createRuntimeData({ firestore: fakeDb, env: { VERCEL: '1' } });
  assert.equal(vercel.storage, 'firestore');
});

test('the live API still serves health and auth after the Firebase split', async (t) => {
  const { call } = await startApp(t, { authed: false });
  const health = await (await call('/api/health')).json();
  assert.equal(health.ok, true);
  assert.equal(health.storage, 'disk');
  assert.equal(health.api, true);
  const registered = await call('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Bea', username: 'bea', password: 'password123' }),
  });
  assert.equal(registered.status, 201);
  const cookie = registered.headers.getSetCookie?.()[0] ?? registered.headers.get('set-cookie');
  assert.match(String(cookie), /__session=/);
});
