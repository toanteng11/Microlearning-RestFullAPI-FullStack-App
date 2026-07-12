# Swagger OpenAPI Requirements

## Mục Đích

Tài liệu này xác định yêu cầu tài liệu API bằng **Swagger/OpenAPI** cho hệ thống **Microlearning Classroom LMS Platform**. Swagger là contract chính giúp Frontend, Backend, QA và DevOps hiểu API giống nhau.

## Swagger Path

```text
/api-docs
```

OpenAPI JSON/YAML có thể ở:

```text
/api/v1/openapi.json
/api/v1/openapi.yaml
```

## Swagger UI Display Requirements

**Swagger UI** là giao diện web hiển thị tài liệu API; **OpenAPI specification** là contract nguồn mà Swagger UI đọc. Backend phải phục vụ cả hai từ cùng một definition để tránh tình trạng trang `/api-docs` mô tả khác với file OpenAPI hoặc API runtime.

| Method | Path | Mục đích | Requirement |
| --- | --- | --- | --- |
| GET | `/api-docs` hoặc `/api-docs/` | Hiển thị Swagger UI web page. | Load thành công HTML/CSS/JS cần thiết, có title/version/server/tags/operations/schemas. |
| GET | `/api/v1/openapi.json` | Trả OpenAPI JSON machine-readable. | Swagger UI, Frontend/QA/contract test đọc cùng contract; response không chứa secret/example nhạy cảm. |
| GET | `/api/v1/openapi.yaml` | Trả YAML nếu team chọn publish YAML. | Optional; nếu có thì phải tương đương JSON specification. |

### User Experience Trong Swagger UI

- Hiển thị API title, version release/build direction, description, server theo environment và tag theo domain.
- Cho phép Developer/QA mở operation, xem summary/description, params, request schema, response/error schema, enum và example đã redact.
- Protected operation hiển thị security scheme `bearerAuth` và nút `Authorize` để Developer/QA nhập **test access token của chính họ** trong Local/Development hoặc environment được phép.
- Không prefill, persist hoặc log Bearer token trong Swagger configuration, sample, screenshot hay repository. `persistAuthorization` phải mặc định tắt trừ khi Security Reviewer phê duyệt policy khác.
- Swagger UI là technical tool; không cần xuất hiện trong Student/Teacher/Admin navigation và không thay thế ReactJS application UI.

### Exposure Policy Theo Environment

| Environment | Swagger UI / spec policy | `Try it out` policy |
| --- | --- | --- |
| Local / Development | Enabled cho Developer/QA với synthetic data. | Allowed với test account/token do người dùng tự cấp. |
| CI | Contract/spec validation bắt buộc; UI rendering test nếu pipeline hỗ trợ. | Không dùng credential thật; chỉ contract/mock/safe integration test. |
| Staging / UAT | Available cho authorized Developer/QA/DevOps và UAT support theo access policy. | Allowed với test account/data; destructive operation phải tuân test/reset policy. |
| Cloud Demo / Production-like | Default restricted; public exposure chỉ khi Product Owner, Technical Lead và Security/DevOps chấp nhận policy. | Default disabled hoặc limited theo authorized policy; không chạy mutation bằng Production credential trong public docs. |

Quyết định public/restricted exposure cuối cùng theo `APP-Q-003` và `ARC-030`. Cho đến khi có decision, không public Swagger UI/JSON trên Cloud Demo/Production-like environment.

## Required OpenAPI Metadata

| Field | Giá trị gợi ý |
| --- | --- |
| title | Microlearning Classroom LMS API |
| version | 1.0.0 hoặc version release |
| description | RESTful API cho Microlearning Classroom LMS Platform |
| server local | `http://localhost:{PORT}/api/v1` |
| server staging/demo | Cloud URL theo environment |
| license | Theo dự án nếu có |

## Required Tags

| Tag | Mô tả |
| --- | --- |
| Auth | Login, register, refresh, logout, reset password |
| Current User | Profile/current user |
| Teacher Invitation | Manual copy invitation flow |
| Classroom | Classroom CRUD/settings/roster |
| Classroom Join | Join by Class Code/Invite Link |
| Student Dashboard | Dashboard, To-do, Progress, Grades |
| Course | Course CRUD/status |
| Teacher Course Dashboard | Course detail dashboard, activities, progress ranking |
| Lesson | Lesson, completion, deadline, deadline reset reason |
| Flashcard | Flashcard management/learning |
| Resource | Learning resources and uploads |
| Announcement | Class Stream announcements |
| Quiz | Quiz, questions, media, attempts |
| Assignment | Assignment, submissions, grading, feedback |
| Admin Users | Student List, Teacher List, Admin List |
| Admin Policies | Enrollment/File/Notification/System settings |
| Admin Governance | Classroom governance, ownership transfer, offboarding |
| Reports | Usage/progress reports |
| Audit Logs | Audit log listing/export |
| System | Health/version |

## Security Schemes

Swagger phải mô tả JWT Bearer auth:

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

Protected endpoints cần có:

```yaml
security:
  - bearerAuth: []
```

## Schema Requirements

Swagger phải có schema cho:

- Standard success response.
- Standard list response with pagination.
- Standard error response.
- Auth request/response.
- User summary.
- Student dashboard response.
- Student To-do item.
- Classroom.
- Course.
- Lesson.
- Quiz.
- Question.
- QuestionMedia.
- Assignment.
- Submission.
- Grade.
- Feedback.
- Teacher Course Dashboard.
- CourseProgressRow.
- Admin StudentListItem.
- Admin TeacherListItem.
- Admin AdminListItem.
- TeacherInvitation.
- AuditLog.
- System health response.

## Required Endpoint Documentation

Mỗi endpoint trong Swagger phải có:

| Thành phần | Required |
| --- | --- |
| Summary | Có |
| Description | Có |
| Tags | Có |
| Security requirement | Có nếu protected |
| Path params | Có nếu endpoint có `{id}` |
| Query params | Có nếu list/filter |
| Request body schema | Có nếu POST/PATCH/PUT |
| Success response schema | Có |
| Error responses | Có tối thiểu 400/401/403/404/422/500 nếu phù hợp |
| Example request | Should |
| Example response | Should |

## Error Response Documentation

Swagger phải document common errors:

| Status | Schema |
| --- | --- |
| 400 | BadRequestError |
| 401 | UnauthorizedError |
| 403 | ForbiddenError |
| 404 | NotFoundError |
| 409 | ConflictError |
| 422 | ValidationError |
| 500 | InternalServerError |

## Pagination Documentation

List endpoints phải document:

- `page`
- `limit`
- `keyword`
- `status`
- `sortBy`
- `sortOrder`
- endpoint-specific filters

List response phải include:

- data
- pagination.page
- pagination.limit
- pagination.totalItems
- pagination.totalPages
- pagination.hasNextPage
- pagination.hasPreviousPage

## Swagger Examples Bắt Buộc

| Domain | Example cần có |
| --- | --- |
| Auth | Login request/response |
| Teacher Invitation | Create invitation response có `invitationLink` |
| Student To-do | Todo list response |
| Teacher Course Dashboard | Dashboard response có progress ranking |
| Quiz Question Media | Question có image/video |
| Assignment Submission | Submit assignment request |
| Admin User Lists | Student/Teacher/Admin list item |
| Error | Validation error field-level |

## Swagger Quality Gate

Một endpoint chưa được xem là hoàn thành nếu:

- Chưa có trong Swagger.
- Schema không khớp response thật.
- Thiếu auth/security declaration.
- Thiếu error response cơ bản.
- Thiếu query params cho list API.
- Thiếu enum values cho status/type.

Swagger UI chưa được xem là hoàn thành nếu:

- `/api-docs` không load được OpenAPI specification tương ứng hoặc hiển thị schema/operation lỗi.
- API version/server/tag/operation trong UI không khớp OpenAPI JSON và runtime scope.
- `Authorize` hoặc example làm lộ/persist raw token, secret hoặc Production credential.
- Environment exposure không đúng policy hoặc public documentation cho phép thử mutation trái phép.
- Thay đổi endpoint/schema/auth/error nhưng Swagger UI/JSON không được cập nhật trong cùng change.

## Environment Notes

Swagger UI/JSON ở Cloud Demo/Production-like mặc định restricted cho đến khi exposure policy được phê duyệt. Public read-only chỉ có thể được xem xét khi không lộ API nội bộ/sensitive detail, không prefill credential, không enable unsafe `Try it out`, có rate/access policy và có review Technical Lead, DevOps, Security Reviewer, Product Owner.

Swagger không được chứa:

- Real secrets.
- Real production tokens.
- Raw invitation token ví dụ thật.
- Internal infrastructure credentials.

## Swagger UI Acceptance Evidence

- URL `/api-docs` và `/api/v1/openapi.json`, environment, version/build và access policy result.
- Screenshot/smoke result cho tag/operation/schema rendering, đã redact token/PII.
- Contract validation giữa OpenAPI JSON, Swagger UI và API runtime for representative endpoints.
- Negative evidence: public/protected exposure và unsafe credential persistence bị chặn theo policy.

## Liên Kết

- Functional requirement: `../07-requirements/functional-requirements.md` (`FR-067`, `FR-067A`).
- API acceptance: `../18-acceptance-criteria/api-data-acceptance.md`.
- Open exposure decision: `../22-appendices/open-questions.md` (`APP-Q-003`).
