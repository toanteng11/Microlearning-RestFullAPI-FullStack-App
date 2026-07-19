# API Authorization Matrix

## Mục Đích

Tài liệu này xác định quyền truy cập API theo role và object-level access. Đây là input quan trọng cho backend middleware, QA security test và Swagger documentation.

## Authorization Legend

| Ký hiệu | Ý nghĩa |
| --- | --- |
| Public | Không cần login |
| Own | User chỉ truy cập dữ liệu của chính mình |
| Enrolled | Student phải enroll Classroom liên quan |
| Owned | Teacher phải sở hữu Classroom/Course liên quan |
| Admin Permission | Admin phải có permission cụ thể |
| Super Admin | Chỉ Super Admin hoặc Admin có quyền nhạy cảm |

## Auth APIs

| Endpoint | Guest | Student | Teacher | Admin | Super Admin | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| `POST /auth/register` | Có | No | No | No | No | Public MVP; backend chỉ cho tạo role `STUDENT`, không tự tạo session/Enrollment |
| `POST /auth/login` | Có | Có | Có | Có | Có | Public endpoint |
| `POST /auth/logout` | No | Có | Có | Có | Có | Current session |
| `POST /auth/refresh-token` | No | Có | Có | Có | Có | Refresh token hợp lệ |
| `POST /auth/forgot-password` | Có | Có | Có | Có | Có | Không tiết lộ email tồn tại |
| `POST /auth/reset-password` | Có | Có | Có | Có | Có | Reset token hợp lệ |

## Student APIs

| Endpoint | Student | Teacher | Admin | Rule |
| --- | --- | --- | --- | --- |
| `GET /students/me/dashboard` | Own | No | No | Student chỉ xem dashboard của mình |
| `GET /students/me/todo` | Own | No | No | Student chỉ xem To-do của mình |
| `GET /students/me/progress` | Own | No | No | Student chỉ xem progress của mình |
| `GET /students/me/grades` | Own | No | No | Student chỉ xem grade/feedback của mình |
| `GET /students/me/deadlines` | Own | No | No | Chỉ deadline từ Classroom đã enroll |

## Classroom Join APIs

| Endpoint | Student | Teacher | Admin | Rule |
| --- | --- | --- | --- | --- |
| `POST /classrooms/join-by-code` | Có | No | No | Student active, policy cho phép |
| `POST /classrooms/invite-links/preview` | Public/Student | Public preview hạn chế | Public preview hạn chế | Token trong strict body; rate limit, `no-store`, không lộ dữ liệu riêng tư |
| `POST /classrooms/join-by-token` | Có | No | No | Student active, token hợp lệ |

## Teacher APIs

| Endpoint | Teacher | Admin | Rule |
| --- | --- | --- | --- |
| `POST /classrooms` | Có | No | Teacher active và policy cho phép |
| `PATCH /classrooms/{id}` | Owned | Governance only | Teacher owner |
| `DELETE /classrooms/{id}` | Owned | No mặc định | Owner Teacher archive mềm với reason và CAS; Admin governance action phải dùng route riêng nếu được duyệt |
| `GET /teacher/courses/{courseId}/dashboard` | Owned | Governance only | Teacher owner hoặc permission đặc biệt |
| `GET /teacher/courses/{courseId}/progress` | Owned | Governance only | Sort/processScore từ backend |
| `PATCH /teacher/lessons/{lessonId}/deadline` | Owned | No | Teacher owner Course; reason bắt buộc khi reset Lesson đã publish/assigned |
| `POST /quizzes` | Owned | No | Teacher owner Course |
| `POST /questions/{questionId}/media` | Owned | No | Teacher owner Quiz |
| `GET /teacher/assignments/{id}/submissions` | Owned | Governance only | Teacher owner Assignment |
| `PATCH /submissions/{id}/grade` | Owned | No mặc định | Teacher owner Assignment |

## Admin APIs

| Endpoint | Admin | Super Admin | Required Permission |
| --- | --- | --- | --- |
| `GET /admin/dashboard` | Có | Có | `admin.dashboard.view` |
| `GET /admin/users/students` | Có | Có | `user.view_students` |
| `GET /admin/users/teachers` | Có | Có | `user.view_teachers` |
| `GET /admin/users/admins` | Có giới hạn | Có | `user.view_admins` |
| `PATCH /admin/users/{id}/status` | Có | Có | `user.update_status` |
| `PATCH /admin/users/{id}/roles` | Giới hạn | Có | `role.assign_limited` hoặc `admin.full_access` |
| `POST /admin/teacher-invitations` | Có | Có | `teacher_invitation.create` |
| `POST /admin/teacher-invitations/{id}/revoke` | Có | Có | `teacher_invitation.revoke` |
| `PATCH /admin/settings/enrollment-policy` | Có | Có | `enrollment_policy.update` |
| `GET /admin/audit-logs` | Có | Có | `audit_log.view` |
| `GET /admin/reports/usage` | Có | Có | `report.view_all` |
| `GET /admin/system-settings` | Có giới hạn | Có | `system_setting.view` |
| `PATCH /admin/system-settings/{key}` | Có giới hạn | Có | `system_setting.update_sensitive` nếu sensitive |

## Resource Ownership Rules

| Resource | Check |
| --- | --- |
| Classroom | `classroom.ownerTeacherId == currentUser.id` hoặc Admin permission |
| Course | Course thuộc Classroom owned by Teacher |
| Module/Lesson/Quiz/Assignment | Thuộc Course mà Teacher có quyền |
| Submission | Thuộc Assignment trong Course/Classroom Teacher owned |
| QuizAttempt | Thuộc Quiz trong Course/Classroom Teacher owned |
| Student Progress | Student own hoặc Teacher owns Classroom hoặc Admin governance |
| Attachment/Media | User có quyền với parent resource |

## Dangerous Actions Requiring Audit

| API Action | Audit Required |
| --- | --- |
| Create/revoke Teacher Invitation | Must |
| Copy invitation link event | Should/Must nếu tracking bật |
| Accept Teacher Invitation | Must |
| Block/unblock/deactivate User | Must |
| Change role/permission | Must |
| Update Enrollment Policy | Must |
| Transfer Classroom Ownership | Must |
| Archive Classroom/Course | Should |
| Publish/unpublish content | Should |
| Return grade/feedback | Should |

## QA Authorization Checklist

- Student không gọi được Admin APIs.
- Student không xem được grade/submission của Student khác.
- Teacher không quản lý Classroom của Teacher khác.
- Teacher không gọi được Admin User List APIs.
- Admin thường không tự cấp Super Admin.
- Admin List API chỉ trả dữ liệu phù hợp permission.
- Blocked account không gọi được protected APIs.
- Object-level checks không chỉ dựa vào frontend route.
