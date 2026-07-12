# Data Requirements Overview

## Mục Đích

Tài liệu này là trang tổng quan cho mục **10 - Data Requirements** của dự án **Microlearning Classroom LMS Platform**. Mục tiêu là xác định hệ thống cần lưu dữ liệu gì, dữ liệu đó phục vụ use case nào, quan hệ giữa các entity ra sao, field nào bắt buộc, quy tắc validation là gì, dữ liệu nào nhạy cảm và MongoDB nên được thiết kế như thế nào để phù hợp với ReactJS, Node.js/ExpressJS, RESTful API, Swagger/OpenAPI, Docker, CI/CD và Cloud deployment.

## Phạm Vi Mục 10

| File | Nội dung |
| --- | --- |
| data-requirements-overview.md | Tổng quan data requirements và nguyên tắc thiết kế dữ liệu |
| data-entities.md | Danh mục entity/collection chính theo domain |
| data-relationship-map.md | Sơ đồ quan hệ dữ liệu cấp cao |
| data-dictionary.md | Data dictionary chi tiết cho field quan trọng |
| mongodb-data-model.md | Thiết kế MongoDB collections, references, embedding và indexes |
| data-validation-rules.md | Quy tắc validation dữ liệu đầu vào/đầu ra |
| data-retention-privacy.md | Quy tắc lưu giữ dữ liệu, privacy và bảo mật dữ liệu |
| invitation-token-data-model.md | Data model riêng cho Teacher invitation manual copy link |
| google-classroom-reference-data-model.md | Data model tham khảo từ workflow Google Classroom |

## Data Goals

| Goal | Mô tả |
| --- | --- |
| Support learning workflow | Lưu đầy đủ dữ liệu Student học Lesson, làm Quiz, nộp Assignment, nhận Grade/Feedback |
| Support Teacher workflow | Lưu Classroom, Course, Module, Lesson, Quiz, Assignment, Roster, Progress, Dashboard |
| Support Admin governance | Lưu User, Role, Permission, Policy, AuditLog, Reports, Teacher Invitation |
| Support RESTful API | Dữ liệu có cấu trúc rõ để API trả response nhất quán |
| Support MongoDB | Thiết kế collection, index và query phù hợp document database |
| Support DevOps | Có dữ liệu phục vụ health check, backup, rollback, audit và monitoring |

## Data Principles

| Nguyên tắc | Ý nghĩa |
| --- | --- |
| Single source of truth | Một dữ liệu nghiệp vụ quan trọng chỉ nên có một nơi lưu chính |
| Reference for ownership | Dùng `ObjectId` reference cho quan hệ ownership như User - Classroom - Course |
| Embed for small stable objects | Embed object nhỏ, ít thay đổi và thường đọc cùng document |
| Avoid client-side filtering for large data | Danh sách lớn phải filter/sort/paginate ở backend |
| Protect sensitive data | Không expose passwordHash, tokenHash, secrets, raw token |
| Audit important actions | Các hành động quản trị nhạy cảm phải có AuditLog |
| Soft delete important data | User/Classroom/Course quan trọng nên dùng status/archive thay vì hard delete |
| Query-driven design | MongoDB schema phải hỗ trợ các màn hình thật: Student To-do, Teacher Course Dashboard, Admin User Lists |

## Data Domains

| Domain | Entity chính |
| --- | --- |
| Identity & Access | User, Role, Permission, UserSession, PasswordResetToken |
| Teacher Invitation | TeacherInvitation |
| Admin Governance | EnrollmentPolicy, FileUploadPolicy, NotificationPolicy, SystemSetting, AuditLog |
| Classroom & Enrollment | Classroom, Enrollment, ClassCode, ClassroomInviteLink |
| Course & Content | Course, Module, Lesson, Flashcard, LearningResource, Announcement |
| Quiz & Assessment | Quiz, Question, QuestionOption, QuestionMedia, QuizAttempt, QuizAnswer |
| Assignment & Grading | Assignment, Submission, Grade, Feedback, PrivateComment, Attachment |
| Learning Progress | LearningProgress, CourseProgressSummary, StudentTodoItem |
| Notification & Reporting | Notification, ReportSnapshot, AnalyticsEvent |
| DevOps Supporting Data | DeploymentRecord, HealthCheckRecord, BackupRecord |

## Entity Ownership

| Entity | Owner nghiệp vụ | Owner kỹ thuật | Ghi chú |
| --- | --- | --- | --- |
| User | Admin | Backend | Quản lý account, role, status |
| TeacherInvitation | Admin | Backend | Manual copy link, không gửi email tự động trong MVP |
| Classroom | Teacher | Backend | Admin có governance view |
| Enrollment | Student/Teacher | Backend | Nguồn chính cho roster |
| Course | Teacher | Backend | Nằm trong Classroom |
| Lesson/Quiz/Assignment | Teacher | Backend | Learning activities |
| Submission | Student | Backend | Teacher chấm điểm |
| Grade/Feedback | Teacher | Backend | Student chỉ xem của mình |
| LearningProgress | System | Backend | Cập nhật từ Lesson/Quiz/Assignment |
| CourseProgressSummary | System | Backend | Read model phục vụ Teacher Course Dashboard |
| StudentTodoItem | System | Backend | Có thể là read model hoặc query aggregation |
| AuditLog | System/Admin | Backend | Append-only |

## Key Data Decisions

| Quyết định | Lý do |
| --- | --- |
| Dùng `enrollments` làm source chính cho Classroom roster | Tránh trùng dữ liệu giữa `ClassroomMember` và `Enrollment` |
| `StudentTodoItem` có thể là read model hoặc aggregation | Nếu query nhanh thì không cần lưu riêng; nếu hệ thống lớn thì materialize |
| `CourseProgressSummary` nên là read model | Teacher Course Dashboard cần sort `processScore DESC` nhanh |
| Không lưu raw invitation token | Chỉ lưu `tokenHash`, raw token chỉ nằm trong link Admin copy |
| Không lưu binary file trong MongoDB | Chỉ lưu metadata và URL/provider |
| AuditLog là append-only | Bảo đảm tính truy vết |
| Soft delete User/Classroom/Course | Bảo toàn Submission, Grade, Progress, AuditLog |

## Data Requirements Theo Use Case Chính

| Use Case | Dữ liệu cần có |
| --- | --- |
| Student join Classroom bằng Code/Link | User, Classroom, ClassCode/InviteLinkJoinToken, Enrollment |
| Student Dashboard To-do | Enrollment, Course, Lesson, Quiz, Assignment, Progress, Deadline |
| Student làm Quiz | Quiz, Question, QuestionOption, QuestionMedia, QuizAttempt, QuizAnswer, Grade |
| Student nộp Assignment | Assignment, Submission, Attachment, Grade, Feedback |
| Teacher Course Detail Dashboard | Course, Module, Lesson, Quiz, Assignment, Enrollment, CourseProgressSummary |
| Teacher Progress Ranking | LearningProgress, QuizAttempt, Submission, Grade, CourseProgressSummary |
| Admin Student List | User, Enrollment, status, lastActiveAt |
| Admin Teacher List | User, TeacherInvitation, Classroom/Course count, status |
| Admin Admin List | User, Role, Permission, status |
| Teacher Invitation Manual Copy | TeacherInvitation, AuditLog |
| Audit Log | Actor User, action, resourceType, resourceId, metadata |
| DevOps backup/rollback | Tất cả collection nghiệp vụ quan trọng |

## Data Quality Requirements

| Nhóm | Yêu cầu |
| --- | --- |
| Completeness | Field bắt buộc phải được validate trước khi lưu |
| Consistency | Status, role, activity type dùng enum thống nhất |
| Uniqueness | Email unique, active Class Code unique, invitation tokenHash unique |
| Integrity | Reference phải trỏ tới resource tồn tại và đúng quyền |
| Privacy | API không trả field nhạy cảm |
| Traceability | Action quan trọng có audit log |
| Performance | Query list lớn có index, pagination, filter, sort |
| Recoverability | Dữ liệu quan trọng nằm trong backup scope |

## Naming Convention

| Loại | Quy ước |
| --- | --- |
| Collection name | snake_case hoặc plural lowercase, ví dụ `users`, `teacher_invitations` |
| API field | camelCase, ví dụ `fullName`, `classroomId`, `createdAt` |
| MongoDB field | camelCase để map dễ với Node.js/ExpressJS |
| ID field | `_id` trong MongoDB, expose qua API là `id` |
| Date field | ISO date, suffix `At` hoặc `Date`, ví dụ `createdAt`, `submittedAt`, `dueDate` |
| Status field | Enum uppercase hoặc lowercase thống nhất theo implementation |

## Out Of Scope Data Cho MVP

| Dữ liệu | Lý do |
| --- | --- |
| Payment/Billing | Không thuộc LMS nội bộ |
| Guardian/Parent data | Không phải đối tượng chính |
| Native mobile device token nâng cao | MVP là web app |
| Google Classroom API sync data | Chỉ tham khảo workflow, không tích hợp |
| AI grading dataset | Chưa làm AI grading nâng cao |
| Plagiarism database | Cần service bên ngoài, để Post-MVP |
