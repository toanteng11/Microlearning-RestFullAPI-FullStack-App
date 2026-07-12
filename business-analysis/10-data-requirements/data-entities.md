# Data Entities

## Mục Đích

Tài liệu này liệt kê các entity dữ liệu chính của hệ thống **Microlearning Classroom LMS Platform**. Entity ở đây có thể tương ứng trực tiếp với MongoDB collection, embedded document, read model hoặc logical model phục vụ API/reporting.

## Entity Classification

| Loại entity | Ý nghĩa |
| --- | --- |
| Core Collection | Nên có collection riêng trong MongoDB |
| Embedded Document | Có thể embed trong document cha |
| Read Model | Dữ liệu tổng hợp để đọc nhanh, có thể rebuild |
| Logical Entity | Khái niệm nghiệp vụ, có thể triển khai bằng collection hoặc view/query |
| Policy/Configuration | Dữ liệu cấu hình ảnh hưởng hành vi hệ thống |

## Identity And Access Entities

| Entity | Loại | Mô tả | Priority |
| --- | --- | --- | --- |
| User | Core Collection | Account và profile của Student, Teacher, Admin, Super Admin | Must |
| Role | Core Collection | Vai trò như `STUDENT`, `TEACHER`, `ADMIN`, `SUPER_ADMIN` | Must |
| Permission | Core Collection / Config | Quyền chi tiết theo resource/action/scope | Must |
| UserSession | Core Collection | Session hoặc refresh token metadata nếu backend quản lý session | Should |
| PasswordResetToken | Core Collection | Token reset password dạng hash, one-time use | Should |

## Teacher Invitation Entities

| Entity | Loại | Mô tả | Priority |
| --- | --- | --- | --- |
| TeacherInvitation | Core Collection | Invitation do Admin tạo để Teacher tự kích hoạt account | Must |
| InvitationCopyEvent | Logical / AuditLog | Event Admin copy invitation link thủ công | Should |

## Admin Governance Entities

| Entity | Loại | Mô tả | Priority |
| --- | --- | --- | --- |
| EnrollmentPolicy | Policy/Configuration | Bật/tắt Class Code và Invite Link ở cấp hệ thống | Must |
| FileUploadPolicy | Policy/Configuration | Allowed file type, max size, upload provider | Should |
| NotificationPolicy | Policy/Configuration | Bật/tắt notification theo kênh và event | Should |
| SystemSetting | Policy/Configuration | App name, provider config, feature flags, security settings | Must |
| AuditLog | Core Collection | Log hành động quan trọng, append-only | Must |

## Classroom And Enrollment Entities

| Entity | Loại | Mô tả | Priority |
| --- | --- | --- | --- |
| Classroom | Core Collection | Lớp học do Teacher tạo, container chính của LMS | Must |
| Enrollment | Core Collection | Quan hệ Student tham gia Classroom; source chính của roster | Must |
| ClassroomMember | Logical Entity | Tên nghiệp vụ của Student trong roster, có thể map từ Enrollment | Must |
| ClassCode | Core Collection / Embedded | Mã lớp active hoặc lịch sử mã lớp | Must |
| ClassroomInviteLink | Core Collection | Link join Classroom bằng token | Must |

## Course And Content Entities

| Entity | Loại | Mô tả | Priority |
| --- | --- | --- | --- |
| Course | Core Collection | Khóa học microlearning nằm trong Classroom | Must |
| Module | Core Collection / Embedded | Module/Topic để nhóm nội dung trong Course | Must |
| Lesson | Core Collection | Micro Lesson, có content, status và completion deadline | Must |
| Flashcard | Core Collection / Embedded | Thẻ ôn tập nhanh trong Lesson/Module | Must |
| LearningResource | Core Collection | Tài liệu PDF, image, video URL, link, attachment | Should |
| Announcement | Core Collection | Thông báo Teacher đăng trong Class Stream | Must |
| Attachment | Embedded / Core Collection | Metadata file/link đính kèm cho resource, assignment, submission | Should |

## Quiz And Assessment Entities

| Entity | Loại | Mô tả | Priority |
| --- | --- | --- | --- |
| Quiz | Core Collection | Bài quiz, có setting như attempt limit, time limit, due date | Must |
| Question | Core Collection | Câu hỏi trong Quiz | Must |
| QuestionOption | Embedded Document | Đáp án lựa chọn cho single/multiple choice | Must |
| QuestionMedia | Core Collection / Embedded | Image/video optional gắn với Question | Should |
| QuizAttempt | Core Collection | Lần làm Quiz của Student | Must |
| QuizAnswer | Embedded / Core Collection | Câu trả lời trong một attempt | Must |

## Assignment, Submission And Grading Entities

| Entity | Loại | Mô tả | Priority |
| --- | --- | --- | --- |
| Assignment | Core Collection | Bài tập Teacher giao, có instruction, due date, max score | Must |
| Submission | Core Collection | Bài nộp của Student cho Assignment | Must |
| Grade | Core Collection / Embedded | Điểm của QuizAttempt hoặc Submission | Must |
| Feedback | Core Collection / Embedded | Nhận xét của Teacher cho Student | Must |
| PrivateComment | Core Collection | Trao đổi riêng trong Assignment nếu triển khai | Should |

## Learning Progress And Dashboard Entities

| Entity | Loại | Mô tả | Priority |
| --- | --- | --- | --- |
| LearningProgress | Core Collection | Tiến độ Student theo activity như Lesson/Quiz/Assignment/Resource | Must |
| CourseProgressSummary | Read Model | Summary theo Student/Course, phục vụ dashboard và ranking | Must |
| StudentTodoItem | Read Model / Logical | Việc cần làm tổng hợp cho Student Dashboard | Must |
| ActivityCompletionRule | Embedded / Config | Quy tắc hoàn thành activity | Should |

## Notification And Reporting Entities

| Entity | Loại | Mô tả | Priority |
| --- | --- | --- | --- |
| Notification | Core Collection | In-app notification cho announcement, deadline, feedback, submission | Should |
| ReportSnapshot | Read Model | Snapshot report phục vụ Admin Dashboard/Usage Reports | Should |
| AnalyticsEvent | Core Collection / Log | Event hoạt động như login, view lesson, submit quiz nếu cần analytics | Could |

## DevOps Supporting Entities

| Entity | Loại | Mô tả | Priority |
| --- | --- | --- | --- |
| DeploymentRecord | Log / Core Collection | Ghi nhận version deploy, environment, status | Could |
| HealthCheckRecord | Log / External monitoring | Lưu trạng thái health check nếu cần | Could |
| BackupRecord | Log / Core Collection | Ghi nhận backup time, scope, location metadata | Should |

## Entity Catalog Theo Collection Đề Xuất

| Collection | Entity chính | Ghi chú |
| --- | --- | --- |
| users | User | Email unique, role/status index |
| roles | Role | Có thể seed sẵn |
| permissions | Permission | Có thể seed sẵn hoặc config |
| user_sessions | UserSession | Optional nếu dùng stateless JWT thì có thể không cần |
| password_reset_tokens | PasswordResetToken | Lưu token hash, expiry |
| teacher_invitations | TeacherInvitation | Manual copy link |
| system_settings | EnrollmentPolicy, FileUploadPolicy, NotificationPolicy, SystemSetting | Có thể tách collection nếu lớn |
| classrooms | Classroom | Owner Teacher |
| enrollments | Enrollment/ClassroomMember | Source chính cho roster |
| class_codes | ClassCode | Active code và lịch sử regenerate |
| classroom_invite_links | ClassroomInviteLink | Token join link |
| courses | Course | Thuộc Classroom |
| modules | Module | Thuộc Course |
| lessons | Lesson | Thuộc Course/Module |
| flashcards | Flashcard | Thuộc Lesson/Module |
| learning_resources | LearningResource | Metadata file/link |
| announcements | Announcement | Class Stream |
| quizzes | Quiz | Thuộc Course/Module/Lesson |
| questions | Question | Thuộc Quiz |
| question_media | QuestionMedia | Optional media |
| quiz_attempts | QuizAttempt | Student attempts |
| assignments | Assignment | Thuộc Course/Module |
| submissions | Submission | Student submissions |
| grades | Grade | Điểm |
| feedback | Feedback | Nhận xét |
| private_comments | PrivateComment | Optional |
| learning_progress | LearningProgress | Progress theo activity |
| course_progress_summaries | CourseProgressSummary | Read model |
| student_todo_items | StudentTodoItem | Optional read model |
| notifications | Notification | In-app notification |
| report_snapshots | ReportSnapshot | Optional read model |
| audit_logs | AuditLog | Append-only |
| deployment_records | DeploymentRecord | Optional DevOps |
| backup_records | BackupRecord | Optional DevOps |

## Notes

- `ClassroomMember` là tên nghiệp vụ dễ hiểu cho Teacher roster; implementation nên dùng `Enrollment` để tránh duplicate.
- `StudentTodoItem` và `CourseProgressSummary` có thể được tạo bằng aggregation ở MVP, sau đó materialize thành collection nếu dữ liệu lớn.
- `Role` và `Permission` có thể seed bằng script thay vì cho Admin chỉnh trực tiếp trong MVP.
