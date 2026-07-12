# Target Users

## Mục Đích

Tài liệu này xác định các nhóm người dùng mục tiêu của **Microlearning Classroom LMS Platform**, nhu cầu chính, pain points, mục tiêu sử dụng, hành vi kỳ vọng và giá trị sản phẩm mang lại cho từng nhóm.

## Tổng Quan Người Dùng

| User Group | Vai trò | Mức độ ưu tiên | Mục tiêu chính |
| --- | --- | --- | --- |
| Guest | Người chưa xác thực | Must | Login, register hoặc mở invitation/join link |
| Student | Người học | Must | Join Classroom, học Lesson, làm Quiz, nộp Assignment, xem Progress |
| Teacher | Giảng viên | Must | Tạo Classroom, tạo content, mời Student, chấm điểm, theo dõi Progress |
| Admin | Quản trị vận hành | Must | Quản lý users, roles, policies, reports, audit log |
| Super Admin | Quản trị cao nhất | Should | Quản lý system settings, admin permissions và cấu hình nhạy cảm |
| Developer / QA | Người dùng kỹ thuật | Should | Kiểm thử API, đọc Swagger/OpenAPI, xác minh requirement |
| DevOps Engineer | Người vận hành kỹ thuật | Should | Build, deploy, monitor và rollback hệ thống |

## Primary Users

Primary users là các role sử dụng sản phẩm trực tiếp để hoàn thành workflow dạy và học.

### Student

| Thuộc tính | Mô tả |
| --- | --- |
| Mục tiêu | Học nội dung được Teacher giao và hoàn thành yêu cầu của Classroom |
| Nhu cầu chính | Join Classroom nhanh, xem bài rõ ràng, làm Quiz, nộp Assignment, xem Progress/Grade/Feedback |
| Pain points hiện tại | Không biết tài liệu nằm ở đâu, deadline nào sắp đến, bài nào đã hoàn thành |
| Kỳ vọng UX | Giao diện dễ hiểu, ít bước, thấy ngay việc cần làm |
| Dữ liệu liên quan | Enrollment, Lesson Progress, Quiz Attempt, Submission, Grade, Feedback |

#### Student Jobs-to-be-Done

| ID | Job |
| --- | --- |
| JTBD-STU-001 | Khi nhận Class Code hoặc Invite Link từ Teacher, Student muốn join Classroom nhanh và đúng lớp |
| JTBD-STU-002 | Khi vào Classroom, Student muốn biết bài nào cần học và bài nào sắp deadline |
| JTBD-STU-003 | Khi học Micro Lesson, Student muốn nội dung ngắn, rõ và có kiểm tra nhanh |
| JTBD-STU-004 | Khi làm Quiz hoặc Assignment, Student muốn biết kết quả hoặc trạng thái nộp bài |
| JTBD-STU-005 | Khi Teacher feedback, Student muốn xem nhận xét và điểm một cách rõ ràng |

### Teacher

| Thuộc tính | Mô tả |
| --- | --- |
| Mục tiêu | Tổ chức lớp học, phân phối nội dung, đánh giá Student và hỗ trợ người học |
| Nhu cầu chính | Tạo Classroom, mời Student, tạo Module/Lesson/Quiz/Assignment, xem Submission, chấm điểm, feedback |
| Pain points hiện tại | Khó biết Student nào đã học, đã làm quiz, đã nộp bài hoặc cần hỗ trợ |
| Kỳ vọng UX | Dashboard rõ, thao tác tạo content nhanh, xem progress từng Student dễ |
| Dữ liệu liên quan | Classroom, Course, Module, Lesson, Quiz, Assignment, Submission, Grade, Progress |

#### Teacher Jobs-to-be-Done

| ID | Job |
| --- | --- |
| JTBD-TEA-001 | Khi bắt đầu lớp mới, Teacher muốn tạo Classroom và mời Student tham gia nhanh |
| JTBD-TEA-002 | Khi chuẩn bị bài, Teacher muốn tạo Micro Lesson, Flashcard và Quiz trong cùng luồng |
| JTBD-TEA-003 | Khi giao bài, Teacher muốn cài deadline, hướng dẫn và tiêu chí điểm rõ ràng |
| JTBD-TEA-004 | Khi lớp đang học, Teacher muốn biết ai đã học, ai chưa học, ai điểm thấp |
| JTBD-TEA-005 | Khi Student nộp bài, Teacher muốn chấm điểm và gửi Feedback riêng |

### Admin

| Thuộc tính | Mô tả |
| --- | --- |
| Mục tiêu | Vận hành hệ thống ổn định, bảo mật và có kiểm soát |
| Nhu cầu chính | Quản lý user, role, account status, policy, report, audit log và system settings |
| Pain points hiện tại | Thiếu dashboard quản trị, khó kiểm soát role, khó audit hành động quan trọng |
| Kỳ vọng UX | Bảng quản trị rõ ràng, có filter/search, có log, có export |
| Dữ liệu liên quan | User, Role, Invitation, Policy, AuditLog, Report, SystemSetting |

#### Admin Jobs-to-be-Done

| ID | Job |
| --- | --- |
| JTBD-ADM-001 | Khi có Teacher mới, Admin muốn tạo và copy invitation link để tự gửi thủ công cho Teacher |
| JTBD-ADM-002 | Khi user gặp sự cố, Admin muốn khóa, mở khóa hoặc cập nhật account status |
| JTBD-ADM-003 | Khi cần kiểm soát platform, Admin muốn quản lý role và permission |
| JTBD-ADM-004 | Khi cần đánh giá vận hành, Admin muốn xem usage reports và audit log |
| JTBD-ADM-005 | Khi Teacher nghỉ dạy, Admin muốn chuyển Classroom ownership mà không mất dữ liệu |

## Secondary Users

### Super Admin

Super Admin là role có quyền cao nhất trong hệ thống.

| Nhu cầu | Mô tả |
| --- | --- |
| Quản lý Admin permissions | Cấp/thu hồi quyền Admin |
| Quản lý system configuration | Cấu hình provider, security policy, feature flags |
| Kiểm soát audit và compliance | Đảm bảo mọi hành động nhạy cảm được log |
| Bảo vệ platform | Giới hạn quyền thay đổi cấu hình nhạy cảm |

### Developer / QA

| Nhu cầu | Mô tả |
| --- | --- |
| API contract rõ ràng | Swagger/OpenAPI mô tả endpoint, request/response và error |
| Requirement rõ ràng | Có user stories, use cases và acceptance criteria |
| Testability | Có test scenarios, validation rules và expected behavior |
| Traceability | Requirement trace được sang API, UI và test case |

### DevOps Engineer

| Nhu cầu | Mô tả |
| --- | --- |
| Environment rõ ràng | Local, development, staging, production |
| Dockerized setup | Frontend, backend, database chạy được bằng Docker/Docker Compose |
| CI/CD pipeline | Build, test, deploy tự động |
| Observability | Logging, monitoring và rollback strategy |

## User Needs Matrix

| Nhu cầu | Guest | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- |
| Login | Có | Có | Có | Có | Có |
| Accept invitation | Có | Tùy flow | Có | Không | Không |
| Join Classroom | Không | Có | Không | Không | Không |
| View Classwork | Không | Có | Có | Có | Có |
| Create Classroom | Không | Không | Có | Có | Có |
| Manage Classwork | Không | Không | Có | Tùy quyền | Tùy quyền |
| Submit Assignment | Không | Có | Không | Không | Không |
| Grade Submission | Không | Không | Có | Không | Không |
| View own Progress | Không | Có | Không | Không | Không |
| View Student Progress | Không | Không | Có | Có | Có |
| Manage Users | Không | Không | Không | Có | Có |
| Manage Roles | Không | Không | Không | Tùy quyền | Có |
| Manage System Settings | Không | Không | Không | Tùy quyền | Có |
| View AuditLog | Không | Không | Không | Có | Có |

## User Personas

### Persona 1: Student

| Thuộc tính | Nội dung |
| --- | --- |
| Tên đại diện | Student học nội bộ |
| Mục tiêu | Hoàn thành bài học và bài tập được giao |
| Hành vi | Dùng web app để xem bài, làm Quiz, nộp Assignment |
| Điều họ cần thấy đầu tiên | Classroom đã tham gia, việc cần làm, deadline và progress |
| Rủi ro UX | Quá nhiều menu, không biết bài nào cần làm trước |

### Persona 2: Teacher

| Thuộc tính | Nội dung |
| --- | --- |
| Tên đại diện | Teacher quản lý Classroom |
| Mục tiêu | Tổ chức nội dung học và theo dõi Student |
| Hành vi | Tạo lớp, đăng bài, chấm bài, xem dashboard |
| Điều họ cần thấy đầu tiên | Classroom sở hữu, số Student, classwork gần đây, progress cảnh báo |
| Rủi ro UX | Tạo content nhiều bước, dashboard không chỉ ra Student cần hỗ trợ |

### Persona 3: Admin

| Thuộc tính | Nội dung |
| --- | --- |
| Tên đại diện | Admin vận hành LMS |
| Mục tiêu | Quản lý nền tảng an toàn và ổn định |
| Hành vi | Tạo invitation, quản lý user, xem report, audit log |
| Điều họ cần thấy đầu tiên | Tổng user, account pending/blocked, active classrooms, recent activity |
| Rủi ro UX | Thiếu filter/search, thiếu audit trail, nhầm giữa Admin và Teacher permissions |

## Accessibility And Device Expectations

| Nhóm user | Thiết bị chính | Kỳ vọng |
| --- | --- | --- |
| Student | Laptop, tablet, mobile browser | Responsive, thao tác học nhanh, text dễ đọc |
| Teacher | Laptop, desktop | Dashboard rõ, bảng dữ liệu dễ quét, form tạo content hiệu quả |
| Admin | Desktop, laptop | Data table mạnh, filter/search, export, audit log |
| Developer / QA | Desktop | Swagger, error message rõ, API test được |

## Kết Luận

Sản phẩm có ba nhóm người dùng nghiệp vụ cốt lõi: **Student**, **Teacher** và **Admin**. Student cần trải nghiệm học dễ hiểu; Teacher cần công cụ giảng dạy và theo dõi tiến độ; Admin cần năng lực vận hành, kiểm soát và audit.

Tất cả quyết định về UX, data model, API và roadmap phải ưu tiên vòng giá trị chính:

```text
Teacher tạo Classroom và nội dung
        ↓
Student tham gia và học
        ↓
System ghi nhận dữ liệu học tập
        ↓
Teacher/Admin theo dõi, đánh giá và cải thiện vận hành
```
