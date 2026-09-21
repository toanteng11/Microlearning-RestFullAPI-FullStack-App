import { defineConfig, devices } from '@playwright/test';

const artifactRoot =
  process.env.PHASE08_LOCAL_ARTIFACT_ROOT ?? 'artifacts/phase-08/local-acceptance';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    'phase-03-critical-journeys.spec.ts',
    'phase-05-critical-journeys.spec.ts',
    'phase-06-*.spec.ts',
    'phase-08-local.spec.ts',
  ],
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: `${artifactRoot}/test-results`,
  reporter: [
    ['line'],
    ['json', { outputFile: `${artifactRoot}/playwright-results.json` }],
    ['junit', { outputFile: `${artifactRoot}/junit.xml` }],
    ['html', { outputFolder: `${artifactRoot}/html-report`, open: 'never' }],
  ],
  use: {
    baseURL: process.env.E2E_WEB_URL ?? 'http://localhost:3300',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'phase-08-local-chromium', use: { ...devices['Desktop Chrome'] } }],
});
