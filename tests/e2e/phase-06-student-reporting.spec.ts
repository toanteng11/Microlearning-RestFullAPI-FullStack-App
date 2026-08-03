import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const demoPassword = process.env.E2E_DEMO_PASSWORD;
if (!demoPassword) {
  throw new Error('E2E_DEMO_PASSWORD is required; seed:demo must use the same runtime value');
}

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('student.active@example.test');
  await page.getByLabel(/Mật khẩu/u).fill(demoPassword!);
  await page.getByRole('button', { name: /Đăng nhập/u }).click();
  await expect(page).toHaveURL(/\/student\/dashboard/u);
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

async function expectNoSeriousAccessibilityViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );
  expect(blocking, `${label} serious/critical accessibility violations`).toEqual([]);
}

test('Student reviews dashboard reporting and URL-backed Course progress', async ({ page }) => {
  await login(page);
  await expect(page.getByRole('heading', { name: 'Tổng quan học tập' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Việc cần làm' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tiến độ khóa học' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tham gia lớp học' })).toBeVisible();

  await page.getByRole('link', { name: 'Xem toàn bộ tiến độ' }).click();
  await expect(page).toHaveURL(/\/student\/progress/u);
  await expect(page.getByRole('heading', { name: 'Tiến độ khóa học' })).toBeVisible();
  await page.getByLabel('Trạng thái').selectOption('MISSING');
  await expect(page).toHaveURL(/progressStatus=MISSING/u);
  await page.goBack();
  await expect(page.getByLabel('Trạng thái')).toHaveValue('');

  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page, 'Phase 06 Student progress');
  await expectNoSeriousAccessibilityViolations(page, 'Phase 06 Student progress');
});
