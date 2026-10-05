import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('Vercel deploys the Express app; Firebase Hosting stays as a fallback', async () => {
  const vercel = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));
  assert.equal(vercel.framework, 'express');
  assert.match(String(vercel.buildCommand), /pnpm build/);
  assert.equal(vercel.outputDirectory, undefined);

  const firebase = JSON.parse(await readFile(join(root, 'firebase.json'), 'utf8'));
  const apiRewrite = firebase.hosting.rewrites.find((rule) => rule.source === '/api/**');
  assert.ok(apiRewrite, 'keep the Firebase /api rewrite until Vercel smoke tests pass');

  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  assert.match(pkg.scripts.build, /sync-cdn-public/);
  assert.equal(pkg.devDependencies.vite.startsWith('^') || Boolean(pkg.devDependencies.vite), true);
  assert.ok(pkg.devDependencies.vite, 'vite is the frontend toolchain; Express remains the /api server');
  assert.ok(pkg.devDependencies['@playwright/test']);

  const vite = await readFile(join(root, 'vite.config.js'), 'utf8');
  assert.match(vite, /proxy/);
  assert.match(vite, /\/api/);

  const entry = await readFile(join(root, 'server.js'), 'utf8');
  assert.match(entry, /from 'express'/);
  assert.match(entry, /export default app/);

  const server = await readFile(join(root, 'src/server.js'), 'utf8');
  assert.match(server, /export default app/);
  assert.match(server, /process\.env\.VERCEL/);
});
