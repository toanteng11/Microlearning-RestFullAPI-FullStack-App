import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const localMode = process.env.E2E_PHASE08_LOCAL_MODE === 'true';
const webUrl = process.env.E2E_WEB_URL ?? 'http://localhost:3000';
const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:4000';
const demoPassword = process.env.E2E_DEMO_PASSWORD ?? '';
const expectedCommit = process.env.E2E_EXPECTED_COMMIT ?? '';
const courseId = '650000000000000000000001';
const classroomId = '640000000000000000000001';
const foreignCourseId = '507f1f77bcf86cd799439099';

test.describe('Phase 08 local academic acceptance', () => {
  test.skip(!localMode, 'Local acceptance runs only against a seeded test stack.');

  test.beforeAll(() => {
    expect(demoPassword.length).toBeGreaterThanOrEqual(12);
    expect(expectedCommit).toMatch(/^[a-f0-9]{40}$/u);
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
      headers: { Origin: webUrl },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    return body.data.accessToken as string;
  }

  test('L0/L2: local API identity, readiness and OpenAPI match the source', async ({ request }) => {
    const ready = await request.get(`${apiUrl}/ready`);
    expect(ready.status()).toBe(200);
    const web = await request.get(`${webUrl}/health`);
    expect(web.status()).toBe(200);

    const versionResponse = await request.get(`${apiUrl}/api/v1/system/version`);
    expect(versionResponse.status()).toBe(200);
    const version = (await versionResponse.json()).data;
    expect(version).toMatchObject({ environment: 'test', commitSha: expectedCommit });

    const contractResponse = await request.get(`${apiUrl}/api/v1/openapi.json`);
    expect(contractResponse.status()).toBe(200);
    expect((await contractResponse.json()).openapi).toBe('3.0.3');
  });

  test('L3: unauthenticated, malformed and unknown requests fail predictably', async ({
    request,
  }) => {
    expect((await request.get(`${apiUrl}/api/v1/admin/users/students`)).status()).toBe(401);
    expect(
      (
        await request.post(`${apiUrl}/api/v1/auth/login`, {
          data: { email: 'not-an-email', password: 'short' },
          headers: { Origin: webUrl },
        })
      ).status(),
    ).toBe(422);
    expect((await request.get(`${apiUrl}/api/v1/phase-08-local-missing`)).status()).toBe(404);
  });

  test('L3: role, ownership and duplicate logout boundaries hold', async ({ request }) => {
    const studentToken = await apiLogin(request, 'student.active@example.test');
    const denied = await request.get(`${apiUrl}/api/v1/admin/users/students`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(denied.status()).toBe(403);

    const teacherToken = await apiLogin(request, 'teacher.active@example.test');
    const foreignCourse = await request.get(
      `${apiUrl}/api/v1/teacher/courses/${foreignCourseId}/progress`,
      { headers: { Authorization: `Bearer ${teacherToken}` } },
    );
    expect([403, 404]).toContain(foreignCourse.status());

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const logout = await request.post(`${apiUrl}/api/v1/auth/logout`, {
        headers: { Origin: webUrl },
      });
      expect(logout.status()).toBe(204);
    }
  });

  test('L3: Student reaches classwork and progress', async ({ page }) => {
    await login(page, 'student.active@example.test', /\/student\/dashboard/u);
    await page.goto(`/student/classrooms/${classroomId}?tab=classwork`);
    await expect(
      page.getByRole('heading', { name: 'Microlearning API Foundations' }),
    ).toBeVisible();
    await page.goto('/student/progress');
    await expect(page.getByRole('heading', { name: 'Tiến độ khóa học' })).toBeVisible();
  });

  test('L3: Teacher reaches owned content, gradebook and analytics', async ({ page }) => {
    await login(page, 'teacher.active@example.test', /\/teacher\/dashboard/u);
    await page.goto(`/teacher/courses/${courseId}`);
    await expect(page.getByRole('heading', { name: 'RESTful API Microlearning' })).toBeVisible();
    await page.goto(`/teacher/courses/${courseId}/gradebook`);
    await expect(page.getByRole('region', { name: 'Bảng điểm Gradebook' })).toBeVisible();
    await page.goto(`/teacher/courses/${courseId}/analytics`);
    await expect(page.getByRole('tab', { name: 'Tiến độ' })).toBeVisible();
  });

  test('L3: Admin and Super Admin governance remain separated', async ({ page, browser }) => {
    await login(page, 'admin.active@example.test', /\/admin\/dashboard/u);
    await page.goto('/admin/users/students');
    await expect(page.getByRole('heading', { name: 'Student List' })).toBeVisible();
    await page.goto('/admin/reports/governance');
    await expect(page.getByRole('heading', { name: 'Báo cáo quản trị' })).toBeVisible();

    const superAdminContext = await browser.newContext({ baseURL: webUrl });
    try {
      const superAdminPage = await superAdminContext.newPage();
      await login(superAdminPage, 'superadmin.active@example.test', /\/admin\/dashboard/u);
      await superAdminPage.goto('/admin/users/admins');
      await expect(superAdminPage.getByRole('heading', { name: 'Admin List' })).toBeVisible();
    } finally {
      await superAdminContext.close();
    }
  });
});
