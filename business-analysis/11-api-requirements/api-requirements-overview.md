# API Requirements Overview

## Mục Đích

Tài liệu này là trang tổng quan cho mục **11 - API Requirements** của dự án **Microlearning Classroom LMS Platform**. Mục tiêu là xác định rõ RESTful API cần có để ReactJS frontend, Node.js/ExpressJS backend, MongoDB data model, Swagger/OpenAPI documentation, QA test và DevOps deployment phối hợp nhất quán.

API trong dự án không chỉ là danh sách endpoint, mà là **contract** giữa Frontend, Backend, QA và DevOps. Mỗi API cần rõ:

- Endpoint path và HTTP method.
- Actor/role được phép gọi.
- Request parameters, query, body.
- Response schema.
- Error response.
- Pagination/filter/sort nếu là list API.
- Authorization rule và object-level access.
- Audit log nếu là hành động nhạy cảm.
- Swagger/OpenAPI coverage.

## Phạm Vi Mục 11

| File | Nội dung |
| --- | --- |
| api-requirements-overview.md | Tổng quan API requirements và nguyên tắc thiết kế |
| api-overview.md | Chuẩn RESTful API, naming, response, status code |
| api-endpoint-catalog.md | Danh mục endpoint theo domain |
| api-versioning-authentication.md | Versioning, authentication, authorization |
| api-authorization-matrix.md | API permission matrix theo role |
| api-pagination-filtering.md | Pagination, filtering, sorting, search |
| api-request-response-schemas.md | Schema response/request quan trọng |
| error-response-standard.md | Chuẩn error response và error codes |
| swagger-openapi-requirements.md | Yêu cầu Swagger/OpenAPI |
| teacher-invitation-api.md | API riêng cho Teacher invitation manual copy link |
| api-health-devops.md | Health check, DevOps, deployment support APIs |
| google-classroom-reference-api-catalog.md | API tham khảo theo workflow Google Classroom, không tích hợp Google API |

## API Goals

| Goal | Mô tả |
| --- | --- |
| Support role-based web app | API phục vụ Student, Teacher, Admin và Super Admin |
| Clear frontend contract | ReactJS biết request/response cụ thể |
| Secure by default | Auth, RBAC và object-level access ở backend |
| Testable | QA có thể viết API test/UAT từ tài liệu |
| Swagger-ready | API có thể document bằng OpenAPI rõ ràng |
| DevOps-ready | Có health check, environment config và deployment verification |
| Scalable enough for MVP | List API có pagination/filter/sort server-side |

## Base API Path

```text
/api/v1
```

Ví dụ:

```text
POST /api/v1/auth/login
GET  /api/v1/students/me/todo
GET  /api/v1/teacher/courses/{courseId}/dashboard
GET  /api/v1/admin/users/students
```

## API Consumer Groups

| Consumer | API cần dùng |
| --- | --- |
| ReactJS Student UI | Auth, join Classroom, dashboard, To-do, lesson, quiz, assignment, progress, grade |
| ReactJS Teacher UI | Classroom, Course Dashboard, content builder, quiz builder, assignment, roster, progress, grading |
| ReactJS Admin UI | User lists, invitation, role/permission, policy, governance, reports, audit |
| QA | Swagger, test endpoints, error response, validation cases |
| DevOps | Health check, deployment verification, logs/monitoring endpoints |

## API Domain Groups

| Domain | Prefix gợi ý |
| --- | --- |
| Authentication | `/auth` |
| Current User/Profile | `/users/me` |
| Student APIs | `/students/me` |
| Teacher APIs | `/teacher` |
| Admin APIs | `/admin` |
| Classroom APIs | `/classrooms` |
| Course APIs | `/courses` |
| Lesson APIs | `/lessons` |
| Quiz APIs | `/quizzes`, `/questions` |
| Assignment APIs | `/assignments`, `/submissions` |
| Progress APIs | `/progress` |
| Resource/Upload APIs | `/resources`, `/uploads` |
| Notification APIs | `/notifications` |
| Reports APIs | `/reports` hoặc `/admin/reports` |
| Audit APIs | `/admin/audit-logs` |
| DevOps APIs | `/health`, `/api/v1/system/health` |

## API Design Decisions

| Quyết định | Lý do |
| --- | --- |
| Dùng RESTful API thay vì GraphQL trong MVP | Dễ học, dễ document bằng Swagger, phù hợp đồ án |
| Dùng JSON request/response | Chuẩn web app phổ biến |
| Dùng `/api/v1` | Có versioning để mở rộng sau |
| Tách Admin Student/Teacher/Admin List endpoints | Tránh tải tất cả users rồi filter ở frontend |
| Teacher Course Dashboard có endpoint riêng | Màn hình cần data tổng hợp nhiều nguồn |
| Student To-do có endpoint riêng | Dashboard cần tổng hợp Lesson/Quiz/Assignment chưa hoàn thành |
| Upload/media chỉ lưu metadata/URL | Không lưu binary trực tiếp trong MongoDB |
| API phải kiểm quyền ở backend | Frontend ẩn nút không đủ an toàn |
| Swagger là deliverable bắt buộc | Giúp Frontend/Backend/QA làm cùng contract |

## API Quality Requirements

| Nhóm | Yêu cầu |
| --- | --- |
| Consistency | Response format, error format và pagination thống nhất |
| Security | Protected endpoints yêu cầu token và role/permission phù hợp |
| Validation | Backend validate input theo data validation rules |
| Performance | List endpoints có pagination/filter/sort server-side |
| Observability | API lỗi quan trọng có log; health check phục vụ DevOps |
| Documentation | Swagger/OpenAPI cập nhật khi endpoint thay đổi |
| Auditability | Admin action quan trọng ghi AuditLog |
| Privacy | Không expose passwordHash, tokenHash, raw token, secrets |

## API Definition Of Done

Một API được xem là hoàn thành khi:

- Endpoint path/method đúng catalog.
- Request body/query/path params được validate.
- Auth/authorization được kiểm tra.
- Response success/error đúng chuẩn.
- Swagger/OpenAPI có schema và example.
- Có test case happy path, validation error, unauthorized, forbidden.
- Có audit log nếu là action nhạy cảm.
- Không expose dữ liệu nhạy cảm.

## Out Of Scope Cho API MVP

| API | Lý do |
| --- | --- |
| Google Classroom API integration | Chỉ tham khảo workflow, không tích hợp |
| Payment API | Không thuộc LMS nội bộ |
| Native mobile push API nâng cao | MVP là web app |
| AI grading API nâng cao | Để Post-MVP |
| Live video meeting provider API | Có thể dùng external link thủ công sau |
