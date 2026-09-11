import { defineConfig, devices } from '@playwright/test';

const artifactRoot = process.env.PHASE08_ARTIFACT_ROOT ?? 'artifacts/phase-08/local';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'phase-08-system.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: `${artifactRoot}/system-test/test-results`,
  reporter: [
    ['line'],
    ['json', { outputFile: `${artifactRoot}/system-test/playwright-results.json` }],
    ['junit', { outputFile: `${artifactRoot}/system-test/junit.xml` }],
    ['html', { outputFolder: `${artifactRoot}/system-test/html-report`, open: 'never' }],
  ],
  use: {
    baseURL: process.env.E2E_WEB_URL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'phase-08-system-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
