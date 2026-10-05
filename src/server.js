import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEnv } from './server/env.js';
import { createApp } from './app.js';
import { startFieldnotesAi } from './lib/genkit.js';
import { createRuntimeData } from './server/cloud-data.js';

const rootDir = dirname(fileURLToPath(import.meta.url));
loadEnv(join(rootDir, '..', '.env'));

const runtime = await createRuntimeData();
const ai = await startFieldnotesAi({
  enableTelemetry: process.env.ENABLE_FIREBASE_MONITORING === 'true' || process.env.ENABLE_FIREBASE_MONITORING === '1',
});
const app = createApp({
  genkitGenerate: ai?.generate,
  storage: runtime.storage,
  ...runtime.options,
});

export default app;

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || (process.env.K_SERVICE ? '0.0.0.0' : '127.0.0.1');
  app.listen(port, host, () => console.log(`Developer roadmap running at http://${host}:${port} (${runtime.storage})`));
}
