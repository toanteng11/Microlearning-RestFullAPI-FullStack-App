# API Endpoint Catalog

## Mục Đích

Tài liệu này liệt kê các RESTful API endpoints cần có cho **Microlearning Classroom LMS Platform**. Endpoint catalog được tổ chức theo domain để Backend, Frontend và QA dễ triển khai, test và trace với requirements/use cases.

## Endpoint Table Columns

| Cột | Ý nghĩa |
| --- | --- |
| Method | HTTP method |
| Endpoint | API path |
| Mô tả | Chức năng nghiệp vụ |
| Auth | Public/Required |
| Actor | Actor/role chính |
| Related UC | Use case liên quan |

## Authentication And Current User APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Tự đăng ký account cố định role `STUDENT`; không tạo session/Enrollment | Public | Guest | UC-001 |
| POST | `/api/v1/auth/login` | Login và nhận token/session | Public | User | UC-002 |
| POST | `/api/v1/auth/refresh-token` | Làm mới access token | Required | User | UC-002 |
| POST | `/api/v1/auth/logout` | Logout session hiện tại | Required | User | UC-047 |
| POST | `/api/v1/auth/forgot-password` | Yêu cầu reset password | Public | User | UC-048 |
| POST | `/api/v1/auth/reset-password` | Đặt password mới bằng reset token | Public | User | UC-048 |
| GET | `/api/v1/users/me` | Lấy profile current user | Required | User | UC-049 |
| PATCH | `/api/v1/users/me` | Cập nhật profile được phép | Required | User | UC-049 |

## Teacher Invitation APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/admin/teacher-invitations` | Admin tạo Teacher invitation và nhận manual copy link | Required | Admin | UC-027 |
| GET | `/api/v1/admin/teacher-invitations` | Admin xem danh sách invitations | Required | Admin | UC-027 |
| GET | `/api/v1/admin/teacher-invitations/{invitationId}` | Admin xem chi tiết invitation | Required | Admin | UC-027 |
| POST | `/api/v1/admin/teacher-invitations/{invitationId}/copy-events` | Ghi nhận copy link nếu tracking | Required | Admin | UC-027 |
| POST | `/api/v1/admin/teacher-invitations/{invitationId}/revoke` | Revoke invitation chưa accept | Required | Admin | UC-027 |
| GET | `/api/v1/teacher/invitations/{token}` | Teacher preview invitation bằng token | Public | Teacher | UC-051 |
| POST | `/api/v1/teacher/invitations/{token}/accept` | Teacher kích hoạt account và tự tạo password | Public | Teacher | UC-051 |

## Classroom APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/classrooms` | Lấy Classroom theo current user role | Required | Student/Teacher/Admin | UC-053 |
| POST | `/api/v1/classrooms` | Teacher tạo Classroom | Required | Teacher | UC-003 |
| GET | `/api/v1/classrooms/{classroomId}` | Lấy chi tiết Classroom | Required | Student/Teacher/Admin | UC-053 |
| PATCH | `/api/v1/classrooms/{classroomId}` | Cập nhật Classroom | Required | Teacher | UC-003 |
| DELETE | `/api/v1/classrooms/{classroomId}` | Archive Classroom | Required | Teacher/Admin | UC-003 |
| GET | `/api/v1/classrooms/{classroomId}/students` | Xem roster Student trong Classroom | Required | Teacher | UC-064 |
| PATCH | `/api/v1/classrooms/{classroomId}/settings` | Cập nhật Classroom settings | Required | Teacher | UC-024 |
| POST | `/api/v1/classrooms/{classroomId}/class-code/regenerate` | Generate/regenerate Class Code | Required | Teacher | UC-004 |
| POST | `/api/v1/classrooms/{classroomId}/invite-links` | Tạo Invite Link | Required | Teacher | UC-005 |
| PATCH | `/api/v1/classrooms/{classroomId}/invite-links/{linkId}` | Disable/regenerate Invite Link status | Required | Teacher | UC-005 |

## Classroom Join APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/classrooms/join-by-code` | Student join Classroom bằng Class Code | Required | Student | UC-006 |
| GET | `/api/v1/classrooms/invitations/{token}` | Preview Classroom Invite Link token | Public/Optional | Guest/Student | UC-052 |
| POST | `/api/v1/classrooms/join-by-token` | Student join bằng Invite Link token | Required | Student | UC-007 |

## Student APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/students/me/dashboard` | Lấy Student Dashboard summary | Required | Student | UC-041 |
| GET | `/api/v1/students/me/todo` | Lấy To-do / Việc cần làm | Required | Student | UC-041 |
| GET | `/api/v1/students/me/todo/{todoItemId}` | Lấy metadata một To-do item | Required | Student | UC-042 |
| GET | `/api/v1/students/me/progress` | Lấy progress của Student | Required | Student | UC-058 |
| GET | `/api/v1/students/me/grades` | Lấy Grade/Feedback của Student | Required | Student | UC-057 |
| GET | `/api/v1/students/me/deadlines` | Lấy Calendar/Deadline View | Required | Student | UC-059 |
| GET | `/api/v1/students/me/notifications` | Lấy notification của Student | Required | Student | UC-041 |

## Course APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/courses` | Lấy danh sách Course theo quyền | Required | Student/Teacher/Admin | UC-053 |
| POST | `/api/v1/courses` | Teacher tạo Course | Required | Teacher | UC-011 |
| GET | `/api/v1/courses/{courseId}` | Lấy chi tiết Course | Required | Student/Teacher/Admin | UC-044 |
| PATCH | `/api/v1/courses/{courseId}` | Cập nhật Course | Required | Teacher | UC-011 |
| PATCH | `/api/v1/courses/{courseId}/status` | Publish/unpublish/archive Course | Required | Teacher | UC-011 |
| DELETE | `/api/v1/courses/{courseId}` | Archive Course | Required | Teacher | UC-011 |

## Teacher Course Dashboard APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/teacher/courses/{courseId}/dashboard` | Lấy Course Detail Dashboard | Required | Teacher | UC-044 |
| GET | `/api/v1/teacher/courses/{courseId}/activities` | Lấy Lesson/Quiz/Assignment/Resource trong Course | Required | Teacher | UC-044 |
| GET | `/api/v1/teacher/courses/{courseId}/students` | Lấy Student list có quyền học Course | Required | Teacher | UC-044 |
| GET | `/api/v1/teacher/courses/{courseId}/progress` | Lấy Student Progress Ranking | Required | Teacher | UC-045 |
| GET | `/api/v1/teacher/courses/{courseId}/gradebook` | Lấy Gradebook Basic theo Course | Required | Teacher | UC-063 |

## Module, Lesson, Flashcard And Resource APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/courses/{courseId}/modules` | Tạo Module/Topic | Required | Teacher | UC-017 |
| PATCH | `/api/v1/modules/{moduleId}` | Cập nhật Module/Topic | Required | Teacher | UC-017 |
| PATCH | `/api/v1/courses/{courseId}/modules/reorder` | Reorder modules | Required | Teacher | UC-017 |
| POST | `/api/v1/lessons` | Tạo Lesson | Required | Teacher | UC-012 |
| GET | `/api/v1/lessons/{lessonId}` | Lấy Lesson detail | Required | Student/Teacher | UC-009 |
| PATCH | `/api/v1/lessons/{lessonId}` | Cập nhật Lesson | Required | Teacher | UC-012 |
| PATCH | `/api/v1/lessons/{lessonId}/status` | Publish/unpublish/archive Lesson | Required | Teacher | UC-012 |
| PATCH | `/api/v1/teacher/lessons/{lessonId}/deadline` | Đặt/cập nhật/reset deadline Lesson; yêu cầu reason khi Lesson đã publish/assigned | Required | Teacher | UC-046 |
| POST | `/api/v1/lessons/{lessonId}/complete` | Student hoàn thành Lesson | Required | Student | UC-009 |
| GET | `/api/v1/lessons/{lessonId}/flashcards` | Student/Teacher lấy Flashcards | Required | Student/Teacher | UC-054 |
| POST | `/api/v1/lessons/{lessonId}/flashcards` | Teacher tạo Flashcard | Required | Teacher | UC-018 |
| PATCH | `/api/v1/flashcards/{flashcardId}` | Teacher cập nhật Flashcard | Required | Teacher | UC-018 |
| GET | `/api/v1/resources/{resourceId}` | Mở Learning Resource | Required | Student/Teacher | UC-055 |
| POST | `/api/v1/resources` | Teacher tạo Learning Resource | Required | Teacher | UC-055 |

## Announcement APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/classrooms/{classroomId}/announcements` | Lấy announcements trong Classroom | Required | Student/Teacher | UC-020 |
| POST | `/api/v1/classrooms/{classroomId}/announcements` | Teacher đăng Announcement | Required | Teacher | UC-020 |
| PATCH | `/api/v1/announcements/{announcementId}` | Cập nhật Announcement | Required | Teacher | UC-020 |
| DELETE | `/api/v1/announcements/{announcementId}` | Archive/delete Announcement | Required | Teacher | UC-020 |

## Quiz APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/quizzes` | Teacher tạo Quiz | Required | Teacher | UC-061 |
| GET | `/api/v1/quizzes/{quizId}` | Lấy Quiz detail theo quyền | Required | Student/Teacher | UC-010 |
| PATCH | `/api/v1/quizzes/{quizId}` | Teacher cập nhật Quiz | Required | Teacher | UC-061 |
| PATCH | `/api/v1/quizzes/{quizId}/status` | Publish/unpublish/archive Quiz | Required | Teacher | UC-061 |
| POST | `/api/v1/quizzes/{quizId}/questions` | Tạo Question | Required | Teacher | UC-061 |
| PATCH | `/api/v1/questions/{questionId}` | Cập nhật Question | Required | Teacher | UC-061 |
| DELETE | `/api/v1/questions/{questionId}` | Xóa/archive Question | Required | Teacher | UC-061 |
| POST | `/api/v1/questions/{questionId}/media` | Thêm image/video optional vào Question | Required | Teacher | UC-061 |
| DELETE | `/api/v1/questions/{questionId}/media/{mediaId}` | Xóa media khỏi Question | Required | Teacher | UC-061 |
| POST | `/api/v1/quizzes/{quizId}/attempts` | Student submit Quiz attempt | Required | Student | UC-010 |
| GET | `/api/v1/quizzes/{quizId}/attempts/me` | Student xem attempt của mình | Required | Student | UC-010 |
| GET | `/api/v1/teacher/quizzes/{quizId}/results` | Teacher xem Quiz results/performance | Required | Teacher | UC-062 |

## Assignment And Submission APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/assignments` | Teacher tạo Assignment | Required | Teacher | UC-019 |
| GET | `/api/v1/assignments/{assignmentId}` | Lấy Assignment detail | Required | Student/Teacher | UC-056 |
| PATCH | `/api/v1/assignments/{assignmentId}` | Teacher cập nhật Assignment | Required | Teacher | UC-019 |
| PATCH | `/api/v1/assignments/{assignmentId}/status` | Publish/close/archive Assignment | Required | Teacher | UC-019 |
| POST | `/api/v1/assignments/{assignmentId}/submissions` | Student nộp Assignment | Required | Student | UC-056 |
| PATCH | `/api/v1/submissions/{submissionId}` | Student update/unsubmit/resubmit nếu policy cho phép | Required | Student | UC-056 |
| GET | `/api/v1/submissions/{submissionId}` | Xem Submission detail | Required | Student/Teacher | UC-056, UC-022 |
| GET | `/api/v1/teacher/assignments/{assignmentId}/submissions` | Teacher xem Submission Status | Required | Teacher | UC-021 |
| PATCH | `/api/v1/teacher/submissions/{submissionId}/grade` | Teacher chấm điểm | Required | Teacher | UC-022 |
| POST | `/api/v1/teacher/submissions/{submissionId}/feedback` | Teacher gửi feedback/private comment | Required | Teacher | UC-022 |
| POST | `/api/v1/teacher/submissions/{submissionId}/return` | Teacher return work | Required | Teacher | UC-022 |

## Upload And Media APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/uploads` | Upload file/resource chung | Required | Student/Teacher | UC-055, UC-056, UC-061 |
| GET | `/api/v1/uploads/{fileId}` | Lấy metadata hoặc signed URL nếu cần | Required | Student/Teacher | UC-055 |
| DELETE | `/api/v1/uploads/{fileId}` | Xóa/disable file nếu có quyền | Required | Owner/Admin | UC-055 |

## Notification APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/notifications` | Lấy notification của current user | Required | User | UC-041 |
| PATCH | `/api/v1/notifications/{notificationId}/read` | Đánh dấu đã đọc | Required | User | UC-041 |
| PATCH | `/api/v1/notifications/read-all` | Đánh dấu tất cả đã đọc | Required | User | UC-041 |

## Admin User Management APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/dashboard` | Lấy Admin Dashboard metrics | Required | Admin | UC-025 |
| GET | `/api/v1/admin/users/students` | Lấy Student List | Required | Admin | UC-065 |
| GET | `/api/v1/admin/users/teachers` | Lấy Teacher List | Required | Admin | UC-066 |
| GET | `/api/v1/admin/users/admins` | Lấy Admin List | Required | Admin/Super Admin | UC-067 |
| GET | `/api/v1/admin/users/search` | Advanced User Search | Required | Admin | UC-068 |
| GET | `/api/v1/admin/users/{userId}` | Lấy User detail | Required | Admin | UC-014 |
| PATCH | `/api/v1/admin/users/{userId}/status` | Block/unblock/deactivate/restore account | Required | Admin | UC-029 |
| PATCH | `/api/v1/admin/users/{userId}/roles` | Cập nhật role/permission | Required | Admin/Super Admin | UC-030 |

## Admin Policy, Governance, Reports And Audit APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/settings/enrollment-policy` | Xem Enrollment Policy | Required | Admin | UC-031 |
| PATCH | `/api/v1/admin/settings/enrollment-policy` | Cập nhật Enrollment Policy | Required | Admin | UC-031 |
| GET | `/api/v1/admin/settings/file-upload-policy` | Xem File Upload Policy | Required | Admin | UC-034 |
| PATCH | `/api/v1/admin/settings/file-upload-policy` | Cập nhật File Upload Policy | Required | Admin | UC-034 |
| GET | `/api/v1/admin/settings/notification-policy` | Xem Notification Policy | Required | Admin | UC-035 |
| PATCH | `/api/v1/admin/settings/notification-policy` | Cập nhật Notification Policy | Required | Admin | UC-035 |
| GET | `/api/v1/admin/classrooms` | Admin xem tất cả Classroom | Required | Admin | UC-032 |
| GET | `/api/v1/admin/classrooms/{classroomId}` | Admin xem Classroom governance detail | Required | Admin | UC-032 |
| PATCH | `/api/v1/admin/classrooms/{classroomId}/ownership` | Transfer ownership | Required | Admin | UC-033 |
| PATCH | `/api/v1/admin/classrooms/{classroomId}/enrollment-lock` | Lock/unlock enrollment | Required | Admin | UC-069 |
| GET | `/api/v1/admin/reports/usage` | Usage report | Required | Admin | UC-036 |
| GET | `/api/v1/admin/reports/progress` | Learning progress report | Required | Admin | UC-036 |
| GET | `/api/v1/admin/reports/export` | Export reports | Required | Admin | UC-038 |
| GET | `/api/v1/admin/audit-logs` | Xem Audit Log | Required | Admin | UC-037 |
| GET | `/api/v1/admin/audit-logs/export` | Export Audit Log | Required | Admin | UC-038 |
| GET | `/api/v1/admin/system-settings` | Xem system settings | Required | Admin/Super Admin | UC-039 |
| PATCH | `/api/v1/admin/system-settings/{key}` | Cập nhật setting | Required | Super Admin/Admin | UC-039 |
| POST | `/api/v1/admin/teachers/{teacherId}/offboarding` | Offboarding Teacher | Required | Admin | UC-040 |

## DevOps And Health APIs

| Method | Endpoint | Mô tả | Auth | Actor | Related UC |
| --- | --- | --- | --- | --- | --- |
| GET | `/health` | Health check public-safe | Public/Restricted | DevOps | UC-076 |
| GET | `/api/v1/system/health` | Health check chi tiết hơn nếu cần | Required | Admin/DevOps | UC-076 |
| GET | `/api/v1/system/version` | Xem app version/build metadata | Required/Public-safe | DevOps/Admin | UC-075 |

## Endpoint Design Notes

- Admin User Management phải dùng role-specific endpoints, không dùng một API tải tất cả users làm mặc định.
- Teacher Course Dashboard có endpoint riêng vì cần aggregate nhiều domain.
- Student To-do có endpoint riêng vì là màn hình quan trọng sau login.
- Question Media API phải optional: Question không có media vẫn hợp lệ.
- DevOps health endpoint không được expose secrets.
