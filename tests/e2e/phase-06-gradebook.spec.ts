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

test('Teacher filters the owned Gradebook and drills into Student progress', async ({ page }) => {
  await login(page);
  await page.goto(`/teacher/courses/${courseId}`);
  await page.getByRole('link', { name: 'Gradebook' }).click();
  await expect(page).toHaveURL(new RegExp(`/teacher/courses/${courseId}/gradebook`, 'u'));
  await expect(page.getByRole('region', { name: 'Bảng điểm Gradebook' })).toBeVisible();

  await page.getByLabel('Trạng thái chấm điểm').selectOption('RETURNED');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page).toHaveURL(/gradingStatus=RETURNED/u);
  await expect(
    page.getByRole('region', { name: 'Bảng điểm Gradebook' }).getByText('Đã trả điểm').first(),
  ).toBeVisible();

  const detailLinks = page.getByRole('link', { name: /Xem tiến độ của/u });
  if ((await detailLinks.count()) > 0) {
    await detailLinks.first().click();
    await expect(page).toHaveURL(/\/students\/.+\/progress/u);
    await page.getByRole('link', { name: 'Quay lại báo cáo' }).click();
    await expect(page).toHaveURL(/gradebook.*gradingStatus=RETURNED/u);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page, 'Phase 06 Gradebook');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    ),
  ).toEqual([]);
});

test('Teacher regrade invalidates and refreshes the owned Gradebook cell', async ({ page }) => {
  await login(page);
  await page.goto(`/teacher/courses/${courseId}/gradebook`);
  const gradebook = page.getByRole('region', { name: 'Bảng điểm Gradebook' });
  await expect(gradebook).toBeVisible();

  await gradebook
    .getByRole('link', {
      name: 'Mở chấm điểm Thiết kế REST Endpoint của Demo Student Active',
    })
    .click();
  const studentRow = page.getByRole('row').filter({ hasText: 'Demo Student Active' });
  await studentRow.getByRole('link', { name: 'Chấm bài' }).click();

  const scoreInput = page.getByLabel(/Điểm/u);
  const currentScore = Number(await scoreInput.inputValue());
  const nextScore = currentScore === 8 ? 7 : 8;
  await scoreInput.fill(String(nextScore));
  await page.getByLabel('Lý do chấm lại').fill('Xác minh Gradebook cập nhật sau thao tác chấm lại');
  await page.getByRole('button', { name: 'Chấm lại' }).click();
  await expect(page.getByText('Đã chấm lại và lưu lịch sử thay đổi.')).toBeVisible();

  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Danh sách nộp bài' })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/teacher/courses/${courseId}/gradebook`, 'u'));
  await expect(
    page
      .getByRole('region', { name: 'Bảng điểm Gradebook' })
      .getByText(`${nextScore}/10`, { exact: true }),
  ).toBeVisible();
});

test('Teacher cannot enumerate another Course through the Gradebook URL', async ({ page }) => {
  await login(page);
  await page.goto('/teacher/courses/507f1f77bcf86cd799439099/gradebook');
  await expect(page.getByText('Bạn không có quyền xem Gradebook của Course này.')).toBeVisible();
});
