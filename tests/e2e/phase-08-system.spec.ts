import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const phase08Mode = process.env.E2E_PHASE08_MODE === 'true';
const webUrl = process.env.E2E_WEB_URL ?? '';
const apiUrl = process.env.E2E_API_URL ?? '';
const demoPassword = process.env.E2E_DEMO_PASSWORD ?? '';
const releaseId = process.env.E2E_PHASE08_RELEASE_ID ?? '';
const expectedCommit = process.env.E2E_EXPECTED_COMMIT ?? '';
const expectedImage = process.env.E2E_EXPECTED_IMAGE ?? '';
const expectedRevision = process.env.E2E_EXPECTED_REVISION ?? '';
const courseId = '650000000000000000000001';
const classroomId = '640000000000000000000001';
const foreignCourseId = '507f1f77bcf86cd799439099';

test.describe('Phase 08 release System Test', () => {
  test.skip(!phase08Mode, 'Phase 08 System Test runs only against a locked Staging candidate.');

  test.beforeAll(() => {
    expect(webUrl).toMatch(/^https:\/\//u);
    expect(apiUrl).toBe(webUrl);
    expect(demoPassword.length).toBeGreaterThanOrEqual(12);
    expect(releaseId).toMatch(/^P08-RC-\d{8}-[a-f0-9]{7,12}$/u);
    expect(expectedCommit).toMatch(/^[a-f0-9]{40}$/u);
    expect(expectedImage).toMatch(/@sha256:[a-f0-9]{64}$/u);
    expect(expectedRevision).toMatch(/^microlearning-staging-[a-z0-9-]+$/u);
  });

  test.beforeEach(({ browserName }, testInfo) => {
    testInfo.annotations.push(
      { type: 'release-id', description: releaseId },
      { type: 'commit', description: expectedCommit },
      { type: 'revision', description: expectedRevision },
      { type: 'browser', description: browserName },
    );
  });

  async function login(page: Page, email: string, destination: RegExp) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(destination);
  }

  async function apiLogin(request: APIRequestContext, email: string) {
    const response = await request.post(`${apiUrl}/api/v1/auth/login`, {
      data: { email, password: demoPassword },
      headers: { Origin: webUrl, 'x-phase-08-release-id': releaseId },
    });
    expect(response.status(), `Synthetic login failed for ${email}`).toBe(200);
    const body = await response.json();
    expect(body?.data?.user?.email).toBe(email);
    expect(body?.data?.accessToken).toMatch(/^eyJ/u);
    return body.data.accessToken as string;
  }

  async function getWithNetworkRetry(request: APIRequestContext, url: string) {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await request.get(url);
      } catch (error) {
        lastError = error;
        if (!/EAI_AGAIN|ENOTFOUND|ECONNRESET/iu.test(String(error)) || attempt === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1_000 * 2 ** attempt));
      }
    }
    throw lastError;
  }

  test('[P08-ST-001] Platform identity, health and OpenAPI are exact', async ({ request }) => {
    for (const path of ['/health', '/ready']) {
      const response = await getWithNetworkRetry(request, `${apiUrl}${path}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
    }

    const versionResponse = await getWithNetworkRetry(request, `${apiUrl}/api/v1/system/version`);
    expect(versionResponse.status()).toBe(200);
    const version = (await versionResponse.json())?.data;
    expect(version).toMatchObject({
      environment: 'staging',
      commitSha: expectedCommit,
      imageDigest: expectedImage.split('@').at(-1),
    });

    const openApiResponse = await getWithNetworkRetry(request, `${apiUrl}/api/v1/openapi.json`);
    expect(openApiResponse.status()).toBe(200);
    const openApi = await openApiResponse.json();
    expect(openApi.openapi).toBe('3.0.3');
    for (const path of [
      '/api/v1/auth/login',
      '/api/v1/classrooms',
      '/api/v1/courses',
      '/api/v1/teacher/courses/{courseId}/gradebook',
      '/api/v1/teacher/courses/{courseId}/progress',
    ]) {
      expect(openApi.paths[path], `OpenAPI path missing: ${path}`).toBeTruthy();
    }
    const swaggerResponse = await getWithNetworkRetry(request, `${apiUrl}/api-docs/`);
    expect(swaggerResponse.status()).toBe(200);
    expect(swaggerResponse.headers()['content-type']).toContain('text/html');
    const swaggerHtml = await swaggerResponse.text();
    expect(swaggerHtml).toContain('<title>Microlearning API Documentation</title>');
    expect(swaggerHtml).toContain('<div id="swagger-ui"></div>');
  });

  test('[P08-ST-002] API rejects unauthenticated, invalid and unknown requests', async ({
    request,
  }) => {
    const unauthenticated = await request.get(`${apiUrl}/api/v1/admin/users/students`);
    expect(unauthenticated.status()).toBe(401);

    const invalidPayload = await request.post(`${apiUrl}/api/v1/auth/login`, {
      data: { email: 'not-an-email', password: 'short' },
      headers: { Origin: webUrl },
    });
    expect(invalidPayload.status()).toBe(422);

    const notFound = await request.get(`${apiUrl}/api/v1/phase-08-system-test-missing`);
    expect(notFound.status()).toBe(404);
    expect(notFound.headers()['content-type']).toContain('application/json');
  });

  test('[P08-ST-003] RBAC, ownership and duplicate retry boundaries hold', async ({ request }) => {
    const studentToken = await apiLogin(request, 'student.active@example.test');
    const studentAdminAttempt = await request.get(`${apiUrl}/api/v1/admin/users/students`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(studentAdminAttempt.status()).toBe(403);

    const teacherToken = await apiLogin(request, 'teacher.active@example.test');
    const foreignOwnership = await request.get(
      `${apiUrl}/api/v1/teacher/courses/${foreignCourseId}/progress`,
      { headers: { Authorization: `Bearer ${teacherToken}` } },
    );
    expect([403, 404]).toContain(foreignOwnership.status());

    const logout = await request.post(`${apiUrl}/api/v1/auth/logout`, {
      headers: { Origin: webUrl },
    });
    expect(logout.status()).toBe(204);
    const duplicateLogout = await request.post(`${apiUrl}/api/v1/auth/logout`, {
      headers: { Origin: webUrl },
    });
    expect(duplicateLogout.status()).toBe(204);
  });

  test('[P08-ST-004] Student P0 learning journey spans Phase 2 through 6', async ({ page }) => {
    await login(page, 'student.active@example.test', /\/student\/dashboard/u);
    await expect(page.getByRole('heading', { name: 'Tổng quan học tập' })).toBeVisible();
    await page.goto(`/student/classrooms/${classroomId}?tab=classwork`);
    await expect(
      page.getByRole('heading', { name: 'Microlearning API Foundations' }),
    ).toBeVisible();
    await page.goto('/student/todo');
    await expect(page.getByRole('heading', { name: 'Việc cần làm' })).toBeVisible();
    await expect(page.getByText('Docker và Cloud Run')).toBeVisible();
    await page.goto('/student/progress');
    await expect(page.getByRole('heading', { name: 'Tiến độ khóa học' })).toBeVisible();
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
  });

  test('[P08-ST-005] Teacher P0 journey covers content, grading and analytics', async ({
    page,
  }) => {
    await login(page, 'teacher.active@example.test', /\/teacher\/dashboard/u);
    await page.goto(`/teacher/courses/${courseId}`);
    await expect(page.getByRole('heading', { name: 'RESTful API Microlearning' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Quản lý nội dung/u })).toBeVisible();
    await page.goto(`/teacher/courses/${courseId}/gradebook`);
    await expect(page.getByRole('region', { name: 'Bảng điểm Gradebook' })).toBeVisible();
    await page.goto(`/teacher/courses/${courseId}/analytics`);
    await expect(page.getByRole('tab', { name: 'Tiến độ' })).toBeVisible();
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
  });

  test('[P08-ST-006] Admin and Super Admin P0 governance remains separated', async ({
    page,
    browser,
  }) => {
    await login(page, 'admin.active@example.test', /\/admin\/dashboard/u);
    await page.goto('/admin/users/students');
    await expect(page.getByRole('heading', { name: 'Student List' })).toBeVisible();
    await page.goto('/admin/reports/governance');
    await expect(page.getByRole('heading', { name: 'Báo cáo quản trị' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible();

    const superAdminContext = await browser.newContext({ baseURL: webUrl });
    const superAdminPage = await superAdminContext.newPage();
    try {
      await login(superAdminPage, 'superadmin.active@example.test', /\/admin\/dashboard/u);
      await superAdminPage.goto('/admin/users/admins');
      await expect(superAdminPage.getByRole('heading', { name: 'Admin List' })).toBeVisible();
      await expect(superAdminPage.getByText('Super Admin').first()).toBeVisible();
    } finally {
      await superAdminContext.close();
    }
  });
});
