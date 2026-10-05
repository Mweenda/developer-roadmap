import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { fileSize, listPublicJs } from './helpers.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_PUBLIC_JS_BYTES = 32 * 1024;
const MAX_CSS_BYTES = 48 * 1024;

test('frontend modules stay under the chunk size that warns on build', async () => {
  const files = await listPublicJs();
  assert.ok(files.length >= 6, 'public JS should be split into modules');
  for (const file of files) {
    const size = await fileSize(file);
    assert.ok(
      size <= MAX_PUBLIC_JS_BYTES,
      `${relative(root, file)} is ${size} bytes (limit ${MAX_PUBLIC_JS_BYTES})`,
    );
  }
  const cssSize = await fileSize(join(root, 'src', 'public', 'styles.css'));
  assert.ok(cssSize <= MAX_CSS_BYTES, `styles.css is ${cssSize} bytes (limit ${MAX_CSS_BYTES})`);
});
