import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/app.js';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'public');

export async function listPublicJs(dir = publicDir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listPublicJs(path));
    else if (entry.name.endsWith('.js')) files.push(path);
  }
  return files;
}

export async function frontendBundle() {
  const files = await listPublicJs();
  const texts = await Promise.all(files.map((file) => readFile(file, 'utf8')));
  return { files, text: texts.join('\n') };
}

export async function fileSize(path) {
  return (await stat(path)).size;
}

export function cookieFrom(response) {
  const header = response.headers.getSetCookie?.()[0] ?? response.headers.get('set-cookie') ?? '';
  const match = header.match(/^__session=[^;]+/);
  return match ? match[0] : '';
}

export async function startApp(t, { authed = true, ...appOptions } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'roadmap-api-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const app = createApp({
    progressPath: join(dir, 'progress.json'),
    journalPath: join(dir, 'journal'),
    authPath: join(dir, 'users.json'),
    ...appOptions,
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  if (authed) {
    const registered = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Ada', username: 'ada', password: 'password123' }),
    });
    cookie = cookieFrom(registered);
  }
  function call(path, options = {}) {
    const headers = { ...(options.headers ?? {}) };
    if (cookie) headers.cookie = cookie;
    return fetch(`${base}${path}`, { ...options, headers });
  }
  return { base, cookie, call };
}
