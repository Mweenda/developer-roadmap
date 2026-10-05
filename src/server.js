import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEnv } from './server/env.js';
import { createApp } from './app.js';

const rootDir = dirname(fileURLToPath(import.meta.url));
loadEnv(join(rootDir, '..', '.env'));

const port = Number(process.env.PORT) || 3000;
const app = createApp();
app.listen(port, '127.0.0.1', () => console.log(`Developer roadmap running at http://localhost:${port}`));
