# Product Vision

## Mục Đích

Tài liệu này mô tả tầm nhìn sản phẩm cho **Microlearning Classroom LMS Platform**. Đây là cơ sở định hướng cho các quyết định về scope, requirement, UX, architecture, API, DevOps và roadmap.

Product Vision giúp các bên liên quan trả lời các câu hỏi cốt lõi:

- Sản phẩm đang giải quyết vấn đề gì?
- Sản phẩm phục vụ ai?
- Giá trị khác biệt của sản phẩm là gì?
- MVP cần chứng minh điều gì?
- Các quyết định thiết kế sản phẩm nên đi theo nguyên tắc nào?

## Executive Summary

**Microlearning Classroom LMS Platform** là một nền tảng LMS nội bộ giúp **Teacher** tổ chức Classroom, tạo nội dung học ngắn, giao Quiz/Assignment, theo dõi Progress và phản hồi cho **Student**. Student có thể tham gia Classroom bằng **Class Code**, **Invite Link**, sau đó học Micro Lesson, làm Flashcard, làm Quiz, nộp Assignment và xem Grade/Feedback.

Sản phẩm tham khảo workflow quen thuộc của Google Classroom ở mức nghiệp vụ như Classroom, Stream, Classwork, People/Roster, Submission, Grading và Feedback. Tuy nhiên, sản phẩm không phải bản sao Google Classroom. Điểm khác biệt chính là tập trung vào **microlearning**, **RESTful API-first architecture**, **Swagger/OpenAPI documentation**, **Docker**, **CI/CD** và **Cloud deployment**.

## Vision Statement

Xây dựng một nền tảng **Microlearning Classroom LMS** chuyên nghiệp, giúp Teacher tạo và vận hành lớp học số một cách rõ ràng, giúp Student học nội dung ngắn dễ hoàn thành, và giúp Admin quản trị hệ thống an toàn, có thể đo lường, có thể mở rộng trên Cloud.

## Product Vision Board

| Thành phần | Nội dung |
| --- | --- |
| Target Users | Student, Teacher, Admin, Super Admin |
| Problem | Hoạt động dạy học nội bộ bị phân tán, khó theo dõi tiến độ, khó quản lý bài nộp và thiếu dashboard vận hành |
| Product | Web-based Microlearning Classroom LMS Platform |
| Value | Tập trung Classroom, Classwork, Progress, Grade, Feedback và Administration trong một hệ thống |
| Differentiator | Microlearning-first, Classroom workflow, API-first, cloud-ready, DevOps-ready |
| Success | Teacher tạo lớp và nội dung dễ dàng; Student join và học thuận lợi; Admin quản lý được users, roles, reports và audit log |

## Tuyên Bố Giá Trị

### Giá Trị Cho Student

Student có một nơi duy nhất để:

- Tham gia Classroom bằng Class Code hoặc Invite Link.
- Xem danh sách Classroom đã tham gia.
- Xem Class Stream và Announcement.
- Học Micro Lesson theo Module/Topic.
- Làm Flashcard, Quiz và Assignment.
- Theo dõi Progress, Grade, Feedback và Deadline.
- Tránh bỏ sót bài học, bài nộp hoặc thông báo quan trọng.

### Giá Trị Cho Teacher

Teacher có công cụ để:

- Tạo Classroom và quản lý roster.
- Mời Student tham gia bằng Class Code hoặc Invite Link.
- Tạo Module, Lesson, Flashcard, Quiz, Assignment và Resource.
- Đăng Announcement trong Class Stream.
- Xem Submission, chấm điểm và gửi Feedback.
- Theo dõi Progress từng Student trong Classroom.
- Phát hiện Student cần hỗ trợ dựa trên progress, quiz score, missing work và last active.

### Giá Trị Cho Admin

Admin có khả năng:

- Quản lý Teacher, Student và account status.
- Tạo và copy Teacher invitation link để Admin tự gửi thủ công cho Teacher.
- Quản lý Role và Permission theo RBAC.
- Quản lý Enrollment Policy ở cấp hệ thống.
- Giám sát Classroom/Course governance.
- Xem Admin Dashboard, Usage Report và AuditLog.
- Quản lý cấu hình nền tảng ở mức phù hợp.
- Hỗ trợ offboarding Teacher mà không làm mất dữ liệu học tập.

### Giá Trị Cho Đội Kỹ Thuật

Đội kỹ thuật có một nền tảng:

- Có RESTful API contract rõ ràng.
- Có Swagger/OpenAPI để frontend, backend và QA cùng làm việc.
- Có MongoDB data model phù hợp với Classroom, Course, Lesson, Quiz, Assignment, Submission, Progress và AuditLog.
- Có Docker/Docker Compose cho local development.
- Có CI/CD pipeline cho build, test và deployment.
- Có khả năng triển khai Cloud và mở rộng sau MVP.

## Product Pillars

| Pillar | Ý nghĩa | Biểu hiện trong sản phẩm |
| --- | --- | --- |
| Classroom-first | Classroom là trung tâm tổ chức dạy học | Teacher tạo Classroom, Student join Classroom, mọi content gắn với Classroom |
| Microlearning-first | Nội dung học ngắn, rõ mục tiêu, dễ hoàn thành | Lesson ngắn, Flashcard, Mini Quiz, Progress theo Lesson |
| Measurable learning | Việc học phải đo được | Completion, Quiz Score, Submission Status, Grade, Feedback |
| Role-based operation | Mỗi role có quyền và workflow riêng | Student học, Teacher giảng dạy, Admin quản trị |
| API-first | Frontend và backend giao tiếp qua API rõ ràng | RESTful API, Swagger/OpenAPI, versioning, error standard |
| Cloud-ready | Hệ thống có thể triển khai và vận hành trên Cloud | Docker, CI/CD, environment config, monitoring foundation |
| Governance-ready | Hệ thống có khả năng kiểm soát và audit | RBAC, AuditLog, Admin Dashboard, System Settings |

## Product Principles

| Nguyên tắc | Diễn giải |
| --- | --- |
| Đơn giản cho Student | Student phải join Classroom và bắt đầu học nhanh, không bị quá tải bởi thao tác quản trị |
| Hiệu quả cho Teacher | Teacher cần tạo nội dung, giao bài, chấm bài và xem progress với ít thao tác nhất có thể |
| Minh bạch về tiến độ | Student và Teacher đều cần nhìn thấy trạng thái học tập rõ ràng |
| Kiểm soát truy cập chặt chẽ | Student chỉ thấy Classroom và content mà mình được phép truy cập |
| Không sao chép Google Classroom | Chỉ tham khảo workflow nghiệp vụ, không sao chép thương hiệu, UI hoặc wording độc quyền |
| MVP trước, mở rộng sau | Ưu tiên workflow cốt lõi trước các tính năng nâng cao như AI, SIS, guardian hoặc marketplace |
| Documentation-first | Requirement, API, data model và test scenarios phải đủ rõ để development và QA triển khai |

## Core Product Workflow

```text
Admin tạo Teacher invitation link và gửi thủ công
        ↓
Teacher kích hoạt account
        ↓
Teacher tạo Classroom
        ↓
System sinh Class Code / Invite Link
        ↓
Student tham gia Classroom
        ↓
Teacher tạo Module / Lesson / Flashcard / Quiz / Assignment
        ↓
Student học, làm quiz, nộp assignment
        ↓
System ghi nhận Progress / Submission / Grade
        ↓
Teacher xem dashboard, chấm điểm và feedback
        ↓
Admin xem reports, audit log và vận hành hệ thống
```

## Product Scope Trong Vision

### In Vision

- Web application cho Student, Teacher và Admin.
- Classroom workflow dựa trên Teacher-led learning.
- Join Classroom bằng Class Code và Invite Link.
- Class Stream cho Announcement.
- Classwork cho Micro Lesson, Flashcard, Quiz, Assignment và Resource.
- Assignment Submission, Grading và Feedback.
- Student Progress và Teacher Progress Dashboard.
- Admin user management, role management, reports và audit log.
- RESTful API với Swagger/OpenAPI.
- Docker, CI/CD và Cloud deployment.

### Out Of Vision Cho MVP

- Native mobile app.
- Payment, billing hoặc course marketplace.
- Full Google Workspace integration.
- SIS integration.
- Live video meeting tích hợp sâu.
- AI recommendation hoặc AI grading.
- Guardian management.
- Advanced plagiarism/originality report.
- Multi-tenant commercial SaaS billing.

## MVP Vision

MVP cần chứng minh rằng hệ thống có thể hoàn thành vòng đời học tập số cơ bản:

1. Admin tạo invitation link, copy link và gửi thủ công cho Teacher.
2. Teacher tự kích hoạt account và login.
3. Teacher tạo Classroom.
4. Student join Classroom bằng Class Code hoặc Invite Link.
5. Teacher tạo Micro Lesson, Flashcard, Quiz, Assignment và Resource.
6. Student học Lesson, làm Quiz và nộp Assignment.
7. Teacher xem Submission, chấm điểm và Feedback.
8. Student xem Progress, Grade và Feedback.
9. Admin xem dashboard, quản lý users/roles và audit log.
10. Hệ thống có API documentation và deployment pipeline cơ bản.

## Long-term Product Vision

Sau MVP, sản phẩm có thể phát triển thành nền tảng LMS nội bộ hoàn chỉnh hơn:

- Advanced Gradebook.
- Learning Analytics theo Classroom, Course, Teacher và Student.
- Content Template và Reuse Content.
- Co-teacher Management.
- Advanced Notification.
- Organization Unit hoặc Department Management.
- Integration với storage, email, video, meeting hoặc SIS.
- AI-assisted content suggestion hoặc learning recommendation.
- Mobile experience hoặc Progressive Web App.
- Advanced audit, monitoring và reporting.

## Vision Success Criteria

| Nhóm tiêu chí | Dấu hiệu thành công |
| --- | --- |
| Student success | Student join Classroom dễ dàng, nhìn thấy bài cần học và biết tiến độ của mình |
| Teacher success | Teacher tạo Classroom, content, quiz, assignment và xem progress từng Student |
| Admin success | Admin quản lý user, role, policy, report và audit log ở mức vận hành được |
| Product success | Workflow Classroom -> Classwork -> Submission -> Grade -> Progress hoạt động liền mạch |
| Technical success | API có Swagger, hệ thống chạy bằng Docker, có CI/CD và deploy được lên Cloud |
| BA success | Requirements trace được sang user stories, use cases, data, API, UI và test scenarios |

## Vision Risks

| Risk | Tác động | Hướng kiểm soát |
| --- | --- | --- |
| Scope quá rộng | MVP bị kéo dài và khó hoàn thành | Ưu tiên Must-have, đưa advanced features vào Post-MVP |
| Sao chép Google Classroom quá sát | Dễ mất bản sắc sản phẩm và rủi ro về brand/UI | Chỉ tham khảo workflow, thiết kế identity riêng |
| Progress tracking không đủ rõ | Sản phẩm mất giá trị microlearning | Thiết kế Progress, Quiz Attempt, Submission và Grade ngay từ MVP |
| Admin quá phức tạp | Tốn nhiều công xây dựng policy | Chọn Admin core: users, roles, reports, audit log, basic settings |
| API thiếu chuẩn | Frontend/backend khó tích hợp | Swagger/OpenAPI, error standard, versioning và auth rõ từ đầu |

## Kết Luận

Tầm nhìn của **Microlearning Classroom LMS Platform** là xây dựng một sản phẩm học tập nội bộ gọn, rõ, đo được và vận hành được. Sản phẩm giữ tinh thần workflow lớp học quen thuộc nhưng đặt trọng tâm vào microlearning, progress tracking, RESTful API, DevOps và Cloud readiness.

Nếu được triển khai đúng vision, hệ thống sẽ không chỉ là nơi đăng bài học, mà là một nền tảng giúp Teacher dẫn dắt quá trình học, Student biết mình cần làm gì, và Admin kiểm soát được toàn bộ hoạt động vận hành.
