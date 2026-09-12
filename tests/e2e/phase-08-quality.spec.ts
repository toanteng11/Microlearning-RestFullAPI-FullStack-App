import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';

const enabled = process.env.E2E_PHASE08_QUALITY_MODE === 'true';
const webUrl = process.env.E2E_WEB_URL ?? '';
const apiUrl = process.env.E2E_API_URL ?? '';
const demoPassword = process.env.E2E_DEMO_PASSWORD ?? '';
const releaseId = process.env.E2E_PHASE08_RELEASE_ID ?? '';
const expectedCommit = process.env.E2E_EXPECTED_COMMIT ?? '';
const expectedRevision = process.env.E2E_EXPECTED_REVISION ?? '';
const artifactRoot = process.env.PHASE08_ARTIFACT_ROOT ?? 'artifacts/phase-08/local';
const courseId = '650000000000000000000001';
const foreignCourseId = '507f1f77bcf86cd799439099';
const studentAGradeId = '660000000000000000000061';

type SecurityCheck = { id: string; status: 'PASS' | 'FAIL'; actual: string };
type PerformanceMeasurement = {
  category: 'simple-read' | 'list-report' | 'mutation' | 'dashboard' | 'frontend-load';
  endpoint: string;
  samplesMs: number[];
  errorCount: number;
};
type UiCheck = {
  id: string;
  viewport: string;
  seriousOrCriticalViolations: number;
  horizontalOverflow: boolean;
  keyboardFocus: 'PASS' | 'FAIL';
  states: 'PASS' | 'FAIL';
};

const securityChecks: SecurityCheck[] = [];
const performanceMeasurements: PerformanceMeasurement[] = [];
const uiChecks: UiCheck[] = [];

function recordSecurity(id: string, passed: boolean, actual: string) {
  securityChecks.push({ id, status: passed ? 'PASS' : 'FAIL', actual });
  expect(passed, `${id}: ${actual}`).toBe(true);
}

async function apiLogin(request: APIRequestContext, email: string) {
  const response = await request.post(`${apiUrl}/api/v1/auth/login`, {
    data: { email, password: demoPassword },
    headers: { Origin: webUrl, 'x-phase-08-release-id': releaseId },
  });
  expect(response.status(), `Synthetic login failed for ${email}`).toBe(200);
  const body = await response.json();
  expect(body?.data?.user?.email).toBe(email);
  return body.data.accessToken as string;
}

async function uiLogin(page: Page, email: string, expectedPath: RegExp) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(expectedPath);
}

async function sampleRequest(
  category: PerformanceMeasurement['category'],
  endpoint: string,
  operation: () => Promise<{ status(): number }>,
  acceptedStatuses = [200],
) {
  await operation();
  const samplesMs: number[] = [];
  let errorCount = 0;
  for (let index = 0; index < 5; index += 1) {
    const startedAt = performance.now();
    const response = await operation();
    samplesMs.push(Math.round((performance.now() - startedAt) * 100) / 100);
    if (!acceptedStatuses.includes(response.status())) errorCount += 1;
  }
  performanceMeasurements.push({ category, endpoint, samplesMs, errorCount });
  expect(errorCount, `${category} request errors`).toBe(0);
}

async function inspectSurface(
  browser: Browser,
  input: {
    id: string;
    path: string;
    viewport: { width: number; height: number };
    email?: string;
    expectedPath?: RegExp;
    setup?: (page: Page) => Promise<void>;
    states?: (page: Page) => Promise<void>;
  },
) {
  const context = await browser.newContext({ baseURL: webUrl, viewport: input.viewport });
  const page = await context.newPage();
  try {
    if (input.email) await uiLogin(page, input.email, input.expectedPath!);
    if (input.setup) await input.setup(page);
    await page.goto(input.path);
    await expect(page.locator('main')).toBeVisible();
    if (input.states) await input.states(page);
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const blocking = axe.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    );
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    await page.keyboard.press('Tab');
    const keyboardFocus = await page.evaluate(() =>
      /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/u.test(document.activeElement?.tagName ?? ''),
    );
    const horizontalOverflow = dimensions.scrollWidth > dimensions.clientWidth + 1;
    uiChecks.push({
      id: input.id,
      viewport: `${input.viewport.width}x${input.viewport.height}`,
      seriousOrCriticalViolations: blocking.length,
      horizontalOverflow,
      keyboardFocus: keyboardFocus ? 'PASS' : 'FAIL',
      states: 'PASS',
    });
    expect(blocking, `${input.id} serious/critical accessibility violations`).toEqual([]);
    expect(horizontalOverflow, `${input.id} horizontal overflow`).toBe(false);
    expect(keyboardFocus, `${input.id} keyboard focus`).toBe(true);
  } finally {
    await context.close();
  }
}

test.describe('Phase 08 Part 04-05 quality verification', () => {
  test.skip(
    !enabled,
    'Phase 08 quality verification runs only against a locked Staging candidate.',
  );
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    expect(webUrl).toMatch(/^https:\/\//u);
    expect(apiUrl).toBe(webUrl);
    expect(demoPassword.length).toBeGreaterThanOrEqual(12);
    expect(releaseId).toMatch(/^P08-RC-\d{8}-[a-f0-9]{7,12}$/u);
    expect(expectedCommit).toMatch(/^[a-f0-9]{40}$/u);
    expect(expectedRevision).toMatch(/^microlearning-staging-[a-z0-9-]+$/u);
  });

  test.afterAll(() => {
    const outputPath = resolve(artifactRoot, 'security-performance', 'quality-observations.json');
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(
      outputPath,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          phase: '08',
          releaseId,
          commitSha: expectedCommit,
          stagingRevision: expectedRevision,
          methodology: {
            environment: 'staging',
            concurrency: 1,
            warmupSamples: 1,
            sampleCountPerMetric: 5,
            region: 'asia-southeast1',
            network: 'GitHub-hosted runner to Cloud Run Staging',
            dataset: 'deterministic synthetic Phase 03-06 seed',
            tool: '@playwright/test request and Chromium navigation timing',
          },
          securityChecks,
          performanceMeasurements,
          uiChecks,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
  });

  test('[P08-QV-001] blocked accounts, RBAC and privacy boundaries hold', async ({ request }) => {
    for (const [id, email] of [
      ['SEC-BLOCKED-STUDENT', 'student.blocked@example.test'],
      ['SEC-BLOCKED-TEACHER', 'teacher.blocked@example.test'],
    ] as const) {
      const response = await request.post(`${apiUrl}/api/v1/auth/login`, {
        data: { email, password: demoPassword },
        headers: { Origin: webUrl },
      });
      const text = await response.text();
      recordSecurity(id, response.status() === 403, `status=${response.status()}`);
      recordSecurity(
        id === 'SEC-BLOCKED-STUDENT' ? 'PRIV-ERROR-REDACTION' : `${id}-REDACTION`,
        !text.includes(demoPassword) && !/passwordHash|tokenHash|mongodb\+srv/iu.test(text),
        'error body does not echo credentials, hashes or MongoDB URI',
      );
    }

    const studentToken = await apiLogin(request, 'student.active@example.test');
    const studentAdmin = await request.get(`${apiUrl}/api/v1/admin/users/students`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    recordSecurity(
      'SEC-STUDENT-ADMIN-RBAC',
      studentAdmin.status() === 403,
      `status=${studentAdmin.status()}`,
    );

    const teacherToken = await apiLogin(request, 'teacher.active@example.test');
    const teacherAdmin = await request.get(`${apiUrl}/api/v1/admin/users/admins`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    recordSecurity(
      'SEC-TEACHER-ADMIN-RBAC',
      teacherAdmin.status() === 403,
      `status=${teacherAdmin.status()}`,
    );
  });

  test('[P08-QV-002] two Students and two Teachers remain ownership-isolated', async ({
    request,
  }) => {
    const studentB = await apiLogin(request, 'student.active.2@example.test');
    const foreignGrade = await request.get(
      `${apiUrl}/api/v1/students/me/grades/${studentAGradeId}`,
      {
        headers: { Authorization: `Bearer ${studentB}` },
      },
    );
    recordSecurity(
      'SEC-STUDENT-OWNERSHIP',
      [403, 404].includes(foreignGrade.status()),
      `status=${foreignGrade.status()}`,
    );

    const teacherB = await apiLogin(request, 'teacher.active.2@example.test');
    const foreignCourse = await request.get(
      `${apiUrl}/api/v1/teacher/courses/${courseId}/progress`,
      { headers: { Authorization: `Bearer ${teacherB}` } },
    );
    recordSecurity(
      'SEC-TEACHER-OWNERSHIP',
      [403, 404].includes(foreignCourse.status()),
      `status=${foreignCourse.status()}`,
    );

    const teacherA = await apiLogin(request, 'teacher.active@example.test');
    const unknownCourse = await request.get(
      `${apiUrl}/api/v1/teacher/courses/${foreignCourseId}/progress`,
      { headers: { Authorization: `Bearer ${teacherA}` } },
    );
    expect([403, 404]).toContain(unknownCourse.status());
  });

  test('[P08-QV-003] validation, pagination and idempotent retry are enforced', async ({
    request,
  }) => {
    const noSql = await request.post(`${apiUrl}/api/v1/auth/login`, {
      data: { email: { $ne: null }, password: demoPassword },
      headers: { Origin: webUrl },
    });
    recordSecurity('SEC-NOSQL-OPERATOR', noSql.status() === 422, `status=${noSql.status()}`);

    const studentToken = await apiLogin(request, 'student.active@example.test');
    const invalidPage = await request.get(
      `${apiUrl}/api/v1/students/me/progress/courses?page=0&limit=9999`,
      { headers: { Authorization: `Bearer ${studentToken}` } },
    );
    recordSecurity(
      'API-PAGINATION-BOUNDS',
      invalidPage.status() === 422,
      `status=${invalidPage.status()}`,
    );

    const event = {
      eventId: `00000000-0000-4000-8000-${expectedCommit.slice(0, 12)}`,
      eventName: 'lesson_started',
      schemaVersion: '1',
      occurredAt: new Date().toISOString(),
      context: { courseId },
      properties: { surface: 'phase-08-quality' },
    };
    const first = await request.post(`${apiUrl}/api/v1/analytics/events`, {
      data: event,
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const retry = await request.post(`${apiUrl}/api/v1/analytics/events`, {
      data: event,
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const firstBody = await first.json();
    const retryBody = await retry.json();
    recordSecurity(
      'DATA-IDEMPOTENT-RETRY',
      [200, 202].includes(first.status()) &&
        retry.status() === 200 &&
        retryBody?.data?.duplicate === true,
      `first=${first.status()}/${String(firstBody?.data?.duplicate)}, retry=${retry.status()}/${String(retryBody?.data?.duplicate)}`,
    );
  });

  test('[P08-QV-004] BA API and frontend latency thresholds are measured', async ({
    request,
    page,
  }) => {
    const studentToken = await apiLogin(request, 'student.active@example.test');
    const authHeaders = { Authorization: `Bearer ${studentToken}` };
    await sampleRequest('simple-read', '/health', () => request.get(`${apiUrl}/health`));
    await sampleRequest('list-report', '/api/v1/students/me/progress/courses', () =>
      request.get(`${apiUrl}/api/v1/students/me/progress/courses?limit=10`, {
        headers: authHeaders,
      }),
    );
    await sampleRequest('dashboard', '/api/v1/students/me/dashboard', () =>
      request.get(`${apiUrl}/api/v1/students/me/dashboard`, { headers: authHeaders }),
    );
    const event = {
      eventId: `00000000-0000-4000-9000-${expectedCommit.slice(0, 12)}`,
      eventName: 'lesson_started',
      schemaVersion: '1',
      occurredAt: new Date().toISOString(),
      context: { courseId },
      properties: { surface: 'phase-08-performance' },
    };
    await sampleRequest(
      'mutation',
      '/api/v1/analytics/events',
      () =>
        request.post(`${apiUrl}/api/v1/analytics/events`, { data: event, headers: authHeaders }),
      [200, 202],
    );

    await page.goto('/login', { waitUntil: 'networkidle' });
    const samplesMs: number[] = [];
    for (let index = 0; index < 5; index += 1) {
      await page.reload({ waitUntil: 'networkidle' });
      const duration = await page.evaluate(() => {
        const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return entry.loadEventEnd - entry.startTime;
      });
      samplesMs.push(Math.round(duration * 100) / 100);
    }
    performanceMeasurements.push({
      category: 'frontend-load',
      endpoint: '/login',
      samplesMs,
      errorCount: 0,
    });
  });

  test('[P08-QV-005] P0 screens pass accessibility, keyboard and responsive checks', async ({
    browser,
  }) => {
    await inspectSurface(browser, {
      id: 'public-login',
      path: '/login',
      viewport: { width: 390, height: 844 },
    });
    await inspectSurface(browser, {
      id: 'student-dashboard',
      path: '/student/dashboard',
      viewport: { width: 390, height: 844 },
      email: 'student.active@example.test',
      expectedPath: /\/student\/dashboard/u,
    });
    await inspectSurface(browser, {
      id: 'teacher-gradebook',
      path: `/teacher/courses/${courseId}/gradebook`,
      viewport: { width: 1366, height: 768 },
      email: 'teacher.active@example.test',
      expectedPath: /\/teacher\/dashboard/u,
    });
    await inspectSurface(browser, {
      id: 'admin-governance',
      path: '/admin/reports/governance',
      viewport: { width: 390, height: 844 },
      email: 'admin.active@example.test',
      expectedPath: /\/admin\/dashboard/u,
    });
    await inspectSurface(browser, {
      id: 'student-progress-states',
      path: '/student/progress',
      viewport: { width: 390, height: 844 },
      email: 'student.active@example.test',
      expectedPath: /\/student\/dashboard/u,
      setup: async (page) => {
        await page.route('**/api/v1/students/me/progress/courses*', async (route) => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const response = await route.fetch();
          const body = await response.json();
          body.data.items = [];
          body.meta = {
            ...body.meta,
            page: 1,
            totalItems: 0,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          };
          await route.fulfill({ response, json: body });
        });
      },
      states: async (page) => {
        await expect(page.getByText('Đang tải tiến độ khóa học...')).toBeVisible();
        await expect(page.getByText('Không có khóa học phù hợp với bộ lọc')).toBeVisible();
        await page.unroute('**/api/v1/students/me/progress/courses*');
        await page.route('**/api/v1/students/me/progress/courses*', (route) =>
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { code: 'QUALITY_TEST_ERROR', message: 'Controlled quality test failure' },
            }),
          }),
        );
        await page.reload();
        await expect(page.getByRole('alert')).toBeVisible();
      },
    });
  });
});
