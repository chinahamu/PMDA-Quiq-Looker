import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-extension',
    },
  ],
  webServer: {
    command: 'npm run serve:e2e',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
