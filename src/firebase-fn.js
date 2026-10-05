import { onRequest } from 'firebase-functions/v2/https';
import { createApp } from './app.js';
import { startFieldnotesAi } from './lib/genkit.js';
import { createRuntimeData } from './server/cloud-data.js';

let handlerPromise;

async function createHandler() {
  const runtime = await createRuntimeData();
  const ai = await startFieldnotesAi({
    enableTelemetry: process.env.ENABLE_FIREBASE_MONITORING === 'true' || process.env.ENABLE_FIREBASE_MONITORING === '1',
  });
  return createApp({
    genkitGenerate: ai?.generate,
    storage: runtime.storage,
    ...runtime.options,
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
