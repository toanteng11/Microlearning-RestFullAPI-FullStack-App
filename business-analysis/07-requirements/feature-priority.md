# Feature Priority

## Mục Đích

Tài liệu này xác định mức ưu tiên theo MoSCoW cho các feature của **Microlearning Classroom LMS Platform**. Priority dùng để quyết định MVP scope, backlog order, release planning và trade-off khi thời gian phát triển bị giới hạn.

## Nguyên Tắc Ưu Tiên

| Priority | Ý nghĩa |
| --- | --- |
| Must | Không có feature này thì workflow chính không chạy được hoặc sản phẩm mất tính chuyên nghiệp tối thiểu |
| Should | Quan trọng, nên làm trong MVP Lite hoặc nếu đủ thời gian |
| Could | Có giá trị nhưng có thể để Post-MVP |
| Won't | Không làm trong đồ án/MVP hiện tại |

## Must Have - MVP Core

| Feature | Lý do Must Have |
| --- | --- |
| Authentication | Mọi user cần login và truy cập theo role |
| Student Self-registration | Student tự tạo account `STUDENT` trong MVP và login trước khi join Classroom |
| Account Status Management | Cần `ACTIVE`, `BLOCKED`, `PENDING`, `INACTIVE`, `DELETED` |
| RBAC And Object-Level Access Control | Bảo vệ dữ liệu Student/Teacher/Admin |
| Teacher Invitation Manual Copy Link | Quy trình onboarding Teacher chính thức của dự án |
| Admin User Management | Admin cần quản lý Teacher/Student/Admin theo từng danh sách riêng |
| Admin Student List | Tránh trộn Student với Teacher/Admin; Student thường có số lượng lớn nhất |
| Admin Teacher List | Cần quản lý Teacher invitation, Classroom ownership và offboarding |
| Admin Admin List | Cần kiểm soát tài khoản quản trị và permission nhạy cảm |
| Role And Permission Management | Cần phân quyền rõ ràng |
| Classroom Management | Container chính của LMS |
| Class Code Join | Student cần cách join nhanh |
| Invite Link Join | Student cần join bằng link |
| Enrollment Policy Management | Admin cần bật/tắt cơ chế join ở cấp hệ thống |
| Classroom Roster Management | Teacher cần xem và quản lý Student |
| Course Management | Teacher cần tạo khóa học/nội dung trong Classroom |
| Teacher Course Detail Dashboard | Teacher bấm vào Course phải thấy bài học, Student, progress và deadline |
| Module / Topic Management | Tổ chức nội dung học rõ ràng |
| Micro Lesson Management | Nền tảng microlearning bắt buộc có bài học ngắn |
| Lesson Deadline Management | Teacher đặt và reset deadline cho từng bài khi có ngoại lệ |
| Flashcard Management | Phù hợp microlearning và ôn tập nhanh |
| Quiz Management | Cần kiểm tra kiến thức |
| Assignment Management | Hoàn thiện workflow giao bài/nộp bài |
| Student Assignment Submission | Student cần nộp bài trong hệ thống |
| Grading And Feedback | Teacher chấm điểm và phản hồi |
| Student Dashboard To-do | Student phải thấy việc cần làm sau login |
| Student Progress View | Student theo dõi tiến độ cá nhân |
| Teacher Progress Dashboard | Teacher theo dõi tiến độ Student |
| Course Progress Ranking | Teacher xem điểm quá trình sort cao xuống thấp |
| Grade/Feedback View | Student xem kết quả học tập |
| Navigation Controls | Back/Next/Previous/breadcrumb để UX không bị gãy |
| Announcement / Class Stream Basic | Teacher thông báo cho lớp |
| Admin Reports Basic | Admin theo dõi hệ thống |
| Audit Log Management | Trace hành động quan trọng |
| RESTful API | Backend contract chính |
| Swagger/OpenAPI | Developer/QA cần tài liệu API |
| Docker Foundation | Chạy local/demo nhất quán |
| CI/CD Foundation | Học DevOps và triển khai chuyên nghiệp |
| Cloud Deployment Foundation | Đưa hệ thống lên môi trường thật/demo |

## Should Have - MVP Lite / Nên Có

| Feature | Lý do Should |
| --- | --- |
| Learning Resource Management | PDF/video/image/link giúp bài học đầy đủ hơn |
| Quiz Question Media | Image/video trong câu hỏi giúp minh họa trực quan |
| Gradebook Basic | Teacher xem điểm theo Student/Activity |
| Learning Calendar / Deadline View | Giúp Student/Teacher quản lý hạn |
| File Upload Policy | Cần nếu dùng upload file/media |
| Notification Configuration | Hữu ích cho deadline, feedback, submission |
| Classroom Ownership Transfer | Cần khi Teacher offboarding |
| Teacher Offboarding Policy | Bảo toàn Classroom khi Teacher nghỉ |
| Report Export | Hữu ích cho Admin/Teacher |
| Audit Export | Hữu ích cho kiểm tra |
| Content Preview As Student | Giúp Teacher kiểm tra trước khi publish |
| Content Reuse Basic | Giảm công sức tạo lại Course |
| Organization Analytics Basic | Hữu ích nếu muốn báo cáo cấp tổ chức |

## Could Have - Post-MVP

| Feature | Lý do Could |
| --- | --- |
| Co-teacher Management | Tăng độ phức tạp phân quyền |
| Online Class Link Management | Có thể lưu meeting URL thủ công sau |
| Bulk Import Users | Hữu ích nhưng chưa bắt buộc |
| Advanced Notification Provider | SMTP/SendGrid có thể làm sau |
| Integration Management | Phụ thuộc provider bên thứ ba |
| Temporary Class Access | Cần governance chi tiết |
| Advanced Gradebook Weighting | Cần rule điểm phức tạp |
| Rubric Advanced | Hữu ích nhưng tăng scope grading |
| Video Upload Advanced | Tăng chi phí storage và streaming |
| Security Alerting Advanced | Cần monitoring chuyên sâu |

## Won't Have - Out Of MVP

| Feature | Lý do Won't |
| --- | --- |
| Guardian Management | Không phù hợp đối tượng chính Teacher/Student |
| Payment / Subscription | Không thuộc LMS nội bộ |
| Marketplace Content | Không thuộc phạm vi đồ án |
| Google Classroom API Integration | Chỉ tham khảo workflow, không tích hợp clone |
| Live Video Meeting Integration Sâu | Cần provider và realtime complexity |
| AI Grading Nâng Cao | Có thể là release tương lai |
| Plagiarism/Originality Report | Cần service/AI bên ngoài |
| Native Mobile App | MVP ưu tiên ReactJS web |

## Priority Theo Actor

| Actor | Must Have |
| --- | --- |
| Student | Join Classroom, Dashboard To-do, Classwork, Lesson, Flashcard, Quiz, Assignment, Progress, Grade/Feedback, Navigation |
| Teacher | Classroom, Course, Course Dashboard, Module, Lesson, Quiz, Assignment, Deadline, Student list, Progress Ranking, Grading/Feedback |
| Admin | Student List, Teacher List, Admin List, Role, Invitation, Enrollment Policy, Reports, Audit, Governance, Offboarding |
| Dev/QA | RESTful API, Swagger, Testable requirements, Error handling |
| DevOps | Docker, CI/CD, Cloud deployment, health check, backup, rollback |

## Release Recommendation

| Release | Feature set |
| --- | --- |
| MVP 1 | Auth, Admin invitation, Admin role-specific user lists, Classroom, join Code/Link, Course, Lesson, Quiz, Assignment, Student To-do, Progress, Teacher Course Dashboard, basic reports |
| MVP 1.1 | Gradebook basic, resources, deadline calendar, question media image, report export |
| MVP 1.2 | Ownership transfer, offboarding workflow, notification config, content reuse |
| Post-MVP | Co-teacher, advanced analytics, advanced grade weighting, integrations, AI features |
