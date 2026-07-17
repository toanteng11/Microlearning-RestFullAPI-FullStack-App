import { expect, test } from '@playwright/test';

const webUrl = process.env.E2E_WEB_URL ?? 'http://localhost:3000';
const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:4000';
const demoPassword = process.env.E2E_DEMO_PASSWORD;

if (!demoPassword) {
  throw new Error('E2E_DEMO_PASSWORD is required; seed:demo must use the same runtime value');
}

const runId = `${Date.now()}-${process.pid}`;
const studentEmail = `student.e2e.${runId}@example.test`;
const teacherEmail = `teacher.e2e.${runId}@example.test`;

test.describe.configure({ mode: 'serial' });

test('System Status, Swagger, and public auth screens render without mobile overflow', async ({
  page,
  request,
}) => {
  const health = await request.get(`${apiUrl}/health`);
  expect(health.ok()).toBeTruthy();

  const contract = await request.get(`${apiUrl}/api/v1/openapi.json`);
  expect(contract.ok()).toBeTruthy();
  const document = await contract.json();
  expect(document.openapi).toBe('3.0.3');
  expect(document.paths['/api/v1/teacher/invitations/accept']).toBeTruthy();

  await page.goto(`${apiUrl}/api-docs`);
  await expect(page.locator('.swagger-ui .title')).toContainText('Microlearning Classroom LMS API');

  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/system-status', '/login', '/register']) {
    await page.goto(`${webUrl}${path}`);
    await expect(page.locator('body')).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth, `${path} horizontal overflow`).toBeLessThanOrEqual(
      dimensions.clientWidth + 1,
    );
  }
});

test('Student can register, login, update profile, and logout with memory-only access token', async ({
  page,
  context,
}) => {
  await page.goto('/register');
  await page.getByLabel('Họ và tên').fill('E2E Student');
  await page.getByLabel('Email').fill(studentEmail);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByLabel('Xác nhận mật khẩu').fill(demoPassword);
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
  await expect(page.getByText('Đăng ký thành công')).toBeVisible();

  await page.getByLabel('Email').fill(studentEmail);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByText('Việc cần làm')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quay lại trang trước' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đi tới trang tiếp theo' })).toBeVisible();

  const refreshCookie = (await context.cookies()).find((cookie) => cookie.name === 'ml_refresh');
  expect(refreshCookie).toMatchObject({ httpOnly: true, secure: false, sameSite: 'Lax' });
  expect(refreshCookie?.path).toBe('/api/v1/auth');
  const persistentStorage = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
  }));
  expect(JSON.stringify(persistentStorage)).not.toMatch(/token|authorization|bearer/iu);

  await page.getByRole('link', { name: 'Hồ sơ' }).click();
  await expect(page.getByRole('heading', { name: 'Hồ sơ cá nhân' })).toBeVisible();
  await page.getByLabel('Họ và tên').fill('E2E Student Updated');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText('Đã cập nhật hồ sơ.')).toBeVisible();

  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
  expect((await context.cookies()).find((cookie) => cookie.name === 'ml_refresh')).toBeUndefined();
});

test('Two Student tabs refresh concurrently without revoking the session family', async ({
  page,
  context,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(studentEmail);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByText('Việc cần làm')).toBeVisible();
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Hồ sơ cá nhân' })).toBeVisible();

  const secondPage = await context.newPage();
  try {
    await secondPage.goto('/profile');
    await expect(secondPage.getByRole('heading', { name: 'Hồ sơ cá nhân' })).toBeVisible();

    await Promise.all([page.reload(), secondPage.reload()]);
    await expect(page.getByRole('heading', { name: 'Hồ sơ cá nhân' })).toBeVisible();
    await expect(secondPage.getByRole('heading', { name: 'Hồ sơ cá nhân' })).toBeVisible();
    await expect(page.getByLabel('Họ và tên')).toHaveValue('E2E Student Updated');
    await expect(secondPage.getByLabel('Họ và tên')).toHaveValue('E2E Student Updated');
  } finally {
    await secondPage.close();
  }

  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
});

test('Admin creates a manual invitation and Teacher activates then logs in', async ({
  page,
  context,
  browser,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: webUrl });
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin.active@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible();
  await page.getByRole('link', { name: /Lời mời Teacher/u }).click();
  await expect(page.getByRole('heading', { name: 'Lời mời Teacher' })).toBeVisible();

  await page.getByLabel('Email giảng viên', { exact: true }).fill(teacherEmail);
  await page.getByLabel('Hiệu lực').selectOption('7');
  await page.getByRole('button', { name: 'Tạo link mời' }).click();
  const linkInput = page.getByLabel('Link mời Teacher');
  await expect(linkInput).toBeVisible();
  const invitationLink = await linkInput.inputValue();
  expect(invitationLink).toContain('/teacher/invite?token=');
  const invitationOrigin = new URL(invitationLink).origin;
  await page.getByLabel('Kênh gửi link').selectOption('ZALO');
  await page.getByRole('button', { name: 'Sao chép' }).click();
  await expect(page.getByText('Đã sao chép link và ghi nhận Audit Log.')).toBeVisible();
  await page.getByRole('button', { name: 'Đóng link một lần' }).click();
  await expect(linkInput).toBeHidden();

  const teacherContext = await browser.newContext({ baseURL: webUrl });
  const teacherPage = await teacherContext.newPage();
  try {
    await teacherPage.goto(invitationLink);
    await expect(teacherPage).toHaveURL(`${invitationOrigin}/teacher/invite`);
    const invitedEmail = teacherPage.getByLabel('Email', { exact: true });
    await expect(invitedEmail).toHaveValue(teacherEmail);
    await expect(invitedEmail).toHaveAttribute('readonly', '');
    await teacherPage.getByLabel('Họ và tên').fill('E2E Teacher');
    await teacherPage.getByLabel('Mật khẩu mới').fill(demoPassword);
    await teacherPage.getByLabel('Xác nhận mật khẩu').fill(demoPassword);
    await teacherPage.getByRole('button', { name: 'Kích hoạt tài khoản' }).click();
    await expect(teacherPage.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
    await expect(teacherPage.getByText('Kích hoạt')).toBeVisible();

    await teacherPage.getByLabel('Email').fill(teacherEmail);
    await teacherPage.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
    await teacherPage.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(teacherPage.getByText('Khóa học của tôi')).toBeVisible();
  } finally {
    await teacherContext.close();
  }

  await page.goto(`/admin/users/teachers?keyword=${encodeURIComponent(teacherEmail)}`);
  await expect(page.getByRole('table').getByText(teacherEmail)).toBeVisible();
});
