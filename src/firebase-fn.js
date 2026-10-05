import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createApp } from './app.js';
import { startFieldnotesAi } from './lib/genkit.js';
import { createFirestoreJsonIo, createFirestoreJournalMap } from './server/json-io.js';

if (!getApps().length) initializeApp();

let handlerPromise;

async function createHandler() {
  const db = getFirestore();
  const ai = await startFieldnotesAi({
    enableTelemetry: process.env.ENABLE_FIREBASE_MONITORING === 'true' || process.env.ENABLE_FIREBASE_MONITORING === '1',
  });
  return createApp({
    genkitGenerate: ai?.generate,
    authIo: createFirestoreJsonIo(db.doc('fieldnotes/users')),
    progressIo: createFirestoreJsonIo(db.doc('fieldnotes/progress')),
    journalFileMap: createFirestoreJournalMap(db.doc('fieldnotes/journal')),
  });
}

function appHandler() {
  handlerPromise ??= createHandler();
  return handlerPromise;
}

export const api = onRequest(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
    cors: false,
    invoker: 'public',
  },
  async (req, res) => {
    const app = await appHandler();
    app(req, res);
  },
);
