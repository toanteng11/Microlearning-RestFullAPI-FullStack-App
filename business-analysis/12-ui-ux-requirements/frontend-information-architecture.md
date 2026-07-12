# Frontend Information Architecture

## Mục Đích

Tài liệu này mô tả cấu trúc thông tin và route architecture cho ReactJS application. Mục tiêu là giúp Frontend Developer thiết kế routing, layout shell, role guard và navigation theo đúng nghiệp vụ.

## App Shell Tổng Quan

ReactJS application nên được chia thành 4 shell chính:

| App shell | Dành cho | Mô tả |
| --- | --- | --- |
| Public Shell | Guest | Các màn hình không yêu cầu login như Login, Register, Forgot Password, Reset Password, Teacher Invite Accept. |
| Student Shell | Student | Workspace học tập, gồm dashboard, To-do, classroom, lesson, quiz, assignment, progress và grade. |
| Teacher Shell | Teacher | Workspace giảng dạy, gồm dashboard, classroom/course management, content editor, roster, gradebook và analytics. |
| Admin Shell | Admin, Super Admin | Workspace vận hành hệ thống, gồm user management, teacher invitation, policies, audit, reports và system settings. |

## Route Groups Đề Xuất

### Public Routes

| Route | Screen | Ghi chú |
| --- | --- | --- |
| `/login` | Login | Redirect theo role sau khi login thành công. |
| `/register` | Student Register | Guest tự đăng ký account `STUDENT`; thành công chuyển đến Login. |
| `/forgot-password` | Forgot Password | Gửi yêu cầu reset password. |
| `/reset-password` | Reset Password | Đặt mật khẩu mới bằng token hợp lệ. |
| `/teacher/invite` | Teacher Invitation Accept | Teacher mở link mời, nhập thông tin và tự tạo mật khẩu. |
| `/join/invite/:token` | Invite Link Join Landing | Student mở link tham gia Classroom/Course. |
| `/join/code` | Join By Code | Student nhập Class Code. |

### Student Routes

| Route | Screen | Ghi chú |
| --- | --- | --- |
| `/student/dashboard` | Student Dashboard | Màn hình đầu tiên sau login của Student. |
| `/student/todo` | Student To-do | Danh sách việc cần làm từ tất cả Classroom. |
| `/student/classrooms` | Student Classroom List | Danh sách Classroom đã tham gia. |
| `/student/classrooms/:classroomId` | Student Classroom Detail | Tổng quan Classroom, stream/classwork/material. |
| `/student/classrooms/:classroomId/classwork` | Student Classwork | Danh sách Lesson, Quiz, Assignment, Material. |
| `/student/lessons/:lessonId` | Lesson Player | Học micro lesson. |
| `/student/quizzes/:quizId` | Quiz Attempt | Làm quiz. |
| `/student/assignments/:assignmentId` | Assignment Detail | Xem yêu cầu và nộp bài. |
| `/student/progress` | Student Progress | Tiến độ cá nhân. |
| `/student/grades` | Student Grades | Điểm và feedback. |
| `/student/calendar` | Student Deadline Calendar | Deadline theo ngày/tuần/tháng. |

### Teacher Routes

| Route | Screen | Ghi chú |
| --- | --- | --- |
| `/teacher/dashboard` | Teacher Dashboard | Màn hình đầu tiên sau login của Teacher. |
| `/teacher/classrooms/new` | Create Classroom | Tạo Classroom mới. |
| `/teacher/classrooms/:classroomId` | Teacher Classroom Detail | Stream, Classwork, People, Grades. |
| `/teacher/classrooms/:classroomId/settings` | Classroom Settings | Tên, mô tả, policy tham gia, archive. |
| `/teacher/classrooms/:classroomId/roster` | Classroom Roster | Danh sách Student tham gia. |
| `/teacher/courses/new` | Create Course | Tạo Course/Microlearning sequence. |
| `/teacher/courses/:courseId/dashboard` | Teacher Course Detail Dashboard | Xem bài học, deadline, Student progress ranking. |
| `/teacher/courses/:courseId/content` | Course Content Management | Quản lý Lesson/Quiz/Assignment. |
| `/teacher/lessons/:lessonId/editor` | Micro Lesson Editor | Tạo/sửa lesson. |
| `/teacher/quizzes/:quizId/builder` | Quiz Builder | Tạo/sửa quiz và media trong câu hỏi. |
| `/teacher/assignments/:assignmentId/editor` | Assignment Editor | Tạo/sửa assignment. |
| `/teacher/submissions/:assignmentId` | Submission Management | Chấm bài và feedback. |
| `/teacher/gradebook` | Teacher Gradebook | Bảng điểm theo Classroom/Course. |
| `/teacher/progress-analytics` | Teacher Progress Analytics | Phân tích tiến độ học sinh. |

### Admin Routes

| Route | Screen | Ghi chú |
| --- | --- | --- |
| `/admin/dashboard` | Admin Dashboard | Tổng quan vận hành. |
| `/admin/users` | User Management Entry | Màn hình điều hướng đến từng danh sách user. |
| `/admin/users/students` | Admin Student List | Danh sách riêng Student. |
| `/admin/users/teachers` | Admin Teacher List | Danh sách riêng Teacher. |
| `/admin/users/admins` | Admin Admin List | Danh sách riêng Admin/Super Admin. |
| `/admin/users/search` | Advanced User Search | Tìm kiếm user nâng cao. |
| `/admin/teacher-invitations` | Teacher Invitation Management | Tạo, copy, revoke, theo dõi invitation link. |
| `/admin/roles` | Role And Permission Management | Quản lý role/permission nếu được phép. |
| `/admin/classroom-governance` | Classroom Governance | Giám sát Classroom/Course toàn hệ thống. |
| `/admin/settings/enrollment` | Enrollment Policy Settings | Cấu hình policy join bằng Code/Link. |
| `/admin/settings/uploads` | File Upload Policy Settings | Cấu hình loại file, dung lượng, media policy. |
| `/admin/settings/notifications` | Notification Settings | Cấu hình notification system. |
| `/admin/audit-logs` | Audit Log | Tra cứu hành động quan trọng. |
| `/admin/reports` | Usage Reports | Báo cáo sử dụng hệ thống. |
| `/admin/system` | System Configuration | Cấu hình hệ thống, chỉ Super Admin nếu có. |

### Shared Authenticated Routes

| Route | Screen | Ghi chú |
| --- | --- | --- |
| `/profile` | Profile | Xem và cập nhật thông tin cá nhân. |
| `/notifications` | Notifications | Thông báo học tập/vận hành. |
| `/forbidden` | Forbidden | Không có quyền truy cập. |
| `/not-found` | Not Found | Route hoặc entity không tồn tại. |

## Role Guard Rules

| Rule ID | Nội dung |
| --- | --- |
| IA-RG-001 | User chưa login chỉ được vào Public Routes. |
| IA-RG-002 | User đã login không nên quay lại `/login`, trừ khi logout hoặc token hết hạn. |
| IA-RG-003 | Student không được truy cập route bắt đầu bằng `/teacher` hoặc `/admin`. |
| IA-RG-004 | Teacher không được truy cập `/admin`, trừ khi có role Admin riêng. |
| IA-RG-005 | Admin không mặc định có quyền vào Teacher workspace nếu không có role Teacher. |
| IA-RG-006 | Super Admin có thể có quyền mở rộng, nhưng UI vẫn phải kiểm tra permission từ backend. |
| IA-RG-007 | Route guard chỉ là bảo vệ trải nghiệm; Backend API vẫn phải kiểm tra authorization. |
| IA-RG-008 | Khi bị từ chối quyền, redirect đến `/forbidden` và hiển thị nút quay về dashboard role hiện tại. |

## Redirect Sau Login

| Role chính | Redirect mặc định |
| --- | --- |
| Student | `/student/dashboard` |
| Teacher | `/teacher/dashboard` |
| Admin | `/admin/dashboard` |
| Super Admin | `/admin/dashboard` |

Nếu user có nhiều role, hệ thống nên dùng `defaultRole` từ backend hoặc cho user chọn workspace sau login.

## Navigation Structure

### Student Navigation

- Dashboard
- To-do
- Classrooms
- Calendar
- Progress
- Grades
- Notifications
- Profile

### Teacher Navigation

- Dashboard
- Classrooms
- Courses
- Gradebook
- Progress Analytics
- Submissions
- Resources
- Notifications
- Profile

### Admin Navigation

- Dashboard
- User Management
- Teacher Invitations
- Roles & Permissions
- Classroom Governance
- Audit Logs
- Reports
- System Settings

## Layout Requirements

| Layout area | Yêu cầu |
| --- | --- |
| Header | Hiển thị logo/app name, current workspace, notification, user menu. |
| Sidebar/Desktop navigation | Hiển thị menu theo role, active route rõ ràng. |
| Mobile navigation | Dùng drawer hoặc bottom navigation tùy role; không làm mất action chính. |
| Content area | Có page title, breadcrumb nếu màn hình sâu, loading/empty/error state. |
| Footer/Build info | Có thể hiển thị app version/environment ở môi trường staging/internal. |

## Breadcrumb Rules

Breadcrumb nên dùng cho màn hình có từ 2 cấp trở lên:

```text
Dashboard > Classroom > Classwork > Lesson
Teacher Dashboard > Course > Quiz Builder
Admin Dashboard > User Management > Teacher List
```

Yêu cầu:

- Breadcrumb item cuối là màn hình hiện tại, không cần clickable.
- Breadcrumb không thay thế Back button ở màn hình editor hoặc player.
- Breadcrumb phải phản ánh route thực tế, không dùng label chung chung.

## Dev Implementation Notes

- Nên dùng một file route config trung tâm để định nghĩa `path`, `component`, `requiredRoles`, `layout`, `title`.
- Navigation menu nên sinh từ route/permission config để tránh lệch giữa UI và quyền.
- Frontend phải xử lý token expiration và refresh token theo API Requirements.
- Không lưu permission hard-code trong localStorage như nguồn tin cậy; chỉ dùng để render tạm, backend vẫn là nguồn xác thực.
