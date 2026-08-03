import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const demoPassword = process.env.E2E_DEMO_PASSWORD;
if (!demoPassword) {
  throw new Error('E2E_DEMO_PASSWORD is required; seed:demo must use the same runtime value');
}

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin.active@example.test');
  await page.getByLabel(/Mật khẩu/u).fill(demoPassword!);
  await page.getByRole('button', { name: /Đăng nhập/u }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/u);
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth, `${label} horizontal overflow`).toBeLessThanOrEqual(
    dimensions.clientWidth + 1,
  );
}

test('Admin reviews governance metadata and retains management workflows', async ({ page }) => {
  await login(page);
  await expect(page.getByRole('heading', { name: 'Tổng quan hệ thống' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Người dùng/u }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Lời mời Teacher/u })).toBeVisible();
  await expect(page.getByRole('link', { name: /Classroom/u }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Course/u }).first()).toBeVisible();
  await expect(page.getByText(/Cập nhật lúc/u)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tải CSV' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Adoption' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Learning outcomes' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Báo cáo quản trị' }).click();
  await expect(page).toHaveURL(/\/admin\/reports\/governance/u);
  await expect(page.getByRole('heading', { name: 'Báo cáo quản trị' })).toBeVisible();
  await page.getByLabel('Role', { exact: true }).selectOption('STUDENT');
  await expect(page).toHaveURL(/role=STUDENT/u);
  await page.getByLabel('Actor role').selectOption('ADMIN');
  await expect(page).toHaveURL(/actorRole=ADMIN/u);
  await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible();
  await expect(page.getByRole('button', { name: /CSV/u })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page, 'Phase 06 Admin governance');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    ),
  ).toEqual([]);
});

test('Admin governance never exposes raw learning content or private answers', async ({ page }) => {
  await login(page);
  await page.goto('/admin/reports/governance');
  await expect(page.getByRole('heading', { name: 'Báo cáo quản trị' })).toBeVisible();

  const body = await page.locator('body').innerText();
  expect(body).not.toMatch(/rawAnswer|passwordHash|refreshToken|feedbackText/u);
  await expect(page.getByText('Idempotency giúp API an toàn khi retry như thế nào?')).toHaveCount(
    0,
  );
});
