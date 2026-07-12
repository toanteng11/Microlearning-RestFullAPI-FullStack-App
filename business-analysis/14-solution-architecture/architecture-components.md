# Architecture Components

## Mục Đích

Tài liệu này phân rã Solution Architecture thành các component và module có trách nhiệm rõ ràng. Đây không phải thiết kế class-level; Technical Lead có thể điều chỉnh tên folder hoặc framework library, nhưng không được phá vỡ boundary, quyền sở hữu dữ liệu và API contract mô tả dưới đây.

## Frontend Components

| Component/Layer | Trách nhiệm | Ví dụ phạm vi | Quy tắc |
| --- | --- | --- | --- |
| App Shell | Bootstrap application, global provider, route guard, error boundary | app initialization, auth restore, global notification | Không chứa business rule domain. |
| Public/Auth Pages | Login, forgot/reset password, Teacher invitation accept | `/login`, `/teacher/invite` | Không hiển thị token trong log/UI sau khi submit. |
| Student Workspace | Dashboard To-do, Classroom, Course, Lesson, Quiz, Assignment, Grade | Student learning workflow | Chỉ render data API cho Student đang đăng nhập. |
| Teacher Workspace | Teacher dashboard, Classroom/Course dashboard, content editor, roster, ranking, gradebook | Publish, deadline reset, grading | Hành động mutate cần confirm/error/success state rõ ràng. |
| Admin Workspace | User lists theo Student/Teacher/Admin, invitation, policy, audit/report | Governance operations | Hành động nhạy cảm yêu cầu reason/confirm theo API rule. |
| Shared UI | Table, pagination, form controls, modal, media uploader, status badge, navigation control | Back/Previous/Next/breadcrumb, loading/empty/error | Accessible labels, keyboard support, status không chỉ dựa màu. |
| API Client | HTTP interceptor, auth header, response/error mapping, requestId display khi cần | REST client modules | Không tự retry mutation gây duplicate action nếu chưa có idempotency rule. |
| State Layer | Server state cache và local UI state | query cache, form draft, filter state | Source of truth cho business data là API/database. |

## Backend Layering

```text
Route -> Middleware -> Controller -> Application Service/Use Case -> Repository -> MongoDB
                                     |                    |
                                     |                    +-> Object Storage Adapter
                                     +-> Audit/Notification/Read Model service
```

| Layer | Trách nhiệm | Không nên chứa |
| --- | --- | --- |
| Route | Map HTTP method/path tới controller, compose middleware | Business rule hoặc Mongo query |
| Middleware | Authentication, requestId, authorization context, validation, rate limit, error normalization | Domain mutation trực tiếp |
| Controller | Parse validated request, gọi use case, map DTO/status code | Nhiều business branch hoặc database query trực tiếp |
| Application Service / Use Case | Transaction-like orchestration, business rule, ownership check, event/audit/read model update | Chi tiết giao thức HTTP hoặc JSX/UI logic |
| Repository | Query, persistence, index-aware pagination | Authorization quyết định độc lập với service |
| Adapter | Object storage, email/notification provider tương lai, clock, external integration | Domain policy cứng |

## Backend Domain Modules

| Module | Chức năng chính | Dữ liệu chính | Liên quan requirement |
| --- | --- | --- | --- |
| Identity & Access | Login, logout, token refresh, password reset, account status, RBAC | User, Role, Permission, UserSession | Authentication và role access |
| Teacher Invitation | Tạo/copy/revoke/validate/accept invitation link | TeacherInvitation, AuditLog | Admin cung cấp account Teacher thủ công |
| User Administration | Student/Teacher/Admin lists, filter, status, role governance | User, Role, AuditLog | Admin User Management phân tách list role |
| Classroom & Enrollment | Classroom settings, Class Code và Invite Link, roster | Classroom, Enrollment, join token/code | Student join Classroom |
| Course & Content | Course, Module, Lesson, Material, Flashcard, publish/order | Course, Module, Lesson, Resource | Microlearning content |
| Assessment | Quiz, Question, optional QuestionMedia, attempts, Assignment, Submission | Quiz, Question, QuestionMedia, QuizAttempt, Assignment, Submission | Quiz/submission/grading workflow |
| Learning Progress | Completion, due status, To-do, CourseProgressSummary, ranking | LearningProgress, StudentTodoItem, CourseProgressSummary | Student To-do, Teacher ranking/deadline |
| Grade & Feedback | Process score, grading, feedback, gradebook | Grade, Feedback, Submission | Teacher sees and manages scores |
| Stream & Notification | Announcement, in-app notification, activity feed | Announcement, Notification | Classroom Stream/future reminder |
| File & Media | Validate upload, authorize file, metadata/object lifecycle | LearningResource, QuestionMedia | Attachment/question image/video |
| Reporting & Audit | Reports/read view, immutable audit event | ReportSnapshot, AuditLog | Admin governance, traceability |
| System & Operations | Health, version, settings/policy, deployment record | SystemSetting, DeploymentRecord | DevOps observability/configuration |

## Module Ownership Rules

- `Identity & Access` là nơi duy nhất tạo password hash, token/session policy và user authentication state.
- `Classroom & Enrollment` là nơi duy nhất tạo/hủy enrollment sau khi xác thực code hoặc link.
- `Course & Content` quản lý lifecycle draft/published/archived của Course/Module/Lesson; `Learning Progress` không tự publish content.
- `Learning Progress` là owner của trạng thái completion, To-do và progress summary. Nó nhận activity/deadline thay đổi qua service interface hoặc event nội bộ đã định nghĩa.
- `Grade & Feedback` là owner của điểm/feedback; progress summary chỉ đọc/tổng hợp điểm theo công thức được phê duyệt.
- `File & Media` phải xác nhận user được quyền gắn file vào resource trước khi metadata được lưu.
- `Reporting & Audit` không được trở thành con đường để sửa dữ liệu nghiệp vụ.

## API Ownership Map

| API area | Module owner | Ví dụ endpoint |
| --- | --- | --- |
| `/api/v1/auth/*` | Identity & Access | login, refresh, logout, password reset |
| `/api/v1/admin/users/*`, `/api/v1/admin/teacher-invitations/*` | User Administration / Teacher Invitation | role-specific list, create/copy/revoke invitation |
| `/api/v1/classrooms/*` | Classroom & Enrollment | CRUD, join, roster, code/link |
| `/api/v1/courses/*`, `/api/v1/teacher/lessons/*` | Course & Content | content management, deadline reset |
| `/api/v1/quizzes/*`, `/api/v1/assignments/*` | Assessment | question, attempt, submission |
| `/api/v1/student/*`, `/api/v1/teacher/courses/*/progress` | Learning Progress / Grade & Feedback | to-do, dashboard, ranking |
| `/api/v1/files/*` | File & Media | upload authorization, media metadata |
| `/health`, `/api/v1/system/*` | System & Operations | health, version, settings |

## Giao Tiếp Giữa Module

MVP có thể gọi service interface trong cùng process để tránh độ phức tạp distributed system. Tuy nhiên, side effect phải rõ ràng và có khả năng retry/rebuild:

| Sự kiện nghiệp vụ | Producer | Consumer | Kết quả cần có |
| --- | --- | --- | --- |
| Lesson/Quiz/Assignment published | Course & Content / Assessment | Learning Progress, Stream/Audit | To-do/progress basis cập nhật; AuditLog nếu cần |
| Deadline reset | Course & Content | Learning Progress, Notification, Audit | Lưu history, cập nhật To-do/Calendar/status, có reason |
| Student join Classroom | Classroom & Enrollment | Learning Progress, Audit | Có roster, dashboard context và audit record |
| Student completes Lesson | Learning Progress | Reporting/Audit nếu cần | Completion và course summary cập nhật |
| Student submits Assignment / Quiz | Assessment | Learning Progress, Grade & Feedback | Submission/attempt, late status, score summary |
| Teacher grades | Grade & Feedback | Learning Progress, Reporting/Audit | Process score/ranking được recalculated |

Khi số lượng side effect hoặc retry tăng, các sự kiện này là ứng viên cho queue/worker. Không đưa message broker vào MVP chỉ để mô phỏng kiến trúc lớn.

## DTO và Error Boundary

- Controller chỉ trả response DTO được định nghĩa ở mục 11, không serialize nguyên MongoDB document.
- DTO phải loại bỏ `passwordHash`, `tokenHash`, raw token, internal object storage credential và field audit nhạy cảm.
- Error từ repository/storage phải được normalize thành error code/API format thống nhất; Production không trả stack trace.
- Mọi mutation quan trọng phải trả resource hoặc operation result rõ ràng để ReactJS cập nhật UI, không suy đoán trạng thái từ button click.

## Gợi Ý Cấu Trúc Source Code

```text
frontend/src/
  app/                 # app shell, router, providers
  features/            # auth, student, teacher, admin, classroom, course...
  shared/              # reusable UI, api client, utilities, types

backend/src/
  modules/             # identity, invitation, classroom, course, assessment...
  shared/              # middleware, errors, config, logger, database, storage adapters
  docs/                # OpenAPI/Swagger definition nếu quản lý trong source
  app.*                # application composition
  server.*             # runtime startup/shutdown
```

Tên folder chỉ là khuyến nghị. Điều quan trọng là source code phản ánh module ownership và dependency direction ở trên.
