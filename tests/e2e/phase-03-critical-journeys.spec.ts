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
const classroomName = `Phase 03 Classroom ${runId}`;
let classCode = '';
let inviteLink = '';
let teacherClassroomPath = '';
let studentClassroomPath = '';
const courseName = `Phase 04 REST API ${runId}`;
const moduleName = `HTTP Foundations ${runId}`;
const lessonName = `Designing REST Resources ${runId}`;
let teacherCoursePath = '';

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page, label: string) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth, `${label} horizontal overflow`).toBeLessThanOrEqual(
    dimensions.clientWidth + 1,
  );
}

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
  await expect(page.getByRole('heading', { name: 'Xin chào, E2E Student' })).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'Xin chào, E2E Student Updated' })).toBeVisible();
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
    await expect(
      teacherPage.getByRole('heading', { name: 'Lớp học của E2E Teacher' }),
    ).toBeVisible();
  } finally {
    await teacherContext.close();
  }

  await page.goto(`/admin/users/teachers?keyword=${encodeURIComponent(teacherEmail)}`);
  await expect(page.getByRole('table').getByText(teacherEmail)).toBeVisible();
});

test('Teacher creates a Classroom and receives one-time Code and Invite Link values', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(teacherEmail);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: 'Lớp học của E2E Teacher' })).toBeVisible();

  await page.getByRole('button', { name: 'Tạo lớp học', exact: true }).click();
  const createForm = page.locator('form.classroom-form');
  await createForm.getByLabel('Tên lớp học').fill(classroomName);
  await createForm.getByLabel('Môn học').fill('Backend Engineering');
  await createForm.getByLabel('Nhóm').fill('P03-E2E');
  await createForm.getByRole('button', { name: 'Tạo lớp học' }).click();

  const initialCredential = page.locator('.one-time-credential code');
  await expect(initialCredential).toBeVisible();
  classCode = (await initialCredential.textContent())?.trim() ?? '';
  expect(classCode).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/u);
  await page.getByRole('article').filter({ hasText: classroomName }).getByRole('link').click();
  await expect(page.getByRole('heading', { name: classroomName })).toBeVisible();
  teacherClassroomPath = new URL(page.url()).pathname;
  studentClassroomPath = teacherClassroomPath.replace('/teacher/', '/student/');

  await page.getByRole('button', { name: /Quyền tham gia/u }).click();
  await page.getByRole('button', { name: 'Tạo link' }).click();
  const inviteCredential = page.locator('.one-time-credential code');
  await expect(inviteCredential).toContainText('/join/invite#token=');
  inviteLink = (await inviteCredential.textContent())?.trim() ?? '';
  expect(inviteLink).toContain('/join/invite#token=');

  const persistentStorage = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
  }));
  expect(JSON.stringify(persistentStorage)).not.toContain(classCode);
  expect(JSON.stringify(persistentStorage)).not.toContain(inviteLink);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page, 'Teacher Classroom settings');
});

test('Student joins by Class Code idempotently and opens the enrolled Classroom', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(studentEmail);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  const joinForm = page.locator('form.join-code-form');
  await joinForm.getByLabel('Class Code').fill(classCode);
  await joinForm.getByRole('button', { name: 'Tham gia' }).click();
  await expect(page.getByText(`Đã tham gia ${classroomName}.`)).toBeVisible();
  await expect(page.getByRole('article').filter({ hasText: classroomName })).toBeVisible();

  await joinForm.getByLabel('Class Code').fill(classCode);
  await joinForm.getByRole('button', { name: 'Tham gia' }).click();
  await expect(page.getByText(`Bạn đã tham gia ${classroomName}.`)).toBeVisible();
  await page.getByRole('article').filter({ hasText: classroomName }).getByRole('link').click();
  await expect(page.getByRole('heading', { name: classroomName })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page, 'Student Classroom detail');
});

test('Guest Invite Link removes the token from URL and resumes after Student login', async ({
  page,
}) => {
  await page.goto(inviteLink);
  await expect(page).toHaveURL(/\/join\/invite$/u);
  await expect(page.getByRole('heading', { name: classroomName })).toBeVisible();
  await page.getByRole('link', { name: 'Đăng nhập' }).click();
  await page.getByLabel('Email').fill('student.active.2@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: classroomName })).toBeVisible();
  await page.getByRole('button', { name: 'Tham gia lớp học' }).click();
  await expect(page.getByRole('heading', { name: classroomName })).toBeVisible();

  const browserState = await page.evaluate(() => ({
    url: window.location.href,
    local: JSON.stringify(localStorage),
    session: JSON.stringify(sessionStorage),
  }));
  expect(browserState.url).not.toContain('token=');
  expect(`${browserState.local}${browserState.session}`).not.toContain('token');
});

test('Phase 04 Teacher authors and publishes a Course, Module, Lesson and Flashcard', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(teacherEmail);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: 'Lớp học của E2E Teacher' })).toBeVisible();
  await page.goto(teacherClassroomPath);
  await page.getByRole('button', { name: /Nội dung học/u }).click();
  await page.getByRole('link', { name: /Tạo khóa học/u }).click();
  await page.getByLabel('Tên khóa học').fill(courseName);
  await page.getByLabel('Mô tả').fill('Nội dung Microlearning về thiết kế RESTful API.');
  await page.getByRole('button', { name: 'Tạo khóa học', exact: true }).click();
  await expect(page.getByRole('heading', { name: courseName })).toBeVisible();
  teacherCoursePath = new URL(page.url()).pathname;

  await page.getByRole('link', { name: /Quản lý nội dung/u }).click();
  await page.getByLabel('Tên Module').fill(moduleName);
  await page.getByLabel('Mô tả Module').fill('HTTP semantics and resource modeling');
  await page.getByRole('button', { name: /Thêm Module/u }).click();
  await expect(page.getByRole('heading', { name: moduleName })).toBeVisible();
  await page.getByRole('button', { name: `Xuất bản ${moduleName}` }).click();
  await expect(page.getByText('Đã xuất bản Module.')).toBeVisible();

  await page.getByRole('link', { name: /Tạo bài học/u }).click();
  await page.getByLabel('Tên bài học').fill(lessonName);
  await page.getByLabel('Module').selectOption({ label: moduleName });
  await page.getByLabel('Thời lượng dự kiến').fill('12');
  const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000).toISOString().slice(0, 16);
  await page.getByLabel(/Deadline theo múi giờ/u).fill(futureDeadline);
  await page.getByLabel('Bài học bắt buộc').check();
  await page
    .getByLabel('Nội dung', { exact: true })
    .fill('# REST Resources\n\nUse nouns and predictable HTTP semantics.');
  await page.getByRole('button', { name: /Tạo bài học/u }).click();
  await expect(page.getByRole('heading', { name: lessonName })).toBeVisible();

  await page.getByLabel('Mặt trước').fill('Which HTTP verb updates part of a resource?');
  await page.getByLabel('Mặt sau').fill('PATCH');
  await page.getByRole('button', { name: /Thêm Flashcard/u }).click();
  await expect(page.getByText('Đã thêm Flashcard.')).toBeVisible();
  await page.getByLabel('Mặt trước').fill('Which HTTP status confirms resource creation?');
  await page.getByLabel('Mặt sau').fill('201 Created');
  await page.getByRole('button', { name: /Thêm Flashcard/u }).click();
  await page.getByRole('button', { name: 'Di chuyển Flashcard 2 lên' }).click();
  await expect(page.getByText('Đã cập nhật thứ tự Flashcard.')).toBeVisible();
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.getByRole('heading', { name: 'REST Resources' })).toBeVisible();
  await page.getByRole('button', { name: /Chỉnh sửa/u }).click();
  await page.getByRole('button', { name: 'Xuất bản', exact: true }).click();
  await expect(page.getByText('Đã xuất bản bài học.')).toBeVisible();

  await page.goto(teacherCoursePath);
  await page.getByRole('button', { name: 'Xuất bản', exact: true }).click();
  await expect(page.getByText('Đã xuất bản khóa học.')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page, 'Teacher Phase 04 Course Dashboard');
});

test('Phase 04 Announcement lifecycle reaches enrolled Student Stream', async ({
  page,
  browser,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(teacherEmail);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: 'Lớp học của E2E Teacher' })).toBeVisible();
  await page.goto(teacherClassroomPath);
  await page.getByLabel('Thông báo mới').fill('Phase 04 published classroom update');
  await page.getByRole('button', { name: /Tạo bản nháp/u }).click();
  await expect(page.getByText('Đã tạo thông báo nháp.')).toBeVisible();
  await page.getByRole('button', { name: 'Xuất bản thông báo' }).first().click();
  await expect(page.getByText('Đã xuất bản thông báo.')).toBeVisible();

  const studentContext = await browser.newContext({ baseURL: webUrl });
  const studentPage = await studentContext.newPage();
  try {
    await studentPage.goto('/login');
    await studentPage.getByLabel('Email').fill('student.active.2@example.test');
    await studentPage.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
    await studentPage.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(
      studentPage.getByRole('heading', { name: 'Xin chào, Demo Student Active Two' }),
    ).toBeVisible();
    await studentPage.goto(studentClassroomPath);
    await expect(studentPage.getByText('Phase 04 published classroom update')).toBeVisible();
  } finally {
    await studentContext.close();
  }
});

test('Phase 04 Student sees To-do, studies Flashcard and completes Lesson', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('student.active.2@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(
    page.getByRole('heading', { name: 'Xin chào, Demo Student Active Two' }),
  ).toBeVisible();
  await page.getByRole('link', { name: /Việc cần làm/u }).click();
  await expect(page.getByRole('link', { name: lessonName })).toBeVisible();
  await page.getByRole('link', { name: lessonName }).click();
  await expect(page.getByRole('heading', { name: lessonName })).toBeVisible();
  await expect(page.getByText('Which HTTP status confirms resource creation?')).toBeVisible();
  await page.locator('.flashcard-viewer').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('201 Created')).toBeVisible();
  await page.getByRole('button', { name: 'Thẻ sau' }).click();
  await expect(page.getByText('Which HTTP verb updates part of a resource?')).toBeVisible();
  await page.locator('.flashcard-viewer').focus();
  await page.keyboard.press('Space');
  await expect(page.getByText('PATCH')).toBeVisible();
  await page.getByRole('button', { name: /Bắt đầu/u }).click();
  await expect(page.getByText('Đã bắt đầu bài học.')).toBeVisible();
  await page.getByRole('button', { name: 'Hoàn thành' }).click();
  await expect(page.getByText('Đã hoàn thành bài học.')).toBeVisible();
  await page.getByRole('link', { name: /Việc cần làm/u }).click();
  await expect(page.getByRole('link', { name: lessonName })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page, 'Student Phase 04 Lesson Player and To-do');
});

test('Phase 04 Teacher Dashboard reports Student completion deterministically', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(teacherEmail);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: 'Lớp học của E2E Teacher' })).toBeVisible();
  await page.goto(teacherCoursePath);
  await expect(page.getByText('P04_LESSON_COMPLETION_V1')).toBeVisible();
  await expect(page.getByText('Demo Student Active Two')).toBeVisible();
  await expect(page.getByText('100%')).toBeVisible();
  await expect(page.getByRole('link', { name: /Quản lý nội dung/u })).toBeVisible();
});

test('Phase 04 Admin governance exposes metadata without lesson content', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin.active@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible();
  await page.goto('/admin/courses');
  const courseRow = page.getByRole('row').filter({ hasText: courseName });
  await expect(courseRow).toBeVisible();
  await courseRow.getByRole('link', { name: 'Xem' }).click();
  await expect(page.getByRole('heading', { name: courseName })).toBeVisible();
  await expect(page.getByText('1', { exact: true })).toHaveCount(2);
  await expect(page.getByText('REST Resources')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page, 'Admin Phase 04 Course governance');
});

test('Teacher sees roster, removes Student, and the removed Student loses access', async ({
  page,
  browser,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(teacherEmail);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: 'Lớp học của E2E Teacher' })).toBeVisible();
  await page.goto(teacherClassroomPath);
  await page.getByRole('button', { name: /Thành viên/u }).click();
  await expect(page.getByText('E2E Student Updated')).toBeVisible();
  await page.getByRole('button', { name: 'Remove E2E Student Updated' }).click();
  await page.getByLabel('Lý do').fill('E2E roster removal verification');
  await page.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(page.getByText('Đã remove Student khỏi lớp học.')).toBeVisible();
  await expect(page.getByText('E2E Student Updated')).toBeHidden();

  const studentContext = await browser.newContext({ baseURL: webUrl });
  const studentPage = await studentContext.newPage();
  try {
    await studentPage.goto('/login');
    await studentPage.getByLabel('Email').fill(studentEmail);
    await studentPage.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
    await studentPage.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(
      studentPage.getByRole('heading', { name: 'Xin chào, E2E Student Updated' }),
    ).toBeVisible();
    await studentPage.goto(studentClassroomPath);
    await expect(studentPage.getByRole('heading', { name: classroomName })).toHaveCount(0);
    await expect(studentPage.locator('.list-state--error')).toBeVisible();
  } finally {
    await studentContext.close();
  }
});

test('Admin updates Enrollment Policy and direct cross-role routes are denied', async ({
  page,
  browser,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin.active@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible();
  await page.goto('/admin/settings/enrollment-policy');
  await expect(page.getByRole('heading', { name: 'Enrollment Policy' })).toBeVisible();
  const revisionRow = page.getByText('Revision').locator('..');
  const initialRevision = Number((await revisionRow.locator('dd').textContent())?.trim());
  expect(initialRevision).toBeGreaterThan(0);
  const codePolicy = page.getByLabel('Cho phép Class Code toàn hệ thống');
  await codePolicy.uncheck();
  await page.getByLabel('Lý do thay đổi').fill('E2E disable Class Code policy');
  await page.getByRole('button', { name: 'Lưu policy' }).click();
  await expect(page.getByText('Đã cập nhật Enrollment Policy.')).toBeVisible();
  await codePolicy.check();
  await page.getByLabel('Lý do thay đổi').fill('E2E restore Class Code policy');
  await page.getByRole('button', { name: 'Lưu policy' }).click();
  await expect(revisionRow).toContainText(String(initialRevision + 2));
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page, 'Admin Enrollment Policy');

  const studentContext = await browser.newContext({ baseURL: webUrl });
  const studentPage = await studentContext.newPage();
  try {
    await studentPage.goto('/login');
    await studentPage.getByLabel('Email').fill('student.active.3@example.test');
    await studentPage.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
    await studentPage.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(
      studentPage.getByRole('heading', { name: 'Xin chào, Demo Student Active Three' }),
    ).toBeVisible();
    await studentPage.goto('/teacher/dashboard');
    await expect(
      studentPage.getByRole('heading', { name: 'Không có quyền truy cập' }),
    ).toBeVisible();
    await studentContext.clearCookies();
    await studentPage.goto('/login');
    await studentPage.getByLabel('Email').fill('student.active.3@example.test');
    await studentPage.getByLabel('Mật khẩu', { exact: true }).fill(demoPassword);
    await studentPage.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(
      studentPage.getByRole('heading', { name: 'Xin chào, Demo Student Active Three' }),
    ).toBeVisible();
    await studentPage.goto('/admin/classrooms');
    await expect(
      studentPage.getByRole('heading', { name: 'Không có quyền truy cập' }),
    ).toBeVisible();
  } finally {
    await studentContext.close();
  }
});
