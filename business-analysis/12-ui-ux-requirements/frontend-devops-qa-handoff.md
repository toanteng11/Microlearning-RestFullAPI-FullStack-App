# Frontend DevOps And QA Handoff

## Mục Đích

Tài liệu này mô tả các yêu cầu cần bàn giao cho DevOps và QA khi triển khai ReactJS frontend lên Cloud. Mục tiêu là để việc build, deploy, verify và rollback frontend rõ ràng, không chỉ dừng ở mức chạy được trên máy local.

## Environment Variables

Frontend không được hard-code API URL hoặc environment name trong source code. Các giá trị nên được truyền qua environment variable của build/deployment.

| Biến môi trường đề xuất | Mục đích | Ví dụ |
| --- | --- | --- |
| `VITE_API_BASE_URL` hoặc `REACT_APP_API_BASE_URL` | Base URL gọi Backend API | `https://api.microlearning.app` |
| `VITE_APP_ENV` hoặc `REACT_APP_ENV` | Tên môi trường | `development`, `staging`, `production` |
| `VITE_APP_VERSION` hoặc `REACT_APP_VERSION` | Version frontend build | `1.0.0` |
| `VITE_COMMIT_SHA` hoặc `REACT_APP_COMMIT_SHA` | Commit được build | `abc1234` |
| `VITE_ENABLE_MOCKS` hoặc `REACT_APP_ENABLE_MOCKS` | Bật mock API ở local/dev nếu cần | `false` ở staging/production |

Ghi chú:

- Nếu dùng Vite thì ưu tiên prefix `VITE_`.
- Nếu dùng Create React App thì dùng prefix `REACT_APP_`.
- Production không được bật mock data.

## Build Requirements

| Requirement ID | Nội dung |
| --- | --- |
| FE-DEVOPS-001 | CI phải chạy install, lint, test nếu có, build production. |
| FE-DEVOPS-002 | Build artifact phải trace được với commit SHA. |
| FE-DEVOPS-003 | API base URL phải được cấu hình theo environment, không sửa code để đổi môi trường. |
| FE-DEVOPS-004 | Source map production phải theo policy bảo mật của dự án. |
| FE-DEVOPS-005 | Static assets phải được cache hợp lý; `index.html` không cache quá lâu để nhận version mới. |
| FE-DEVOPS-006 | Build fail nếu thiếu environment variable bắt buộc. |

## SPA Routing Deployment Requirements

Vì ReactJS là SPA, Cloud/static hosting phải cấu hình fallback route:

```text
Mọi route không phải static asset -> trả về index.html
```

Các route cần test bằng cách refresh trực tiếp:

- `/login`
- `/student/dashboard`
- `/student/classrooms`
- `/teacher/dashboard`
- `/teacher/courses/demo/dashboard`
- `/admin/dashboard`
- `/admin/users/students`
- `/teacher/invite?token=test`
- `/join/invite/test`

Nếu refresh các route này bị 404 từ web server, deployment chưa đạt.

## API Connectivity Verification

Sau deployment, QA/DevOps cần kiểm tra:

| Check | Cách kiểm tra | Kết quả mong đợi |
| --- | --- | --- |
| Frontend public URL | Mở Cloud URL | Login page render đúng. |
| API base URL | Kiểm tra network request | Request đi đến đúng Backend environment. |
| Health endpoint | Gọi `GET /health` | API trả trạng thái healthy hoặc degraded có kiểm soát. |
| Version endpoint | Gọi `GET /api/v1/system/version` nếu có quyền | Version/commit/environment đúng. |
| CORS | Login hoặc gọi public preview invitation | Không bị CORS error. |
| HTTPS | Mở frontend và API URL | Không có mixed content HTTP trong production. |

## Smoke Test Sau Deployment

### Public/Auth Smoke Test

| Test ID | Bước kiểm tra | Kết quả mong đợi |
| --- | --- | --- |
| SMK-FE-001 | Mở `/login` | Login page render, không lỗi console nghiêm trọng. |
| SMK-FE-002 | Login sai password | Hiển thị lỗi rõ ràng, không crash. |
| SMK-FE-003 | Login Student test account | Redirect `/student/dashboard`. |
| SMK-FE-004 | Login Teacher test account | Redirect `/teacher/dashboard`. |
| SMK-FE-005 | Login Admin test account | Redirect `/admin/dashboard`. |

### Student Smoke Test

| Test ID | Bước kiểm tra | Kết quả mong đợi |
| --- | --- | --- |
| SMK-FE-006 | Mở Student Dashboard | To-do, Classroom, Progress summary tải được hoặc empty state đúng. |
| SMK-FE-007 | Join bằng Class Code test | Join thành công hoặc message nghiệp vụ đúng. |
| SMK-FE-008 | Mở Lesson test | Lesson Player render, Back/Next hoạt động. |
| SMK-FE-009 | Submit Quiz test nếu có data | Submit thành công hoặc validation đúng. |

### Teacher Smoke Test

| Test ID | Bước kiểm tra | Kết quả mong đợi |
| --- | --- | --- |
| SMK-FE-010 | Mở Teacher Dashboard | Classroom/Course list tải được hoặc empty state đúng. |
| SMK-FE-011 | Tạo Classroom test | Classroom tạo thành công và redirect đúng. |
| SMK-FE-012 | Mở Course Detail Dashboard | Activities và Student Progress Ranking render đúng. |
| SMK-FE-013 | Mở Quiz Builder | Có thể thấy question list/editor và media section nếu có. |

### Admin Smoke Test

| Test ID | Bước kiểm tra | Kết quả mong đợi |
| --- | --- | --- |
| SMK-FE-014 | Mở Admin Dashboard | Metrics/system status tải được hoặc partial state đúng. |
| SMK-FE-015 | Mở Student List | Gọi đúng `/api/v1/admin/users/students`. |
| SMK-FE-016 | Mở Teacher List | Gọi đúng `/api/v1/admin/users/teachers`. |
| SMK-FE-017 | Mở Admin List | Gọi đúng `/api/v1/admin/users/admins` và guard đúng quyền. |
| SMK-FE-018 | Tạo Teacher Invitation | Link được tạo và copy thủ công được. |

## QA Matrix Cho UI State

QA cần test ít nhất các state sau cho mỗi màn hình P0:

| State | Cách test |
| --- | --- |
| Loading | Giả lập network chậm hoặc dùng test API delay. |
| Empty | Dùng account chưa có dữ liệu. |
| Error | Mock 500 hoặc tắt API ở môi trường test. |
| Forbidden | Dùng role không có quyền mở route. |
| Not Found | Mở route với id không tồn tại. |
| Validation | Submit form thiếu field hoặc sai format. |
| Success | Thực hiện mutation hợp lệ. |
| Unsaved Changes | Nhập editor/form rồi bấm Back/Cancel. |

## Monitoring Và Debug Gợi Ý

Frontend nên hỗ trợ các thông tin sau ở staging/internal:

- App version.
- Commit SHA.
- Environment name.
- API base URL đang dùng.
- Thời điểm build nếu có.

Không hiển thị secrets, token hoặc thông tin nhạy cảm.

## Rollback Notes

- DevOps cần lưu lại version frontend artifact đã deploy.
- Rollback frontend phải tương thích với Backend API version đang chạy.
- Nếu Backend đã migrate API breaking change, rollback frontend cần kiểm tra lại Swagger/API contract.
- Sau rollback vẫn phải chạy smoke test tối thiểu: Login, Student Dashboard, Teacher Dashboard, Admin Dashboard.

## Acceptance Criteria

- Frontend build được trong CI với environment variable rõ ràng.
- Cloud deployment không bị 404 khi refresh SPA route.
- Frontend gọi đúng Backend API theo môi trường.
- P0 smoke test cho Student, Teacher, Admin đạt.
- DevOps có thể xác định version/commit của frontend đang chạy.
- QA có checklist để test loading, empty, error, forbidden và success state.
