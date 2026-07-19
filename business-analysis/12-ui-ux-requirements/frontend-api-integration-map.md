# Frontend API Integration Map

## Mục Đích

Tài liệu này ánh xạ các màn hình frontend với API endpoints ở mục 11. Dev dùng file này để xác định page nào cần gọi API nào, Backend dùng để kiểm tra endpoint đã đủ cho UI chưa, QA dùng để viết integration test.

## Nguyên Tắc Tích Hợp API

| Mã | Nguyên tắc | Mô tả |
| --- | --- | --- |
| API-MAP-001 | API contract first | Frontend phải bám theo Swagger/OpenAPI và `../11-api-requirements/api-request-response-schemas.md`. |
| API-MAP-002 | No hidden mock in production | Mock data chỉ dùng ở dev/test, không để logic mock chạy ở production. |
| API-MAP-003 | Central API client | React app nên có API client trung tâm để xử lý base URL, token, refresh token và error mapping. |
| API-MAP-004 | Error standard | Tất cả error UI phải map theo `../11-api-requirements/error-response-standard.md`. |
| API-MAP-005 | Query invalidation | Sau mutation như join, submit, publish, revoke, grade, UI phải refetch hoặc invalidate dữ liệu liên quan. |
| API-MAP-006 | Pagination-aware UI | Các list lớn phải truyền page, limit, search, filter theo chuẩn pagination/filtering của API. |

## Public/Auth Integration

| Screen | API | UI cần xử lý |
| --- | --- | --- |
| Login | `POST /api/v1/auth/login`, `GET /api/v1/users/me` | Sai email/password, account disabled, role redirect. |
| Student Register | `POST /api/v1/auth/register` | Email trùng, validation, role/status injection; thành công chuyển Login, không coi registration response là authenticated session. |
| Forgot Password | `POST /api/v1/auth/forgot-password` | Success message không tiết lộ email có tồn tại hay không nếu security yêu cầu. |
| Reset Password | `POST /api/v1/auth/reset-password` | Token invalid/expired, password validation. |
| Teacher Invitation Accept | `POST /api/v1/teacher/invitations/preview`, `POST /api/v1/teacher/invitations/accept` | Đọc token một lần từ link, xóa token khỏi URL, gửi trong strict body; xử lý expired/revoked/accepted, password confirm và redirect Login. |

## Student Integration

| Screen | API | UI cần xử lý |
| --- | --- | --- |
| Student Dashboard | `GET /api/v1/students/me/dashboard`, `GET /api/v1/students/me/todo`, `GET /api/v1/students/me/notifications` | Dashboard partial loading, To-do priority, notification count. |
| Student To-do | `GET /api/v1/students/me/todo`, `GET /api/v1/students/me/todo/{todoItemId}` | Filter by status/classroom/type, empty state, open activity by action URL. |
| Join By Code | `POST /api/v1/classrooms/join-by-code` | Invalid code, already joined, enrollment locked, success redirect. |
| Join By Link | `POST /api/v1/classrooms/invite-links/preview`, `POST /api/v1/classrooms/join-by-token` | Đọc/xóa token fragment trước network call; preview `no-store`, login required, invalid token, revalidate sau auth và already joined. |
| Classroom List | `GET /api/v1/classrooms` | Empty state nếu chưa tham gia lớp nào. |
| Classroom Detail | `GET /api/v1/classrooms/{classroomId}`, `GET /api/v1/classrooms/{classroomId}/announcements` | Forbidden nếu không thuộc Classroom, not found. |
| Classwork/Course Detail | `GET /api/v1/courses`, `GET /api/v1/courses/{courseId}` | Chỉ hiển thị content đã publish/assigned cho Student. |
| Lesson Player | `GET /api/v1/lessons/{lessonId}`, `POST /api/v1/lessons/{lessonId}/complete` | Media loading, complete success, update progress/to-do. |
| Flashcards | `GET /api/v1/lessons/{lessonId}/flashcards` | Empty nếu lesson không có flashcard. |
| Quiz Attempt | `GET /api/v1/quizzes/{quizId}`, `POST /api/v1/quizzes/{quizId}/attempts` | Confirm submit, validation unanswered nếu quiz yêu cầu, result redirect. |
| Quiz Result | `GET /api/v1/quizzes/{quizId}/attempts/me` | No attempt state, score/feedback display. |
| Assignment Detail | `GET /api/v1/assignments/{assignmentId}` | Deadline, status, attachment, feedback nếu có. |
| Assignment Submission | `POST /api/v1/assignments/{assignmentId}/submissions`, `PATCH /api/v1/submissions/{submissionId}`, `POST /api/v1/uploads` | Upload progress, invalid file, late submission warning, success. |
| Student Progress | `GET /api/v1/students/me/progress` | Course/classroom filter, empty state. |
| Student Grades | `GET /api/v1/students/me/grades` | Grade, feedback, returned work, missing state. |
| Student Calendar | `GET /api/v1/students/me/deadlines` | Due soon, overdue, calendar/list mode. |

## Teacher Integration

| Screen | API | UI cần xử lý |
| --- | --- | --- |
| Teacher Dashboard | `GET /api/v1/classrooms`, `GET /api/v1/courses`, `GET /api/v1/notifications` | Empty state cho Teacher mới, pending submission summary. |
| Create Classroom | `POST /api/v1/classrooms` | Validation, success redirect, duplicate-like name warning nếu cần. |
| Classroom Detail | `GET /api/v1/classrooms/{classroomId}`, `GET /api/v1/classrooms/{classroomId}/announcements` | Tabs Stream/Classwork/People/Grades, forbidden nếu không có quyền. |
| Classroom Settings | `PATCH /api/v1/classrooms/{classroomId}/settings`, `POST /api/v1/classrooms/{classroomId}/class-code/regenerate`, `POST /api/v1/classrooms/{classroomId}/invite-links`, `POST /api/v1/classrooms/{classroomId}/invite-links/{linkId}/regenerate`, `POST /api/v1/classrooms/{classroomId}/invite-links/{linkId}/disable` | Confirm action, optimistic concurrency và one-time copy feedback; list/detail chỉ hiển thị metadata. |
| Classroom Roster | `GET /api/v1/classrooms/{classroomId}/students` | Search, pagination, empty state. |
| Create Course | `POST /api/v1/courses` | Validation, success redirect Course Dashboard. |
| Teacher Course Dashboard | `GET /api/v1/teacher/courses/{courseId}/dashboard`, `GET /api/v1/teacher/courses/{courseId}/activities`, `GET /api/v1/teacher/courses/{courseId}/students`, `GET /api/v1/teacher/courses/{courseId}/progress` | Activities, deadlines, Student ranking sort `processScore DESC`. |
| Course Content Management | `GET /api/v1/teacher/courses/{courseId}/activities`, `PATCH /api/v1/courses/{courseId}/status` | Publish/unpublish/archive confirm, reorder if implemented. |
| Module Management | `POST /api/v1/courses/{courseId}/modules`, `PATCH /api/v1/modules/{moduleId}`, `PATCH /api/v1/courses/{courseId}/modules/reorder` | Reorder loading, validation. |
| Lesson Editor | `GET /api/v1/lessons/{lessonId}`, `PATCH /api/v1/lessons/{lessonId}`, `PATCH /api/v1/lessons/{lessonId}/status`, `PATCH /api/v1/teacher/lessons/{lessonId}/deadline` | Save draft, publish, đặt deadline riêng, reset deadline khi có ngoại lệ, reason required nếu Lesson đã publish/assigned, unsaved changes. |
| Flashcard Editor | `GET /api/v1/lessons/{lessonId}/flashcards`, `POST /api/v1/lessons/{lessonId}/flashcards`, `PATCH /api/v1/flashcards/{flashcardId}` | Empty state, validation, reorder nếu có. |
| Quiz Builder | `GET /api/v1/quizzes/{quizId}`, `PATCH /api/v1/quizzes/{quizId}`, `POST /api/v1/quizzes/{quizId}/questions`, `PATCH /api/v1/questions/{questionId}`, `DELETE /api/v1/questions/{questionId}` | Question validation, correct answer, preview, publish. |
| Quiz Question Media | `POST /api/v1/uploads`, `POST /api/v1/questions/{questionId}/media`, `DELETE /api/v1/questions/{questionId}/media/{mediaId}` | Image/video optional, file type/size validation, preview. |
| Assignment Editor | `GET /api/v1/assignments/{assignmentId}`, `PATCH /api/v1/assignments/{assignmentId}`, `PATCH /api/v1/assignments/{assignmentId}/status` | Draft/publish/close/archive, deadline, attachment. |
| Submission Management | `GET /api/v1/teacher/assignments/{assignmentId}/submissions` | Status filter: submitted, missing, late, returned. |
| Grade And Feedback | `GET /api/v1/submissions/{submissionId}`, `PATCH /api/v1/teacher/submissions/{submissionId}/grade`, `POST /api/v1/teacher/submissions/{submissionId}/feedback`, `POST /api/v1/teacher/submissions/{submissionId}/return` | Grade validation, feedback required nếu return policy yêu cầu. |
| Teacher Gradebook | `GET /api/v1/teacher/courses/{courseId}/gradebook` | Sort, filter, empty, export nếu có sau MVP. |
| Progress Analytics | `GET /api/v1/teacher/courses/{courseId}/progress` | Default sort, risk indicators, filter by activity/status. |

## Admin Integration

| Screen | API | UI cần xử lý |
| --- | --- | --- |
| Admin Dashboard | `GET /api/v1/admin/dashboard`, `GET /api/v1/system/health`, `GET /api/v1/system/version` | Metrics, system status, partial API failure. |
| User Management Entry | Optional summary from `GET /api/v1/admin/dashboard` | Navigation cards/tabs đến Student, Teacher, Admin list. |
| Admin Student List | `GET /api/v1/admin/users/students`, `PATCH /api/v1/admin/users/{userId}/status` | Pagination, search, status confirm, no mixed role list. |
| Admin Teacher List | `GET /api/v1/admin/users/teachers`, `PATCH /api/v1/admin/users/{userId}/status` | Invitation status, active status, offboarding action. |
| Admin Admin List | `GET /api/v1/admin/users/admins`, `PATCH /api/v1/admin/users/{userId}/roles` | Super Admin permission, confirm role change. |
| Advanced User Search | `GET /api/v1/admin/users/search` | Initial state trước khi search, no result, query validation. |
| Teacher Invitation Management | `POST /api/v1/admin/teacher-invitations`, `GET /api/v1/admin/teacher-invitations`, `POST /api/v1/admin/teacher-invitations/{invitationId}/copy-events`, `POST /api/v1/admin/teacher-invitations/{invitationId}/revoke` | Manual copy link, no auto email, revoke confirm, status badge. |
| Role And Permission | `PATCH /api/v1/admin/users/{userId}/roles` | Permission guard, confirm, audit expectation. |
| Classroom Governance | `GET /api/v1/admin/classrooms`, `GET /api/v1/admin/classrooms/{classroomId}`; Conditional Should: `PATCH /api/v1/admin/classrooms/{classroomId}/ownership`, `PATCH /api/v1/admin/classrooms/{classroomId}/enrollment-lock` | Must chỉ có read-only list/detail và `memberCount`; transfer/lock ẩn hoặc bị deny cho đến khi được phê duyệt. |
| Enrollment Policy | `GET /api/v1/admin/settings/enrollment-policy`, `PATCH /api/v1/admin/settings/enrollment-policy` | Toggle Code/Link policy, validation. |
| Upload Policy | `GET /api/v1/admin/settings/file-upload-policy`, `PATCH /api/v1/admin/settings/file-upload-policy` | File type, max size, media policy. |
| Notification Policy | `GET /api/v1/admin/settings/notification-policy`, `PATCH /api/v1/admin/settings/notification-policy` | Channel toggles, event toggles. |
| Audit Log | `GET /api/v1/admin/audit-logs`, `GET /api/v1/admin/audit-logs/export` | Filter by actor/action/date, export loading. |
| Reports | `GET /api/v1/admin/reports/usage`, `GET /api/v1/admin/reports/progress`, `GET /api/v1/admin/reports/export` | Date range, export, empty data. |
| System Settings | `GET /api/v1/admin/system-settings`, `PATCH /api/v1/admin/system-settings/{key}` | Super Admin guard, validation. |
| Teacher Offboarding | `POST /api/v1/admin/teachers/{teacherId}/offboarding` | Ownership transfer/checklist, confirm. |

## Shared/DevOps Integration

| Screen/Feature | API | UI cần xử lý |
| --- | --- | --- |
| Profile | `GET /api/v1/users/me`, `PATCH /api/v1/users/me` | Profile refetch sau update. |
| Notification Bell | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/read-all` | Unread count, mark all read. |
| Health/Build Info | `GET /health`, `GET /api/v1/system/version` | API unavailable, version mismatch, environment display. |
| Route Guard | `GET /api/v1/users/me` hoặc cached auth profile | 401, 403, redirect role dashboard. |

## Query Invalidation Gợi Ý

| Mutation | Dữ liệu cần refetch/invalidate |
| --- | --- |
| Student join Classroom | Student Dashboard, Classroom List, To-do, Notifications. |
| Student complete Lesson | To-do, Student Progress, Course/Classwork status. |
| Student submit Quiz | To-do, Grades, Progress, Quiz Result. |
| Student submit Assignment | To-do, Assignment Detail, Grades nếu chấm tự động. |
| Teacher publish Lesson/Quiz/Assignment | Teacher Course Dashboard, Student To-do, Student Classwork. |
| Teacher update/reset Lesson deadline | Teacher Course Dashboard, Lesson detail, Student To-do, Student Calendar, notification nếu bật. |
| Teacher grade submission | Submission list, Gradebook, Student Grades, Student To-do nếu item cần revision. |
| Admin create Teacher Invitation | Teacher Invitation list, Admin Dashboard metrics nếu có. |
| Admin revoke Invitation | Teacher Invitation list, Audit Log. |
| Admin change user status/role | User list hiện tại, User detail, Audit Log. |

## Acceptance Criteria

- Mỗi P0 screen trong `frontend-pages.md` có API mapping rõ ràng.
- Frontend không gọi endpoint Admin tổng hợp tất cả users làm mặc định cho User Management.
- Manual Teacher Invitation không có dependency bắt buộc vào Gmail hoặc email provider.
- Student To-do được cập nhật sau các activity completion/submission.
- DevOps có thể kiểm tra API connectivity bằng health/version endpoint sau deployment.
