import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEnv } from './server/env.js';
import { createApp } from './app.js';
import { startFieldnotesAi } from './lib/genkit.js';

const rootDir = dirname(fileURLToPath(import.meta.url));
loadEnv(join(rootDir, '..', '.env'));

const port = Number(process.env.PORT) || 3000;
const ai = await startFieldnotesAi({
  enableTelemetry: process.env.ENABLE_FIREBASE_MONITORING === 'true' || process.env.ENABLE_FIREBASE_MONITORING === '1',
});
const app = createApp({ genkitGenerate: ai?.generate });
app.listen(port, '127.0.0.1', () => console.log(`Developer roadmap running at http://localhost:${port}`));
