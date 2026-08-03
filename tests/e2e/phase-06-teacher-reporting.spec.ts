import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const demoPassword = process.env.E2E_DEMO_PASSWORD;
if (!demoPassword) {
  throw new Error('E2E_DEMO_PASSWORD is required; seed:demo must use the same runtime value');
}
const courseId = '650000000000000000000001';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('teacher.active@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword!);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/teacher\/dashboard/u);
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

test('Teacher reviews owned Course ranking, filters and Student detail', async ({ page }) => {
  await login(page);
  await page.goto(`/teacher/courses/${courseId}`);
  await expect(page.getByRole('heading', { name: 'RESTful API Microlearning' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tổng quan tiến độ' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Quản lý nội dung/u })).toBeVisible();

  await page.getByRole('link', { name: /Phân tích chi tiết/u }).click();
  await expect(page).toHaveURL(new RegExp(`/teacher/courses/${courseId}/analytics`, 'u'));
  await expect(page.getByRole('tab', { name: 'Tiến độ' })).toHaveAttribute('aria-selected', 'true');
  await page.getByLabel('Trạng thái').selectOption('MISSING');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page).toHaveURL(/progressStatus=MISSING/u);

  await page.getByRole('tab', { name: 'Tiến độ' }).click();
  const detailLinks = page.getByRole('link', { name: /Xem tiến độ của/u });
  if ((await detailLinks.count()) > 0) {
    await detailLinks.first().click();
    await expect(page.getByRole('heading', { name: /Student/u })).toBeVisible();
    await page.getByRole('link', { name: 'Quay lại báo cáo' }).click();
    await expect(page).toHaveURL(/analytics/u);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page, 'Phase 06 Teacher analytics');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    ),
  ).toEqual([]);
});

test('Teacher cannot enumerate another Course through reporting URLs', async ({ page }) => {
  await login(page);
  await page.goto('/teacher/courses/507f1f77bcf86cd799439099/analytics');
  await expect(page.getByText(/Không thể tải báo cáo hoặc bạn không còn quyền/u)).toBeVisible();
});
