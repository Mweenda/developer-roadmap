import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const isRemote = !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(baseURL);

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: isRemote ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: isRemote
    ? undefined
    : {
        command: 'pnpm start',
        url: 'http://127.0.0.1:3000/api/health',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
