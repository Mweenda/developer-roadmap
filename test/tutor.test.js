import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTutorRequest, askTutor, isOnCurriculum, wantsSpoiler } from '../src/lib/tutor.js';
import { startApp, frontendBundle } from './helpers.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('tutor prompt uses this chapter’s official docs and forbids giving the answer', () => {
  const js = buildTutorRequest({
    question: 'Why does map return undefined names?',
    phaseId: 'javascript-core',
    exerciseId: 'javascript-core__map-bug',
  });
  assert.equal(js.skipModel, false);
  assert.match(js.system, /never give the final answer/i);
  assert.match(js.system, /javascript\.info/i);
  assert.match(js.system, /MDN/i);
  assert.match(js.system, /JavaScript core/i);
  assert.match(js.system, /map/i);

  const node = buildTutorRequest({ question: 'How do I read a file in this chapter?', phaseId: 'node' });
  assert.match(node.system, /Node/i);

  const express = buildTutorRequest({ question: 'Where should validation live?', phaseId: 'express-api' });
  assert.match(express.system, /Express/i);
});

test('tutor refuses off-curriculum questions and direct spoilers without calling the model', () => {
  assert.equal(isOnCurriculum('What pasta recipe should I cook tonight?', null), false);
  assert.equal(wantsSpoiler('Give me the solution for this exercise'), true);

  const off = buildTutorRequest({ question: 'What pasta recipe should I cook tonight?', phaseId: 'javascript-core' });
  assert.equal(off.skipModel, true);
  assert.match(off.reply, /curriculum/i);

  const spoiler = buildTutorRequest({ question: 'Give me the solution for this exercise', phaseId: 'javascript-core' });
  assert.equal(spoiler.skipModel, true);
  assert.match(spoiler.reply, /will not give you the answer/i);
});

test('tutor API requires a session, stays on curriculum, and sends Gemini a guide-not-answer prompt', async (t) => {
  const calls = [];
  const geminiFetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      async json() {
        return { candidates: [{ content: { parts: [{ text: 'What do you expect map to return for each element?' }] } }] };
      },
    };
  };

  const unauth = await startApp(t, { authed: false, geminiKey: 'test-key', geminiFetch });
  const blocked = await unauth.call('/api/tutor', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: 'Why is this undefined?', phaseId: 'javascript-core' }),
  });
  assert.equal(blocked.status, 401);

  const missing = await startApp(t, { geminiKey: '', geminiFetch });
  const down = await missing.call('/api/tutor', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: 'Why is this undefined?', phaseId: 'javascript-core' }),
  });
  assert.equal(down.status, 503);

  const { call } = await startApp(t, { geminiKey: 'test-key', geminiFetch });
  const guided = await call('/api/tutor', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      question: 'Why does map return undefined names?',
      phaseId: 'javascript-core',
      exerciseId: 'javascript-core__map-bug',
    }),
  });
  assert.equal(guided.status, 200);
  const body = await guided.json();
  assert.match(body.text, /map/i);
  assert.equal(body.guided, true);
  assert.equal(calls.length, 1);
  const sent = JSON.parse(calls[0].options.body);
  assert.match(sent.systemInstruction.parts[0].text, /never give the final answer/i);
  assert.match(sent.systemInstruction.parts[0].text, /javascript\.info/i);
  assert.equal(calls[0].options.headers['x-goog-api-key'], 'test-key');

  const pasta = await call('/api/tutor', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: 'What pasta recipe should I cook tonight?' }),
  });
  assert.equal(pasta.status, 200);
  assert.match((await pasta.json()).text, /curriculum/i);
  assert.equal(calls.length, 1);
});

test('askTutor uses the injected fetch and never treats a missing key as success', async () => {
  await assert.rejects(
    () => askTutor({ question: 'Why is filter not changing the array?', phaseId: 'javascript-core' }, { apiKey: '' }),
    /not configured/i,
  );
});

test('chatbot widget is in the shell and frontend, and .env is gitignored', async (t) => {
  const { call } = await startApp(t);
  const shell = await (await call('/api/shell')).json();
  assert.match(shell.tutor.greeting, /will not give you the answer/i);
  const html = await (await call('/')).text();
  assert.match(html, /tutor-fab/);
  assert.match(html, /tutor-panel/);
  const ui = (await frontendBundle()).text;
  assert.match(ui, /\/api\/tutor/);
  const ignore = await readFile(join(root, '.gitignore'), 'utf8');
  assert.match(ignore, /^\.env$/m);
});
