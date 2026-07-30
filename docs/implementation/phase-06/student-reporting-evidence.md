# Phase 06 Student Reporting Evidence

## 1. Phạm Vi

Tài liệu này ghi nhận bằng chứng triển khai `Part 07 - Student Reporting API` và
`Part 08 - Student Reporting Web` trên branch `feature/phase-06-student-reporting`.

Branch hiện được phát triển theo mô hình stacked branch từ foundation commit `1afe813`. Trước khi
tạo hoặc merge `P06-PR03`, phải merge `P06-PR02` vào `main`, đồng bộ branch này với `main` và chạy
lại toàn bộ quality gate.

| Thuộc tính | Giá trị |
| --- | --- |
| Source branch | `feature/phase-06-student-reporting` |
| Foundation commit | `1afe813` |
| Student reporting commit | `f560233` |
| Remote PR/CI | Pending P06-PR02 merge và branch synchronization |

## 2. API Đã Triển Khai

| Endpoint | Kết quả |
| --- | --- |
| `GET /api/v1/students/me/dashboard` | Tổng hợp To-do V2, Course progress và Grade đã trả |
| `GET /api/v1/students/me/progress` | Chi tiết progress của chính Student theo `courseId` |
| `GET /api/v1/students/me/progress/courses` | Danh sách Course có filter, stable sort và pagination |

Kiểm soát đã có:

- chỉ lấy Student ID từ authenticated actor;
- RBAC `learning.view_enrolled`;
- Course ngoài active Enrollment trả non-enumerating `404`;
- response private có `Cache-Control: private, no-store`;
- Grade preview chỉ đọc `RETURNED`, không trả draft Grade hoặc private feedback;
- moved route `/students/me/progress` chỉ còn một runtime owner và một OpenAPI operation;
- `REPORTING_ENABLED=false` trả controlled `503 FEATURE_DISABLED`;
- due-soon window được cấu hình bằng `REPORTING_DUE_SOON_WINDOW_HOURS`, mặc định `72`.

## 3. Web Đã Triển Khai

- `/student/dashboard` hiển thị reporting summary, To-do preview, Course progress và returned Grade.
- Join bằng Class Code và Classroom list là các vùng độc lập với reporting request.
- `/student/progress` hỗ trợ filter trạng thái, sort và pagination qua URL query.
- Có loading, empty, error, fresh, stale, partial, rebuilding và failed presentation.
- Metric không có denominator hiển thị `N/A`.
- React Query key chứa actor ID; `AuthProvider` xóa toàn bộ private query cache khi logout hoặc
  session không còn hợp lệ.
- App navigation có mục `Tiến độ`; bảng responsive giữ data label và progress có accessible text.

## 4. Test Đã Chạy

| Command | Kết quả local | Ghi chú |
| --- | --- | --- |
| `npm run typecheck` | Pass | API và Web |
| `npm run lint` | Pass | Toàn repository |
| `npm test --workspace @microlearning/api` | Pass | `31` files, `206/206` tests |
| `npm test --workspace @microlearning/web` | Pass | `18` files, `102/102` tests |
| OpenAPI parity | Pass | Ba Student reporting operations unique và protected |

Additional CI evidence:

- `npm run check:ci`: Pass, including lint, format, typecheck, `308/308` tests, coverage and
  production build.
- API coverage: statements `77.92%`, branches `61.30%`, functions `71.53%`, lines `80.03%`.
- Web coverage: statements `83.39%`, branches `71.58%`, functions `80.43%`, lines `86.73%`.

Focused coverage:

- `apps/api/tests/phase-six-student-reporting.test.ts`;
- `apps/api/tests/app.test.ts`;
- `apps/web/src/features/reporting/reporting.test.tsx`.

## 5. Test Đã Viết Nhưng Chưa Chạy

| Test | Trạng thái | Blocker |
| --- | --- | --- |
| `phase-six-student-reporting.integration.test.ts` | `BLOCKED_LOCAL_RUNTIME` | Docker Desktop daemon chưa chạy |
| `phase-06-student-reporting.spec.ts` | `BLOCKED_LOCAL_RUNTIME` | Cần integrated stack và demo seed |

Không được đổi hai test trên thành `Pass` cho đến khi có output thực tế từ MongoDB replica set và
Playwright. Sau khi Docker hoạt động, chạy:

```powershell
docker compose up -d --build
$env:MONGODB_INTEGRATION_URI='mongodb://127.0.0.1:27018/microlearning-ci?replicaSet=rs0&directConnection=true'
npm run test:integration --workspace @microlearning/api
$env:E2E_DEMO_PASSWORD='<same-password-used-by-seed>'
npm run seed:demo --workspace @microlearning/api
npm run test:e2e -- --grep "Student reviews dashboard reporting"
```

## 6. Trạng Thái Part

| Part | Trạng thái |
| --- | --- |
| Part 07 | `IN_REVIEW_STACKED`; implementation/unit/OpenAPI Pass, integration pending |
| Part 08 | `IN_REVIEW_STACKED`; component Pass, browser E2E/visual pending |
| P06-PR03 | Chưa sẵn sàng merge cho đến khi P06-PR02 merge, rebase và CI Pass |
