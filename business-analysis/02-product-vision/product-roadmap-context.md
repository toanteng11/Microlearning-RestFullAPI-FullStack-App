# Product Roadmap Context

## Mục Đích

Tài liệu này mô tả bối cảnh roadmap cho **Microlearning Classroom LMS Platform**, giúp Product Owner, Business Analyst, Technical Lead, QA Lead và DevOps Engineer thống nhất cách chia giai đoạn phát triển sản phẩm.

Roadmap trong tài liệu này không thay thế release plan chi tiết. Nó đóng vai trò định hướng cấp cao để biết tính năng nào cần làm ở MVP, tính năng nào nên để sau, và vì sao.

## Roadmap Principles

| Nguyên tắc | Diễn giải |
| --- | --- |
| MVP phải chứng minh workflow chính | Ưu tiên vòng đời Classroom -> Classwork -> Learning -> Submission -> Grade -> Progress |
| Mỗi release tạo giá trị rõ | Không chỉ thêm màn hình, mà phải hoàn thiện một workflow người dùng |
| Technical foundation đi cùng product feature | API, data model, auth, Swagger, Docker và CI/CD phải đi song song |
| Admin governance không bỏ qua | User, role, report và audit log cần có đủ để hệ thống vận hành được |
| Advanced features để sau | AI, SIS, guardian, marketplace, native mobile không nên kéo vào MVP |

## Roadmap Themes

| Theme | Nội dung |
| --- | --- |
| Classroom Foundation | Classroom, Roster, Join by Code/Link |
| Microlearning Content | Module, Micro Lesson, Flashcard, Quiz, Resource |
| Assessment Workflow | Assignment, Submission, Grade, Feedback |
| Progress Visibility | Student Progress, Teacher Dashboard, Gradebook cơ bản |
| Admin Governance | User Management, Role, Policy, Reports, AuditLog |
| API and DevOps Foundation | RESTful API, Swagger/OpenAPI, Docker, CI/CD, Cloud Deployment |
| Analytics and Optimization | Dashboard nâng cao, organization analytics, risk detection |
| Integration and Expansion | Storage, notification provider, meeting link, external systems, AI |

## MVP Release

### Mục Tiêu

MVP cần chứng minh hệ thống có thể vận hành workflow học tập cơ bản từ đầu đến cuối.

### MVP Scope

| Nhóm | Tính năng |
| --- | --- |
| Authentication | Register/Login, JWT/session, role-based access |
| Teacher Onboarding | Admin tạo/copy Teacher invitation link, Teacher tự kích hoạt account |
| Classroom | Teacher tạo, cập nhật, archive Classroom |
| Join Flow | Student join bằng Class Code hoặc Invite Link |
| Class Stream | Teacher đăng Announcement cơ bản |
| Classwork | Module, Micro Lesson, Flashcard, Quiz, Assignment, Resource |
| Submission | Student nộp Assignment bằng text/file/link |
| Grading | Teacher chấm điểm, Feedback, Return Work |
| Progress | Student xem progress cá nhân; Teacher xem progress từng Student |
| Admin | User management, role management, basic reports, audit log |
| API | RESTful API, Swagger/OpenAPI, error response standard |
| DevOps | Docker Compose, CI/CD pipeline cơ bản, Cloud deployment staging |

### MVP Exit Criteria

MVP được xem là đạt khi:

- Student join Classroom thành công bằng ít nhất Class Code và Invite Link.
- Teacher tạo được Classroom và Classwork.
- Student học được Lesson, làm Quiz và nộp Assignment.
- Teacher chấm điểm và gửi Feedback.
- Student xem được Progress, Grade và Feedback.
- Admin quản lý được users, roles, reports và audit log cơ bản.
- Swagger/OpenAPI mô tả đầy đủ endpoint MVP.
- Docker Compose chạy được hệ thống local.
- CI/CD deploy được môi trường staging hoặc cloud demo.

## Release 1: Classroom And Learning Experience

### Mục Tiêu

Hoàn thiện trải nghiệm Student và Teacher ở cấp Classroom.

### Candidate Features

| Feature | Giá trị |
| --- | --- |
| Student To-do List | Student thấy việc cần làm và deadline gần nhất |
| Learning Calendar | Hiển thị Assignment/Quiz deadline theo Classroom |
| Enhanced Class Stream | Comment, pin Announcement, schedule post |
| Better Classwork Organization | Drag/drop order, filter by Module/Topic |
| Lesson Completion Rules | Hoàn thành theo xem bài, quiz score hoặc manual mark |
| Resource Management | Quản lý PDF, video, image, link tốt hơn |

## Release 2: Assessment And Progress

### Mục Tiêu

Nâng cấp khả năng đánh giá, phản hồi và theo dõi kết quả học tập.

### Candidate Features

| Feature | Giá trị |
| --- | --- |
| Advanced Quiz Settings | Time limit, attempts, random question, random answer |
| Gradebook | Bảng điểm theo Student, Quiz, Assignment |
| Rubric Lite | Tiêu chí chấm điểm đơn giản |
| Missing/Late Work Report | Teacher thấy Student chưa nộp hoặc nộp trễ |
| Export Grades | Xuất CSV/Excel |
| Student Learning Profile | Tổng hợp tiến độ và điểm của một Student |

## Release 3: Admin Governance And Analytics

### Mục Tiêu

Tăng khả năng vận hành và kiểm soát hệ thống ở cấp Admin.

### Candidate Features

| Feature | Giá trị |
| --- | --- |
| Advanced Admin Dashboard | Báo cáo user, classroom, activity, completion |
| Organization Unit | Quản lý khoa, lớp hành chính hoặc chương trình |
| Enrollment Policy | Chính sách tham gia theo system/organization/classroom |
| Classroom Ownership Transfer | Bàn giao lớp khi Teacher nghỉ hoặc đổi lớp |
| Teacher Offboarding | Quy trình khóa/deactivate Teacher an toàn |
| AuditLog Export | Phục vụ kiểm tra và quản trị |
| System Health Page | Xem trạng thái API, DB, email, storage |

## Release 4: Integration And Scale

### Mục Tiêu

Mở rộng hệ thống để tích hợp và vận hành tốt hơn trong môi trường thật.

### Candidate Features

| Feature | Giá trị |
| --- | --- |
| Email Provider Integration | Gửi notification hoặc reset password tự động nếu Post-MVP cần |
| Cloud Storage Integration | Lưu file upload trên S3/Cloudinary hoặc provider tương đương |
| Meeting Link Management | Gắn link học online thủ công hoặc tích hợp provider |
| Monitoring And Alerting | Theo dõi uptime, error, performance |
| Performance Optimization | Pagination, indexing, caching nếu cần |
| Backup And Restore | Bảo vệ dữ liệu production |

## Release 5: Intelligence And Personalization

### Mục Tiêu

Bổ sung các tính năng thông minh sau khi dữ liệu học tập đủ ổn định.

### Candidate Features

| Feature | Giá trị |
| --- | --- |
| Learning Recommendation | Gợi ý bài học tiếp theo dựa trên progress |
| At-risk Student Detection | Cảnh báo Student có nguy cơ không hoàn thành |
| AI Content Suggestion | Hỗ trợ Teacher tạo quiz/flashcard từ lesson content |
| AI Feedback Draft | Gợi ý feedback nháp cho Teacher |
| Plagiarism / Similarity Check | Kiểm tra trùng lặp bài nộp nếu có provider |

## Roadmap Dependency Map

| Dependency | Ảnh hưởng |
| --- | --- |
| Auth and RBAC | Nền tảng cho mọi role và permission |
| Classroom data model | Nền tảng cho Course, Enrollment, Classwork và Progress |
| Submission model | Cần trước Grading, Feedback, Gradebook |
| Progress model | Cần trước Teacher Dashboard và Analytics |
| AuditLog | Cần cho Admin governance và security |
| Swagger/OpenAPI | Cần cho frontend, QA và API testing |
| Docker/CI-CD | Cần cho deployment và demo chuyên nghiệp |

## Out-of-Roadmap For Early Releases

Các nhóm sau không nên đưa vào MVP hoặc release sớm:

- Native mobile app.
- Payment hoặc course marketplace.
- Full SIS integration.
- Full Google Workspace integration.
- Guardian management.
- Enterprise multi-tenant billing.
- Complex certification engine.
- Full plagiarism engine tự xây.

## Roadmap Decision Criteria

Khi quyết định một feature có nên đưa vào release hay không, dùng các câu hỏi:

1. Feature có hỗ trợ workflow chính của Student, Teacher hoặc Admin không?
2. Feature có làm tăng khả năng đo lường Progress, Grade hoặc Completion không?
3. Feature có cần để vận hành hệ thống an toàn không?
4. Feature có phụ thuộc vào data model hoặc API chưa sẵn sàng không?
5. Feature có làm MVP quá rộng không?
6. Feature có thể để Post-MVP mà không phá vỡ trải nghiệm chính không?

## Kết Luận

Roadmap của sản phẩm nên đi từ workflow dạy học cốt lõi đến vận hành, sau đó mới đến tích hợp và AI. MVP không cần quá nhiều tính năng, nhưng phải hoàn thành thật chắc vòng đời:

```text
Create Classroom -> Join Classroom -> Create Classwork -> Learn -> Submit -> Grade -> Track Progress -> Admin Monitor
```

Nếu roadmap giữ được thứ tự này, sản phẩm sẽ phát triển có kiểm soát, tránh scope creep và vẫn thể hiện được tính chuyên nghiệp về BA, product và engineering.
