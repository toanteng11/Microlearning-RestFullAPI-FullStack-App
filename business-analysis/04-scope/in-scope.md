# In Scope

## Mục Đích

Tài liệu này xác định các hạng mục nằm trong phạm vi của dự án **Microlearning Classroom LMS Platform**. Đây là cơ sở để Product Owner, Business Analyst, Technical Lead, QA Lead, Developers và DevOps thống nhất những gì cần được phân tích, thiết kế, phát triển, kiểm thử và triển khai trong MVP hoặc các phần scope đã được chấp thuận.

In Scope được hiểu là các chức năng, quy trình, dữ liệu, API, UI, yêu cầu kỹ thuật và hoạt động triển khai cần được xem xét trong BA documentation và có thể được đưa vào backlog phát triển theo mức độ ưu tiên.

## Scope Summary

Sản phẩm trong phạm vi là một **web-based Microlearning Classroom LMS Platform** phục vụ ba nhóm người dùng chính:

- **Student**: tham gia Classroom, học Micro Lesson, làm Flashcard/Quiz, nộp Assignment, xem Progress, Grade và Feedback.
- **Teacher**: tạo Classroom, tạo nội dung học tập, mời Student, giao bài, chấm điểm, feedback và theo dõi tiến độ.
- **Admin**: quản lý account, role, policy, reports, audit log và cấu hình vận hành cơ bản.

Hệ thống được xây dựng bằng **ReactJS**, **Node.js/ExpressJS**, **MongoDB**, có **RESTful API**, **Swagger/OpenAPI**, **Docker**, **CI/CD** và định hướng **Cloud deployment**.

## Product Scope

| Scope Area | Mô tả | Priority |
| --- | --- | --- |
| Microlearning Classroom LMS | Nền tảng học tập nội bộ lấy Classroom làm trung tâm | Must |
| Teacher-led Classroom | Teacher tạo và vận hành Classroom, Student tham gia lớp được chỉ định | Must |
| Microlearning Content | Nội dung học được chia thành Module, Micro Lesson, Flashcard, Quiz, Assignment và Resource | Must |
| Progress Tracking | Theo dõi completion, quiz score, submission status, grade và feedback | Must |
| Admin Governance | Admin quản lý user, role, invitation, policy, reports và audit log | Must |
| API-first Platform | Backend cung cấp RESTful API có Swagger/OpenAPI | Must |
| DevOps-ready Delivery | Docker, CI/CD và Cloud deployment foundation | Must |

## Functional Scope Theo Role

### Guest

| Feature | Mô tả | Priority |
| --- | --- | --- |
| Login | Guest có thể đăng nhập vào hệ thống | Must |
| Student Register | Guest tạo account `STUDENT`; registration không tạo session hoặc Enrollment | Must |
| Open Teacher Invitation Link | Teacher chưa kích hoạt có thể mở invitation link | Must |
| Open Classroom Join Link | Guest có thể mở link mời Classroom và được yêu cầu login/register nếu cần | Must |

### Student

| Feature | Mô tả | Priority |
| --- | --- | --- |
| Join Classroom by Class Code | Student nhập Class Code hợp lệ để tham gia Classroom | Must |
| Join Classroom by Invite Link | Student mở Invite Link hợp lệ để tham gia Classroom | Must |
| Student Dashboard | Hiển thị Classroom đã tham gia, To-do / Việc cần làm, thông báo và progress tổng quan | Must |
| Classroom List | Student xem danh sách Classroom đã tham gia | Must |
| Class Stream | Student xem Announcement và hoạt động mới trong Classroom | Must |
| Classwork | Student xem Module, Lesson, Flashcard, Quiz, Assignment và Resource | Must |
| Micro Lesson Learning | Student học nội dung ngắn được Teacher publish | Must |
| Flashcard Practice | Student học/ôn tập bằng Flashcard | Must |
| Quiz Attempt | Student làm Quiz và hệ thống ghi nhận attempt/score | Must |
| Assignment Submission | Student nộp Assignment bằng text, file hoặc link nếu được hỗ trợ | Must |
| Progress View | Student xem progress cá nhân theo Classroom/Course | Must |
| Grade and Feedback View | Student xem điểm và feedback sau khi Teacher return work | Must |
| To-do / Việc Cần Làm | Student xem Lesson, Quiz, Assignment hoặc Material chưa hoàn thành từ tất cả Classroom đã tham gia | Must |
| Deadline View | Student xem due date của Quiz/Assignment | Should |
| Navigation Controls | Student có Back, Previous, Next, breadcrumb hoặc return link ở các màn hình học tập chính | Must |
| Learning Resources | Student mở PDF, video, image, link hoặc tài liệu được Teacher chia sẻ | Should |

### Teacher

| Feature | Mô tả | Priority |
| --- | --- | --- |
| Teacher Account Activation | Teacher kích hoạt account bằng manual invitation link do Admin gửi thủ công | Must |
| Teacher Dashboard | Teacher xem Classroom, Student count, progress summary và alerts | Must |
| Teacher Course Detail Dashboard | Khi Teacher mở Course, hiển thị Lesson list, Student list, progress ranking và deadline | Must |
| Classroom Management | Teacher tạo, cập nhật, archive và quản lý Classroom | Must |
| Class Code Management | System sinh Class Code; Teacher xem/reset/bật/tắt theo policy | Must |
| Invite Link | Teacher tạo, xem, copy, disable hoặc regenerate link để Student join Classroom | Must |
| Student Roster Management | Teacher xem, tìm kiếm và remove Student khỏi Classroom nếu có quyền | Must |
| Announcement Management | Teacher đăng Announcement trong Class Stream | Must |
| Module / Topic Management | Teacher tạo, cập nhật, sắp xếp Module/Topic | Must |
| Micro Lesson Management | Teacher tạo, chỉnh sửa, publish/unpublish Micro Lesson | Must |
| Flashcard Management | Teacher tạo Flashcard trong Lesson/Module | Must |
| Quiz Management | Teacher tạo Quiz, câu hỏi, đáp án, điểm, attempt rule và media tùy chọn cho câu hỏi | Must |
| Assignment Management | Teacher tạo Assignment, cài instruction, due date, max score và attachment | Must |
| Resource Management | Teacher chia sẻ PDF, video, image, link hoặc tài liệu học tập | Should |
| Submission Review | Teacher xem Submission status theo Assignment | Must |
| Grading and Feedback | Teacher chấm điểm, gửi feedback và return work | Must |
| Teacher Progress Dashboard | Teacher xem progress từng Student, quiz score, assignment status và last active | Must |
| Course Student Progress Ranking | Teacher xem điểm quá trình của Student trong Course, mặc định sort cao xuống thấp | Must |
| Gradebook Basic | Teacher xem bảng điểm cơ bản theo Student/Quiz/Assignment | Should |
| Lesson Deadline Management | Teacher đặt deadline hoàn thành cho từng Lesson/Activity trong Course | Must |
| Deadline Management | Teacher cài due date và quản lý deadline | Should |

### Admin

| Feature | Mô tả | Priority |
| --- | --- | --- |
| Admin Dashboard | Admin xem tổng quan user, Classroom, Course, completion và activity | Must |
| User Account Management | Admin xem, tìm kiếm, lọc và cập nhật status Teacher/Student/Admin | Must |
| Teacher Invitation Management | Admin nhập email Teacher, tạo invitation link, copy link và gửi thủ công | Must |
| Manual Invitation Link | Delivery method mặc định là `MANUAL_COPY`; không bắt buộc system gửi email tự động | Must |
| Account Status Management | Admin quản lý `PENDING`, `ACTIVE`, `INACTIVE`, `BLOCKED`, `DELETED` | Must |
| Role and Permission Management | Admin/Super Admin quản lý role và permission theo RBAC | Must |
| Enrollment Policy Management | Admin bật/tắt Class Code và Invite Link ở cấp hệ thống | Must |
| Classroom / Course Governance | Admin xem tất cả Classroom/Course và owner Teacher | Must |
| Usage Reporting | Admin xem report cơ bản về user, Classroom, Course, completion | Must |
| AuditLog Management | Admin xem audit log của hành động quan trọng | Must |
| System Configuration Basic | Admin/Super Admin cấu hình một số setting nền tảng cơ bản | Must |
| File Upload Policy | Admin cấu hình loại file, dung lượng, upload provider | Should |
| Notification Configuration | Admin cấu hình in-app notification và email notification nếu Post-MVP cần | Should |
| Classroom Ownership Transfer | Admin chuyển Classroom sang Teacher active khác | Should |
| Teacher Offboarding | Admin xử lý Teacher nghỉ dạy mà không mất dữ liệu Classroom | Should |

## Business Process Scope

| Process | Mô tả | Priority |
| --- | --- | --- |
| Teacher Invitation Process | Admin tạo/copy invitation link, Teacher tự kích hoạt account | Must |
| Classroom Creation Process | Teacher tạo Classroom và system sinh join mechanisms | Must |
| Classroom Join Process | Student join bằng Class Code hoặc Invite Link | Must |
| Learning Process | Student học Lesson, làm Flashcard, Quiz và xem Progress | Must |
| Assignment Submission Process | Teacher giao bài, Student nộp bài, Teacher review | Must |
| Grading and Feedback Process | Teacher chấm điểm, feedback, return work; Student xem kết quả | Must |
| Progress Tracking Process | System ghi nhận completion, quiz score, submission status và grade | Must |
| Teacher Course Dashboard Process | Teacher mở Course để xem Lesson list, Student list, progress ranking và deadline | Must |
| Student To-do Process | System tổng hợp activity chưa hoàn thành để hiển thị trên Student Dashboard | Must |
| Admin Operation Process | Admin quản lý user, role, policy, report và audit log | Must |
| Teacher Offboarding Process | Admin transfer/archive Classroom trước khi khóa Teacher nếu cần | Should |

## Data Scope

Các entity dữ liệu chính nằm trong phạm vi:

| Entity | Mục đích | Priority |
| --- | --- | --- |
| User | Lưu Student, Teacher, Admin, Super Admin | Must |
| Role / Permission | Quản lý RBAC | Must |
| TeacherInvitation | Lưu invitation token hash, email, status, delivery method `MANUAL_COPY` | Must |
| Classroom | Không gian lớp học do Teacher tạo | Must |
| Enrollment | Quan hệ Student tham gia Classroom | Must |
| Course | Khóa học hoặc nội dung học trong Classroom | Must |
| Module / Topic | Nhóm nội dung học tập | Must |
| Lesson | Micro Lesson | Must |
| Flashcard | Thẻ học nhanh | Must |
| Quiz | Bài kiểm tra ngắn | Must |
| Question / Answer | Câu hỏi và đáp án Quiz | Must |
| QuestionMedia | Image/video tùy chọn gắn với Quiz Question | Should |
| Assignment | Bài tập Teacher giao | Must |
| Submission | Bài Student nộp | Must |
| Grade | Điểm Quiz/Assignment | Must |
| Feedback | Nhận xét Teacher gửi Student | Must |
| Progress | Completion, score, status và learning activity | Must |
| CourseProgressSummary | Dữ liệu tổng hợp điểm quá trình theo Student trong Course | Must |
| StudentTodoItem | Dữ liệu tổng hợp/read model cho To-do / Việc cần làm trên Student Dashboard | Must |
| Resource / Attachment | File, link, video, PDF, image | Should |
| Notification | In-app notification hoặc email notification nếu có | Should |
| AuditLog | Log hành động quan trọng | Must |
| SystemSetting | Cấu hình policy/system cơ bản | Must |

## API Scope

| API Group | Mô tả | Priority |
| --- | --- | --- |
| Auth API | Login, register, token/session, logout | Must |
| User API | Profile, user management, account status | Must |
| Teacher Invitation API | Create invitation, return link, accept, revoke, list | Must |
| Classroom API | CRUD Classroom, archive, settings | Must |
| Enrollment API | Join by code/link, roster management | Must |
| Course / Content API | Course, Module, Lesson, Flashcard, Resource | Must |
| Teacher Course Dashboard API | Course summary, Lesson list, Student list và progress ranking | Must |
| Quiz API | Quiz, question, question media, attempt, score | Must |
| Assignment API | Assignment CRUD, due date, publish | Must |
| Submission API | Submit, unsubmit/resubmit nếu áp dụng, view status | Must |
| Grade / Feedback API | Grade submission, return work, view feedback | Must |
| Progress API | Student progress, Teacher classroom progress | Must |
| Student Dashboard API | Dashboard summary, To-do list, deadline gần nhất và dữ liệu điều hướng tới activity | Must |
| Admin Report API | Admin dashboard và usage report cơ bản | Must |
| AuditLog API | Query audit logs theo actor/action/resource/date | Must |
| System Setting API | Enrollment policy, file policy, notification policy cơ bản | Should |
| Swagger/OpenAPI | Document toàn bộ endpoint MVP | Must |

## UI/UX Scope

| Screen / Page | Role | Priority |
| --- | --- | --- |
| Login Page | Guest/User | Must |
| Register Page | Guest | Should |
| Teacher Invitation Accept Page | Teacher | Must |
| Student Dashboard | Student | Must |
| Student To-do / Deadline View | Student | Must |
| Global Navigation Controls | Student/Teacher/Admin | Must |
| Classroom List Page | Student/Teacher/Admin | Must |
| Join Classroom Page | Student | Must |
| Classroom Detail Page | Student/Teacher | Must |
| Class Stream Page | Student/Teacher | Must |
| Classwork Page | Student/Teacher | Must |
| Lesson Player Page | Student | Must |
| Flashcard Practice Page | Student | Must |
| Quiz Page | Student | Must |
| Teacher Quiz Builder / Question Media | Teacher | Should |
| Assignment Detail / Submission Page | Student/Teacher | Must |
| Student Progress Page | Student | Must |
| Grade and Feedback Page | Student | Must |
| Teacher Dashboard | Teacher | Must |
| Teacher Course Detail Dashboard | Teacher | Must |
| Teacher Course/Classwork Management | Teacher | Must |
| Teacher Roster Page | Teacher | Must |
| Teacher Grading and Feedback Page | Teacher | Must |
| Teacher Progress Analytics Page | Teacher | Must |
| Admin Dashboard | Admin | Must |
| Admin User Management Page | Admin | Must |
| Admin Teacher Invitation Management Page | Admin | Must |
| Admin Role and Permission Page | Admin/Super Admin | Must |
| Admin Enrollment Policy Page | Admin | Must |
| Admin Audit Log Page | Admin | Must |
| Admin Usage Reports Page | Admin | Must |

## Technical Scope

| Technical Area | In Scope |
| --- | --- |
| Frontend | ReactJS web application, role-based routing, responsive UI, API integration |
| Backend | Node.js, ExpressJS, RESTful API, authentication, authorization, business logic |
| Database | MongoDB collections, indexes, validation rules, relationships by reference |
| API Documentation | Swagger/OpenAPI for MVP endpoints |
| Authentication | JWT/session approach, password hashing, protected routes |
| Authorization | RBAC for Student, Teacher, Admin, Super Admin |
| File Handling | Basic upload/link handling if selected in MVP; file policy defined |
| Logging | Application logs and AuditLog for critical actions |
| Error Handling | Standard error response schema |
| Pagination/Filtering | Required for list endpoints such as users, classrooms, submissions, audit logs |
| Docker | Dockerfile/Docker Compose for local development and deployment foundation |
| CI/CD | Build/test/deploy pipeline foundation |
| Cloud Deployment | Staging/demo deployment on selected Cloud provider |
| Monitoring Foundation | Basic health check, logs, uptime/performance foundation |

## Security And Governance Scope

| Security Area | Mô tả | Priority |
| --- | --- | --- |
| Password Hashing | Không lưu plain text password | Must |
| Teacher Invitation Token | Token one-time, expires, revoke, token hash only | Must |
| Manual Link Security | Link gửi thủ công nhưng vẫn kiểm soát bằng token, expiry, email matching | Must |
| RBAC | Role-based permissions cho Student/Teacher/Admin/Super Admin | Must |
| Account Status | `ACTIVE`, `BLOCKED`, `INACTIVE`, `PENDING`, `DELETED` | Must |
| AuditLog | Ghi log create invitation, copy link nếu có, accept, revoke, role change, account block | Must |
| Data Access Control | Student chỉ xem dữ liệu Classroom đã join; Teacher chỉ quản lý Classroom sở hữu | Must |
| Rate Limiting | Áp dụng cho auth và invitation accept nếu có thể | Should |
| Privacy | Không expose password, token raw, dữ liệu nhạy cảm trong logs | Must |

## Documentation Scope

| Documentation | Mô tả |
| --- | --- |
| BA Documentation | Toàn bộ thư mục `business-analysis/` |
| Product Vision | Vision, target users, positioning, roadmap context |
| Stakeholders | Stakeholder register, analysis, RACI, communication plan |
| Scope | In scope, out of scope, assumptions, constraints, dependencies, baseline, change control |
| Requirements | Business, functional, role-based reference, priority |
| User Stories / Use Cases | Student, Teacher, Admin, use case catalog |
| Data Requirements | Entity, dictionary, validation, MongoDB model |
| API Requirements | Endpoint catalog, auth, pagination, Swagger/OpenAPI |
| UI/UX Requirements | Pages, flows, wireframe index, accessibility |
| NFR | Security, performance, availability, maintainability, privacy, logging |
| DevOps | Docker, CI/CD, cloud deployment, rollback |
| UAT / Acceptance | Acceptance criteria, test scenarios, UAT plan |

## MVP In-Scope Definition

MVP phải hoàn thành tối thiểu vòng đời sau:

```text
Admin tạo/copy Teacher invitation link
        ↓
Teacher kích hoạt account
        ↓
Teacher tạo Classroom
        ↓
Student join Classroom bằng Code/Link
        ↓
Teacher tạo Classwork
        ↓
Student học, làm Quiz, nộp Assignment
        ↓
Teacher chấm điểm và Feedback
        ↓
Student xem Progress, Grade, Feedback
        ↓
Admin xem users, reports và AuditLog
```

## Kết Luận

Phạm vi trong dự án tập trung vào việc xây dựng một LMS nội bộ đủ hoàn chỉnh để thể hiện workflow dạy học thực tế, có quản trị hệ thống và có nền tảng kỹ thuật chuyên nghiệp. Các tính năng Must-have phải phục vụ trực tiếp cho vòng đời Classroom, Microlearning, Submission, Grading, Progress và Admin Governance.
