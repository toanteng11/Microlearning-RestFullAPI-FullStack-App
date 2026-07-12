# Frontend Pages Catalog

## Mục Đích

Tài liệu này liệt kê các màn hình chính của ReactJS application theo dạng có thể triển khai. Mỗi dòng thể hiện route đề xuất, role sử dụng, API chính và các UI state bắt buộc.

## Quy Ước Priority

| Priority | Ý nghĩa |
| --- | --- |
| P0 | Bắt buộc cho MVP, không có sẽ ảnh hưởng trực tiếp đến luồng chính. |
| P1 | Quan trọng, nên có trong bản đầu hoặc ngay sau MVP. |
| P2 | Có thể triển khai sau khi luồng chính ổn định. |

## Page Catalog

| Screen ID | Route đề xuất | Role | Mục đích | API chính | State bắt buộc | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| UI-001 | `/login` | Guest | Đăng nhập hệ thống và redirect theo role. | `POST /api/v1/auth/login`, `GET /api/v1/users/me` | Loading, validation error, invalid credential, account disabled | P0 |
| UI-002 | `/register` | Guest | Student tự đăng ký account; thành công chuyển đến Login và giữ join context nếu có. | `POST /api/v1/auth/register` | Loading, validation error, duplicate email, success redirect | P0 |
| UI-003 | `/forgot-password` | Guest/User | Yêu cầu reset password. | `POST /api/v1/auth/forgot-password` | Loading, validation error, success | P1 |
| UI-004 | `/reset-password` | Guest/User | Đặt password mới bằng reset token. | `POST /api/v1/auth/reset-password` | Loading, token invalid, validation error, success | P1 |
| UI-005 | `/teacher/invite?token=:token` | Invited Teacher | Teacher mở link mời và tự tạo password. | `GET /api/v1/teacher/invitations/{token}`, `POST /api/v1/teacher/invitations/{token}/accept` | Loading, token expired, validation error, success | P0 |
| UI-006 | `/join/code` | Student | Student nhập Class Code để tham gia Classroom. | `POST /api/v1/classrooms/join-by-code` | Loading, invalid code, already joined, success | P0 |
| UI-007 | `/join/invite/:token` | Guest/Student | Preview Classroom Invite Link và join sau khi login. | `GET /api/v1/classrooms/invitations/{token}`, `POST /api/v1/classrooms/join-by-token` | Loading, token invalid, login required, success | P0 |
| UI-008 | `/profile` | User | Xem và cập nhật thông tin cá nhân. | `GET /api/v1/users/me`, `PATCH /api/v1/users/me` | Loading, validation error, success | P1 |
| UI-009 | `/notifications` | User | Xem và đánh dấu notification. | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/{notificationId}/read` | Loading, empty, error, success | P1 |
| UI-010 | `/student/dashboard` | Student | Màn hình chính sau login, hiển thị To-do, deadline, Classroom, progress. | `GET /api/v1/students/me/dashboard`, `GET /api/v1/students/me/todo` | Loading, empty dashboard, error, forbidden | P0 |
| UI-011 | `/student/todo` | Student | Danh sách việc cần làm từ tất cả Classroom. | `GET /api/v1/students/me/todo`, `GET /api/v1/students/me/todo/{todoItemId}` | Loading, empty, error, filter empty | P0 |
| UI-012 | `/student/classrooms` | Student | Danh sách Classroom đã tham gia. | `GET /api/v1/classrooms` | Loading, empty, error | P0 |
| UI-013 | `/student/classrooms/:classroomId` | Student | Xem tổng quan Classroom, announcement và nội dung học. | `GET /api/v1/classrooms/{classroomId}`, `GET /api/v1/classrooms/{classroomId}/announcements` | Loading, not found, forbidden, error | P0 |
| UI-014 | `/student/classrooms/:classroomId/classwork` | Student | Xem Lesson, Quiz, Assignment, Material trong Classroom/Course. | `GET /api/v1/courses`, `GET /api/v1/courses/{courseId}` | Loading, empty, error, forbidden | P0 |
| UI-015 | `/student/lessons/:lessonId` | Student | Học micro lesson và đánh dấu hoàn thành. | `GET /api/v1/lessons/{lessonId}`, `POST /api/v1/lessons/{lessonId}/complete` | Loading, media error, complete success, next/previous disabled | P0 |
| UI-016 | `/student/lessons/:lessonId/flashcards` | Student | Học flashcard trong lesson. | `GET /api/v1/lessons/{lessonId}/flashcards` | Loading, empty, error | P1 |
| UI-017 | `/student/quizzes/:quizId` | Student | Làm quiz. | `GET /api/v1/quizzes/{quizId}`, `POST /api/v1/quizzes/{quizId}/attempts` | Loading, timer warning nếu có, validation, submit confirm, success | P0 |
| UI-018 | `/student/quizzes/:quizId/result` | Student | Xem kết quả quiz và attempt của mình. | `GET /api/v1/quizzes/{quizId}/attempts/me` | Loading, no attempt, error | P1 |
| UI-019 | `/student/assignments/:assignmentId` | Student | Xem yêu cầu assignment và trạng thái nộp bài. | `GET /api/v1/assignments/{assignmentId}` | Loading, not found, forbidden, deadline warning | P0 |
| UI-020 | `/student/assignments/:assignmentId/submission` | Student | Nộp, sửa hoặc resubmit assignment nếu policy cho phép. | `POST /api/v1/assignments/{assignmentId}/submissions`, `PATCH /api/v1/submissions/{submissionId}` | Uploading, validation, success, policy denied | P0 |
| UI-021 | `/student/progress` | Student | Xem tiến độ học tập cá nhân. | `GET /api/v1/students/me/progress` | Loading, empty, error | P1 |
| UI-022 | `/student/grades` | Student | Xem điểm và feedback. | `GET /api/v1/students/me/grades` | Loading, empty, error | P1 |
| UI-023 | `/student/calendar` | Student | Xem deadline theo lịch. | `GET /api/v1/students/me/deadlines` | Loading, empty, error | P1 |
| UI-024 | `/teacher/dashboard` | Teacher | Màn hình chính sau login của Teacher. | `GET /api/v1/classrooms`, `GET /api/v1/courses`, `GET /api/v1/notifications` | Loading, empty, error, forbidden | P0 |
| UI-025 | `/teacher/classrooms/new` | Teacher | Tạo Classroom mới. | `POST /api/v1/classrooms` | Validation, submitting, success, unsaved changes | P0 |
| UI-026 | `/teacher/classrooms/:classroomId` | Teacher | Quản lý Classroom theo tab Stream, Classwork, People, Grades. | `GET /api/v1/classrooms/{classroomId}`, `GET /api/v1/classrooms/{classroomId}/announcements` | Loading, not found, forbidden, error | P0 |
| UI-027 | `/teacher/classrooms/:classroomId/settings` | Teacher | Cập nhật Classroom settings, Class Code và Invite Link. | `PATCH /api/v1/classrooms/{classroomId}/settings`, `POST /api/v1/classrooms/{classroomId}/class-code/regenerate`, `POST /api/v1/classrooms/{classroomId}/invite-links` | Loading, validation, confirm, success | P0 |
| UI-028 | `/teacher/classrooms/:classroomId/roster` | Teacher | Xem danh sách Student trong Classroom. | `GET /api/v1/classrooms/{classroomId}/students` | Loading, empty, error, filter empty | P0 |
| UI-029 | `/teacher/courses/new` | Teacher | Tạo Course/Microlearning sequence. | `POST /api/v1/courses` | Validation, submitting, success, unsaved changes | P0 |
| UI-030 | `/teacher/courses/:courseId/dashboard` | Teacher | Xem toàn bộ bài học, deadline riêng từng Lesson và Student progress ranking. | `GET /api/v1/teacher/courses/{courseId}/dashboard`, `GET /api/v1/teacher/courses/{courseId}/progress` | Loading, empty lesson, empty student, deadline reset success/error, forbidden | P0 |
| UI-031 | `/teacher/courses/:courseId/content` | Teacher | Quản lý Lesson, Quiz, Assignment, Resource trong Course. | `GET /api/v1/teacher/courses/{courseId}/activities`, `PATCH /api/v1/courses/{courseId}/status` | Loading, empty, reorder loading, publish confirm | P0 |
| UI-032 | `/teacher/courses/:courseId/modules` | Teacher | Tạo/sửa Module/Topic và reorder. | `POST /api/v1/courses/{courseId}/modules`, `PATCH /api/v1/modules/{moduleId}`, `PATCH /api/v1/courses/{courseId}/modules/reorder` | Loading, validation, success | P1 |
| UI-033 | `/teacher/lessons/:lessonId/editor` | Teacher | Tạo/sửa Micro Lesson, đặt deadline riêng và reset deadline khi có ngoại lệ. | `GET /api/v1/lessons/{lessonId}`, `PATCH /api/v1/lessons/{lessonId}`, `PATCH /api/v1/teacher/lessons/{lessonId}/deadline` | Loading, validation, save draft, publish, reset deadline reason required, unsaved changes | P0 |
| UI-034 | `/teacher/lessons/:lessonId/flashcards` | Teacher | Tạo/sửa flashcard cho lesson. | `GET /api/v1/lessons/{lessonId}/flashcards`, `POST /api/v1/lessons/{lessonId}/flashcards`, `PATCH /api/v1/flashcards/{flashcardId}` | Loading, empty, validation, success | P1 |
| UI-035 | `/teacher/quizzes/:quizId/builder` | Teacher | Tạo/sửa quiz và câu hỏi trắc nghiệm. | `GET /api/v1/quizzes/{quizId}`, `PATCH /api/v1/quizzes/{quizId}`, `POST /api/v1/quizzes/{quizId}/questions` | Loading, validation, preview, publish, unsaved changes | P0 |
| UI-036 | `/teacher/questions/:questionId/media` | Teacher | Thêm image/video optional vào câu hỏi quiz. | `POST /api/v1/questions/{questionId}/media`, `DELETE /api/v1/questions/{questionId}/media/{mediaId}`, `POST /api/v1/uploads` | Uploading, invalid type, invalid size, success | P1 |
| UI-037 | `/teacher/assignments/:assignmentId/editor` | Teacher | Tạo/sửa assignment. | `GET /api/v1/assignments/{assignmentId}`, `PATCH /api/v1/assignments/{assignmentId}`, `PATCH /api/v1/assignments/{assignmentId}/status` | Loading, validation, publish confirm, unsaved changes | P0 |
| UI-038 | `/teacher/assignments/:assignmentId/submissions` | Teacher | Xem submission status của assignment. | `GET /api/v1/teacher/assignments/{assignmentId}/submissions` | Loading, empty, error, filter empty | P0 |
| UI-039 | `/teacher/submissions/:submissionId` | Teacher | Chấm điểm, feedback và return work. | `GET /api/v1/submissions/{submissionId}`, `PATCH /api/v1/teacher/submissions/{submissionId}/grade`, `POST /api/v1/teacher/submissions/{submissionId}/feedback`, `POST /api/v1/teacher/submissions/{submissionId}/return` | Loading, validation, confirm return, success | P0 |
| UI-040 | `/teacher/gradebook` | Teacher | Xem bảng điểm theo Classroom/Course. | `GET /api/v1/teacher/courses/{courseId}/gradebook` | Loading, empty, error, pagination | P1 |
| UI-041 | `/teacher/progress-analytics` | Teacher | Phân tích tiến độ học sinh. | `GET /api/v1/teacher/courses/{courseId}/progress` | Loading, empty, error, filter empty | P1 |
| UI-042 | `/teacher/resources` | Teacher | Quản lý Learning Resource. | `POST /api/v1/resources`, `GET /api/v1/resources/{resourceId}`, `POST /api/v1/uploads` | Loading, uploading, empty, error | P1 |
| UI-043 | `/admin/dashboard` | Admin | Tổng quan vận hành hệ thống. | `GET /api/v1/admin/dashboard`, `GET /api/v1/system/health`, `GET /api/v1/system/version` | Loading, partial error, forbidden | P0 |
| UI-044 | `/admin/users` | Admin | Entry page điều hướng đến Student/Teacher/Admin list. | No heavy API required, optional summary from `GET /api/v1/admin/dashboard` | Loading, empty summary, error | P0 |
| UI-045 | `/admin/users/students` | Admin | Danh sách riêng Student. | `GET /api/v1/admin/users/students`, `PATCH /api/v1/admin/users/{userId}/status` | Loading, empty, filter empty, confirm status change | P0 |
| UI-046 | `/admin/users/teachers` | Admin | Danh sách riêng Teacher. | `GET /api/v1/admin/users/teachers`, `PATCH /api/v1/admin/users/{userId}/status` | Loading, empty, filter empty, confirm status change | P0 |
| UI-047 | `/admin/users/admins` | Admin/Super Admin | Danh sách riêng Admin/Super Admin. | `GET /api/v1/admin/users/admins`, `PATCH /api/v1/admin/users/{userId}/roles` | Loading, empty, forbidden, confirm role change | P1 |
| UI-048 | `/admin/users/search` | Admin | Tìm kiếm user nâng cao. | `GET /api/v1/admin/users/search` | Initial empty, loading, no result, error | P1 |
| UI-049 | `/admin/teacher-invitations` | Admin | Tạo invitation link, copy thủ công, revoke và theo dõi status. | `POST /api/v1/admin/teacher-invitations`, `GET /api/v1/admin/teacher-invitations`, `POST /api/v1/admin/teacher-invitations/{invitationId}/copy-events`, `POST /api/v1/admin/teacher-invitations/{invitationId}/revoke` | Loading, validation, copy success, revoke confirm, token expired | P0 |
| UI-050 | `/admin/roles` | Admin/Super Admin | Quản lý role và permission. | `PATCH /api/v1/admin/users/{userId}/roles` | Loading, forbidden, confirm, success | P1 |
| UI-051 | `/admin/classroom-governance` | Admin | Giám sát Classroom/Course toàn hệ thống. | `GET /api/v1/admin/classrooms`, `GET /api/v1/admin/classrooms/{classroomId}` | Loading, empty, error, pagination | P1 |
| UI-052 | `/admin/settings/enrollment` | Admin | Cấu hình policy tham gia bằng Code/Link. | `GET /api/v1/admin/settings/enrollment-policy`, `PATCH /api/v1/admin/settings/enrollment-policy` | Loading, validation, success | P1 |
| UI-053 | `/admin/settings/uploads` | Admin | Cấu hình file upload policy. | `GET /api/v1/admin/settings/file-upload-policy`, `PATCH /api/v1/admin/settings/file-upload-policy` | Loading, validation, success | P1 |
| UI-054 | `/admin/settings/notifications` | Admin | Cấu hình notification policy. | `GET /api/v1/admin/settings/notification-policy`, `PATCH /api/v1/admin/settings/notification-policy` | Loading, validation, success | P2 |
| UI-055 | `/admin/audit-logs` | Admin | Xem audit log. | `GET /api/v1/admin/audit-logs`, `GET /api/v1/admin/audit-logs/export` | Loading, empty, filter empty, export loading | P1 |
| UI-056 | `/admin/reports` | Admin | Xem usage/progress reports và export. | `GET /api/v1/admin/reports/usage`, `GET /api/v1/admin/reports/progress`, `GET /api/v1/admin/reports/export` | Loading, empty, error, export loading | P1 |
| UI-057 | `/admin/system` | Admin/Super Admin | Xem/cập nhật system settings. | `GET /api/v1/admin/system-settings`, `PATCH /api/v1/admin/system-settings/{key}` | Loading, forbidden, validation, success | P2 |
| UI-058 | `/admin/teachers/:teacherId/offboarding` | Admin | Offboarding Teacher và xử lý ownership. | `POST /api/v1/admin/teachers/{teacherId}/offboarding` | Loading, confirm, validation, success | P2 |
| UI-059 | `/forbidden` | User | Trang không có quyền truy cập. | Không bắt buộc, có thể dùng auth state local. | N/A | P0 |
| UI-060 | `/not-found` | User/Guest | Trang route/entity không tồn tại. | Không bắt buộc. | N/A | P0 |
| UI-061 | `/deployment-info` hoặc footer internal | DevOps/Admin | Xem build version, environment và API connectivity ở môi trường internal. | `GET /health`, `GET /api/v1/system/version` | Loading, API unavailable, version mismatch | P1 |

## Page-Level Requirements Chung

- Mỗi page phải có page title rõ ràng.
- Mỗi page trong workspace phải có route guard theo role.
- Các page danh sách phải có pagination hoặc cơ chế giới hạn dữ liệu.
- Các page có mutation phải có success/error feedback.
- Các page editor phải có cảnh báo unsaved changes.
- Các page có route parameter phải xử lý not found và forbidden.
- API error phải tuân theo `../11-api-requirements/error-response-standard.md`.

## MVP Page Recommendation

MVP nên ưu tiên các screen P0 sau:

- Auth: UI-001, UI-005.
- Student: UI-006, UI-007, UI-010 đến UI-020.
- Teacher: UI-024 đến UI-031, UI-033, UI-035, UI-037 đến UI-039.
- Admin: UI-043 đến UI-046, UI-049.
- Shared: UI-059, UI-060.

Các screen P1/P2 có thể triển khai theo release sau nhưng nên thiết kế route và navigation từ đầu để không phải đổi cấu trúc lớn.
