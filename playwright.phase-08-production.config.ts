import { defineConfig, devices } from '@playwright/test';

const releaseId = process.env.E2E_PHASE08_RELEASE_ID ?? 'unscoped';
const artifactRoot = `artifacts/phase-08/${releaseId}/deployment/role-smoke`;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'phase-07-cloud-roles.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  outputDir: `${artifactRoot}/test-results`,
  reporter: [
    ['line'],
    ['json', { outputFile: `${artifactRoot}/playwright-results.json` }],
    ['junit', { outputFile: `${artifactRoot}/junit.xml` }],
    ['html', { outputFolder: `${artifactRoot}/html-report`, open: 'never' }],
  ],
  use: {
    baseURL: process.env.E2E_WEB_URL,
    actionTimeout: 12_000,
    navigationTimeout: 25_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'production-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
