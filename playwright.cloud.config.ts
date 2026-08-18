import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'phase-07-cloud-roles.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  outputDir: 'artifacts/phase-07/cloud-e2e/test-results',
  reporter: [
    ['line'],
    ['junit', { outputFile: 'artifacts/phase-07/cloud-e2e/junit.xml' }],
    ['html', { outputFolder: 'artifacts/phase-07/cloud-e2e/html-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.E2E_WEB_URL,
    actionTimeout: 12_000,
    navigationTimeout: 25_000,
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'cloud-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
