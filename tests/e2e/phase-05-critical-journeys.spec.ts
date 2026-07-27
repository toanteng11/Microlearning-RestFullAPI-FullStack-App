import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const demoPassword = process.env.E2E_DEMO_PASSWORD;
const webUrl = process.env.E2E_WEB_URL ?? 'http://localhost:3000';
if (!demoPassword) {
  throw new Error('E2E_DEMO_PASSWORD is required; seed:demo must use the same runtime value');
}

const ids = {
  course: '650000000000000000000001',
  quizReview: '660000000000000000000001',
  assignmentExtended: '660000000000000000000042',
  submissionReturned: '660000000000000000000051',
  assignmentGrade: '660000000000000000000061',
} as const;

let authoredQuizId = '';
let authoredAssignmentId = '';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword!);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).not.toHaveURL(/\/login$/u);
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

test.describe.configure({ mode: 'serial' });

test('Teacher creates, authors, previews and publishes an objective Quiz', async ({ page }) => {
  await login(page, 'teacher.active@example.test');
  await page.goto(`/teacher/courses/${ids.course}/quizzes/new`);
  await page.getByLabel('Tên bài kiểm tra').fill('E2E HTTP Creation Quiz');
  await page.getByLabel('Hướng dẫn').fill('Chọn status code khi tạo tài nguyên thành công.');
  await page
    .getByLabel('Hạn hoàn thành')
    .fill(new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 16));
  await page.getByLabel('Số lượt làm').fill('1');
  await page.getByLabel('Thời gian (phút)').fill('15');
  await page.getByLabel('Công bố kết quả').selectOption('IMMEDIATE');
  await page.getByRole('button', { name: 'Tạo bài kiểm tra' }).click();
  await expect(page.getByRole('heading', { name: 'E2E HTTP Creation Quiz' })).toBeVisible();
  authoredQuizId = page.url().match(/\/teacher\/quizzes\/([^/]+)\/edit/u)?.[1] ?? '';
  expect(authoredQuizId).toMatch(/^[a-f\d]{24}$/u);

  await page.getByRole('button', { name: 'Thêm câu hỏi' }).click();
  await page.getByLabel('Nội dung câu hỏi').fill('Status code nào dùng khi tạo thành công?');
  await page.getByLabel('Điểm').fill('1');
  await page.getByLabel('Nội dung phương án 1').fill('201 Created');
  await page.getByLabel('Nội dung phương án 2').fill('400 Bad Request');
  await page.getByRole('button', { name: 'Lưu câu hỏi' }).click();
  await expect(page.getByText('Đã thêm câu hỏi.')).toBeVisible();

  await page.getByRole('link', { name: 'Xem trước' }).click();
  await expect(page.getByText('Status code nào dùng khi tạo thành công?')).toBeVisible();
  await page.getByRole('link', { name: 'Trình soạn bài kiểm tra' }).click();
  await page.getByRole('button', { name: 'Xuất bản' }).click();
  await page.getByLabel('Lý do').fill('Phát hành Quiz cho E2E');
  await page.getByRole('dialog').getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByText('Đã cập nhật trạng thái bài kiểm tra.')).toBeVisible();
  await expect(page.getByText('Đã xuất bản', { exact: true })).toBeVisible();
});

test('Student starts, saves, resumes, submits and receives an immediate Quiz result', async ({
  page,
}) => {
  await login(page, 'student.active@example.test');
  await page.goto(`/student/quizzes/${authoredQuizId}`);
  await expect(page.getByRole('heading', { name: 'E2E HTTP Creation Quiz' })).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu làm bài' }).click();
  await page.getByLabel('201 Created').check();
  await page.getByRole('button', { name: 'Lưu bài' }).click();
  await expect(page.getByText('Đã lưu câu trả lời.')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('201 Created')).toBeChecked();
  await page.getByRole('button', { name: 'Nộp bài' }).click();
  await page.getByRole('button', { name: 'Xác nhận nộp' }).click();
  await expect(page.getByRole('heading', { name: 'E2E HTTP Creation Quiz' })).toBeVisible();
  await expect(page.getByText('1/1', { exact: true })).toBeVisible();

  await page.goto(`/student/quizzes/${authoredQuizId}`);
  await expect(page.getByText('0', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bắt đầu làm bài' })).toBeDisabled();
});

test('Teacher reviews a short-answer Quiz and releases the result', async ({ page }) => {
  await login(page, 'teacher.active@example.test');
  await page.goto(`/teacher/quizzes/${ids.quizReview}/results`);
  await expect(page.getByRole('heading', { name: 'Review thiết kế API an toàn' })).toBeVisible();
  await expect(page.getByText('Demo Student Active', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Review' }).click();
  await expect(page.getByText('Idempotency giúp API an toàn khi retry như thế nào?')).toBeVisible();
  await page.getByLabel('Điểm được chấm').fill('3');
  await page.getByLabel('Nhận xét cho câu trả lời').fill('Đúng ý chính và có ví dụ retry.');
  await page.getByRole('button', { name: 'Lưu review' }).click();
  await expect(page.getByText('Đã lưu review.')).toBeVisible();
  await page.getByRole('button', { name: 'Hoàn tất review' }).click();
  await expect(page.getByText('Đã hoàn tất review và cập nhật kết quả.')).toBeVisible();
  await expect(page.getByText('Đã có kết quả', { exact: true })).toBeVisible();
});

test('Teacher creates and publishes a TEXT Assignment with resubmission policy', async ({
  page,
}) => {
  await login(page, 'teacher.active@example.test');
  await page.goto(`/teacher/courses/${ids.course}/assignments/new`);
  await page.getByLabel('Tiêu đề').fill('E2E REST Contract Assignment');
  await page.getByLabel('Hướng dẫn').fill('Mô tả request, response và validation của endpoint.');
  await page.getByLabel('Cho phép hủy nộp trước hạn').check();
  await page.getByLabel('Cho phép nộp lại').check();
  await page.getByRole('button', { name: 'Tạo bản nháp' }).click();
  await expect(page.getByRole('heading', { name: 'E2E REST Contract Assignment' })).toBeVisible();
  authoredAssignmentId = page.url().match(/\/teacher\/assignments\/([^/]+)\/edit/u)?.[1] ?? '';
  expect(authoredAssignmentId).toMatch(/^[a-f\d]{24}$/u);
  await page.getByRole('button', { name: 'Xuất bản' }).click();
  await page.getByLabel('Lý do').fill('Phát hành Assignment cho E2E');
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận' }).click();
  await expect(page.getByText('Đã cập nhật trạng thái bài tập.')).toBeVisible();
});

test('Student drafts, turns in, unsubmits and resubmits Assignment; Teacher sees roster', async ({
  page,
  browser,
}) => {
  await login(page, 'student.active@example.test');
  await page.goto(`/student/assignments/${authoredAssignmentId}`);
  await page
    .getByLabel('Nội dung trả lời')
    .fill('POST /api/v1/resources trả 201 và validation error theo contract.');
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText('Đã lưu bản nháp.')).toBeVisible();
  await page.getByRole('button', { name: 'Nộp bài' }).click();
  await page.getByRole('button', { name: 'Xác nhận nộp' }).click();
  await expect(page.getByText('Đã nộp bài tập.')).toBeVisible();
  await page.getByRole('button', { name: 'Hủy nộp' }).click();
  await expect(page.getByText('Bài làm đã trở lại bản nháp.')).toBeVisible();
  await page.getByRole('button', { name: 'Nộp bài' }).click();
  await page.getByRole('button', { name: 'Xác nhận nộp' }).click();
  await expect(page.getByText('Đã nộp bài tập.')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Lịch sử phiên bản/u })).toBeVisible();

  const teacherContext = await browser.newContext({ baseURL: webUrl });
  const teacherPage = await teacherContext.newPage();
  try {
    await login(teacherPage, 'teacher.active@example.test');
    await teacherPage.goto(`/teacher/assignments/${authoredAssignmentId}/submissions`);
    const studentRow = teacherPage.getByRole('row').filter({ hasText: 'Demo Student Active' });
    await expect(studentRow).toContainText('SUBMITTED');
    await expect(studentRow.getByRole('link', { name: 'Chấm bài' })).toBeVisible();
  } finally {
    await teacherContext.close();
  }
});

test('Teacher regrades returned Assignment work with an auditable reason', async ({ page }) => {
  await login(page, 'teacher.active@example.test');
  await page.goto(`/teacher/submissions/${ids.submissionReturned}/grade`);
  await expect(page.getByRole('heading', { name: 'Thiết kế REST Endpoint' })).toBeVisible();
  await expect(page.getByText(/POST \/api\/v1\/resources/u)).toBeVisible();
  await page.getByLabel(/Điểm/u).fill('8');
  await page.getByLabel('Lý do chấm lại').fill('Đánh giá lại theo rubric đã thống nhất');
  await page.getByRole('button', { name: 'Chấm lại' }).click();
  await expect(page.getByText('Đã chấm lại và lưu lịch sử thay đổi.')).toBeVisible();
});

test('Student opens only their own returned Grade detail after regrade', async ({ page }) => {
  await login(page, 'student.active@example.test');
  await page.goto(`/student/grades/${ids.assignmentGrade}`);
  await expect(page.getByRole('heading', { name: 'Thiết kế REST Endpoint' })).toBeVisible();
  await expect(page.getByLabel('8 trên 10 điểm')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nhận xét của giảng viên' })).toBeVisible();
});

test('Student sees only returned Grades and mixed Course activities', async ({ page }) => {
  await login(page, 'student.active@example.test');
  await page.goto('/student/grades');
  await expect(page.getByRole('heading', { name: 'Điểm và nhận xét' })).toBeVisible();
  await expect(page.getByText('HTTP Status Code Check')).toBeVisible();
  await expect(page.getByText('Thiết kế REST Endpoint')).toBeVisible();
  await expect(page.getByText('8/10')).toBeVisible();
  await expect(page.getByText('Review thiết kế API an toàn')).toBeVisible();

  await page.goto(`/student/courses/${ids.course}`);
  await expect(page.getByRole('heading', { name: 'RESTful API Microlearning' })).toBeVisible();
  await expect(page.getByText('HTTP Status Code Check')).toBeVisible();
  await expect(page.getByText('Docker và Cloud Run')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page, 'Phase 05 Student Course');
  await expectNoSeriousAccessibilityViolations(page, 'Phase 05 Student Course');
});

test('Teacher opens the existing per-Student deadline exception and its history context', async ({
  page,
}) => {
  await login(page, 'teacher.active@example.test');
  await page.goto(`/teacher/activities/assignments/${ids.assignmentExtended}/deadline-exceptions`);
  await expect(page.getByRole('heading', { name: 'Docker và Cloud Run' })).toBeVisible();
  const studentButton = page.getByRole('button', { name: /Demo Student Active/u });
  await expect(studentButton).toBeVisible();
  await studentButton.click();
  await expect(page.getByText('Đang áp dụng')).toBeVisible();
  await expect(page.getByText('Revision')).toBeVisible();
});

test('Student deep links cannot open Teacher-owned assessment routes', async ({ page }) => {
  await login(page, 'student.active@example.test');
  await page.goto(`/teacher/quizzes/${ids.quizReview}/results`);
  await expect(page).toHaveURL(/\/forbidden$/u);
  await expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible();
});

test('Student To-do and Deadline views include mixed activities and personal extension', async ({
  page,
}) => {
  await login(page, 'student.active@example.test');
  await page.goto('/student/todo');
  await expect(page.getByRole('heading', { name: 'Việc cần làm' })).toBeVisible();
  await expect(page.getByText('Docker và Cloud Run')).toBeVisible();
  await expect(page.getByText(/Đã gia hạn/u)).toBeVisible();

  await page.goto('/student/deadlines');
  await expect(page.getByRole('heading', { name: 'Deadline học tập' })).toBeVisible();
  await expect(page.getByText('Docker và Cloud Run')).toBeVisible();
  await expect(page.getByText(/Đã gia hạn/u)).toBeVisible();
});

test('Admin governance exposes assessment counts only and remains responsive', async ({ page }) => {
  await login(page, 'admin.active@example.test');
  await page.goto(`/admin/courses/${ids.course}`);
  await expect(page.getByRole('heading', { name: 'RESTful API Microlearning' })).toBeVisible();
  const metrics = page.locator('.governance-metrics');
  await expect(metrics).toContainText('3Bài kiểm tra');
  await expect(metrics).toContainText('3Bài tập');
  await expect(page.getByText(/chỉ hiển thị metadata/u)).toBeVisible();
  await expect(page.getByText('Idempotency giúp API an toàn khi retry như thế nào?')).toHaveCount(
    0,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page, 'Phase 05 Admin governance');
  await expectNoSeriousAccessibilityViolations(page, 'Phase 05 Admin governance');
  await page.keyboard.press('Tab');
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.tagName ?? ''))
    .toMatch(/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/u);
});
