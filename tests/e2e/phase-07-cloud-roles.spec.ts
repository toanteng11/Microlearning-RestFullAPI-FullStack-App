import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const cloudMode = process.env.E2E_CLOUD_MODE === 'true';
const webUrl = process.env.E2E_WEB_URL ?? '';
const apiUrl = process.env.E2E_API_URL ?? '';
const demoPassword = process.env.E2E_DEMO_PASSWORD ?? '';
const runId = process.env.E2E_RUN_ID ?? 'local-disabled';
const expectedCommit = process.env.E2E_EXPECTED_COMMIT ?? '';
const expectedImage = process.env.E2E_EXPECTED_IMAGE ?? '';
const expectedRevision = process.env.E2E_EXPECTED_REVISION ?? '';
const courseId = '650000000000000000000001';

test.describe('Phase 07 Staging cloud roles', () => {
  test.skip(!cloudMode, 'Cloud role journeys run only after a successful Staging deployment.');
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    expect(webUrl).toMatch(/^https:\/\//u);
    expect(apiUrl).toBe(webUrl);
    expect(demoPassword.length).toBeGreaterThanOrEqual(12);
    expect(expectedCommit).toMatch(/^[a-f0-9]{40}$/u);
    expect(expectedImage).toMatch(/@sha256:[a-f0-9]{64}$/u);
    expect(expectedRevision).not.toBe('');
  });

  test.beforeEach(({ browserName }, testInfo) => {
    testInfo.annotations.push(
      { type: 'phase-07-run', description: runId },
      { type: 'commit', description: expectedCommit },
      { type: 'revision', description: expectedRevision },
      { type: 'browser', description: browserName },
    );
  });

  async function login(page: Page, email: string, expectedPath: RegExp) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(expectedPath);
  }

  async function apiLogin(request: APIRequestContext, email: string) {
    const response = await request.post(`${apiUrl}/api/v1/auth/login`, {
      data: { email, password: demoPassword },
      headers: { Origin: webUrl, 'x-phase-07-run-id': runId },
    });
    expect(response.status(), `API login failed for synthetic ${email}`).toBe(200);
    const body = await response.json();
    expect(body?.data?.user?.email).toBe(email);
    expect(typeof body?.data?.accessToken).toBe('string');
    return body.data.accessToken as string;
  }

  test('Student reviews learning work and keeps a secure concurrent session', async ({
    page,
    context,
  }) => {
    await login(page, 'student.active@example.test', /\/student\/dashboard/u);
    await expect(page.getByRole('heading', { name: 'Tổng quan học tập' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Việc cần làm' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tiến độ khóa học' })).toBeVisible();

    const refreshCookie = (await context.cookies()).find((cookie) => cookie.name === 'ml_refresh');
    expect(refreshCookie).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/api/v1/auth',
    });
    const persistentStorage = await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }));
    expect(JSON.stringify(persistentStorage)).not.toMatch(/token|authorization|bearer/iu);

    await page.goto('/student/progress');
    await expect(page.getByRole('heading', { name: 'Tiến độ khóa học' })).toBeVisible();
    const secondPage = await context.newPage();
    try {
      await secondPage.goto('/student/progress');
      await expect(secondPage.getByRole('heading', { name: 'Tiến độ khóa học' })).toBeVisible();
      await Promise.all([page.reload(), secondPage.reload()]);
      await expect(page.getByRole('heading', { name: 'Tiến độ khóa học' })).toBeVisible();
      await expect(secondPage.getByRole('heading', { name: 'Tiến độ khóa học' })).toBeVisible();
    } finally {
      await secondPage.close();
    }

    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
    expect(
      (await context.cookies()).find((cookie) => cookie.name === 'ml_refresh'),
    ).toBeUndefined();
  });

  test('Teacher reviews owned progress and Gradebook while foreign ownership stays hidden', async ({
    page,
  }) => {
    await login(page, 'teacher.active@example.test', /\/teacher\/dashboard/u);
    await page.goto(`/teacher/courses/${courseId}`);
    await expect(page.getByRole('heading', { name: 'RESTful API Microlearning' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tổng quan tiến độ' })).toBeVisible();

    await page.goto(`/teacher/courses/${courseId}/gradebook`);
    await expect(page.getByRole('region', { name: 'Bảng điểm Gradebook' })).toBeVisible();
    await page.goto('/teacher/courses/507f1f77bcf86cd799439099/analytics');
    await expect(page.getByText(/Không thể tải báo cáo hoặc bạn không còn quyền/u)).toBeVisible();

    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
  });

  test('Admin reviews separated user lists and governance reporting', async ({ page }) => {
    await login(page, 'admin.active@example.test', /\/admin\/dashboard/u);
    await expect(page.getByRole('heading', { name: 'Tổng quan hệ thống' })).toBeVisible();

    for (const [path, heading] of [
      ['/admin/users/students', 'Student List'],
      ['/admin/users/teachers', 'Teacher List'],
      ['/admin/users/admins', 'Admin List'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
    await page.goto('/admin/reports/governance');
    await expect(page.getByRole('heading', { name: 'Báo cáo quản trị' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible();

    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
  });

  test('Super Admin sees admin governance while cross-role API access is denied', async ({
    page,
    request,
  }) => {
    await login(page, 'superadmin.active@example.test', /\/admin\/dashboard/u);
    await page.goto('/admin/users/admins');
    await expect(page.getByRole('heading', { name: 'Admin List' })).toBeVisible();
    await expect(page.getByText('Super Admin').first()).toBeVisible();

    const unauthenticated = await request.get(`${apiUrl}/api/v1/admin/users/students`);
    expect(unauthenticated.status()).toBe(401);

    const studentToken = await apiLogin(request, 'student.active.2@example.test');
    const studentAdminAttempt = await request.get(`${apiUrl}/api/v1/admin/users/students`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(studentAdminAttempt.status()).toBe(403);

    const teacherToken = await apiLogin(request, 'teacher.active@example.test');
    const teacherAdminAttempt = await request.get(`${apiUrl}/api/v1/admin/users/admins`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    expect(teacherAdminAttempt.status()).toBe(403);

    const ownCourseRequests = await Promise.all(
      [1, 2].map(() =>
        request.get(`${apiUrl}/api/v1/teacher/courses/${courseId}/progress`, {
          headers: { Authorization: `Bearer ${teacherToken}`, 'x-phase-07-run-id': runId },
        }),
      ),
    );
    expect(ownCourseRequests.map((response) => response.status())).toEqual([200, 200]);
    const foreignCourse = await request.get(
      `${apiUrl}/api/v1/teacher/courses/507f1f77bcf86cd799439099/progress`,
      { headers: { Authorization: `Bearer ${teacherToken}` } },
    );
    expect([403, 404]).toContain(foreignCourse.status());

    const superAdminToken = await apiLogin(request, 'superadmin.active@example.test');
    const adminList = await request.get(`${apiUrl}/api/v1/admin/users/admins`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    expect(adminList.status()).toBe(200);

    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
  });
});
