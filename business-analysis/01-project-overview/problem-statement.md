# Phát Biểu Vấn Đề

## Mục Đích

Tài liệu này xác định các vấn đề cốt lõi mà **Microlearning Classroom LMS Platform** cần giải quyết, ảnh hưởng của từng vấn đề và hướng giải quyết ở cấp sản phẩm.

## Vấn Đề Tổng Quan

Teacher và Student cần một hệ thống Classroom LMS nội bộ giúp tổ chức lớp học, phân phối nội dung, giao bài, nhận bài nộp, chấm điểm và theo dõi tiến độ một cách tập trung. Nếu không có hệ thống này, hoạt động dạy và học dễ bị phân tán, khó kiểm soát và khó đo lường.

## Các Vấn Đề Chính

| ID | Vấn đề | Người bị ảnh hưởng | Tác động |
| --- | --- | --- | --- |
| PS-001 | Nội dung học tập phân tán ở nhiều kênh khác nhau | Teacher, Student | Khó tìm tài liệu, khó biết nội dung nào là mới nhất |
| PS-002 | Student tham gia lớp chưa có cơ chế đơn giản và có kiểm soát | Student, Teacher | Mất thời gian mời lớp, dễ sai lớp hoặc thiếu người học |
| PS-003 | Teacher khó theo dõi ai đã tham gia, ai đã học, ai đã nộp bài | Teacher | Khó quản lý lớp và đánh giá tiến độ |
| PS-004 | Student khó biết bài nào cần học, bài nào cần nộp, bài nào sắp đến hạn | Student | Dễ bỏ sót assignment hoặc không hoàn thành đúng hạn |
| PS-005 | Quy trình giao bài - nộp bài - chấm điểm - feedback chưa tập trung | Teacher, Student | Mất thời gian trao đổi, dễ thiếu phản hồi và thiếu minh bạch |
| PS-006 | Nội dung học dài làm giảm khả năng hoàn thành đều đặn | Student | Giảm engagement và completion rate |
| PS-007 | Admin thiếu công cụ quản trị users, roles, classrooms và reports | Admin | Khó vận hành hệ thống khi số lượng lớp và người dùng tăng |
| PS-008 | API và deployment thiếu chuẩn hóa sẽ gây khó bảo trì | Developer, DevOps | Khó tích hợp frontend/backend, khó kiểm thử và khó deploy ổn định |

## Root Causes

| Nhóm nguyên nhân | Mô tả |
| --- | --- |
| Thiếu hệ thống tập trung | Lớp học, bài học, bài tập, điểm và phản hồi chưa được quản lý trong một nền tảng thống nhất |
| Thiếu workflow Classroom rõ ràng | Chưa có cấu trúc ổn định cho Stream, Classwork, People/Roster và Grades/Progress |
| Thiếu tracking | Chưa có dữ liệu đầy đủ về Student progress, quiz attempts, submissions và grades |
| Thiếu chuẩn kỹ thuật | Chưa có RESTful API contract, Swagger/OpenAPI, Docker và CI/CD rõ ràng |
| Nội dung học chưa tối ưu | Nội dung chưa được chia nhỏ theo microlearning, gây khó tiếp thu và khó hoàn thành |

## Phát Biểu Vấn Đề Cốt Lõi

Teacher cần một nền tảng Classroom LMS nội bộ để tạo lớp, tổ chức nội dung, giao bài, theo dõi Student và đánh giá kết quả học tập. Student cần một trải nghiệm rõ ràng để tham gia Classroom, xem Classwork, học micro lessons, làm quiz, nộp Assignment và nhận Feedback. Admin cần công cụ quản trị hệ thống, còn đội kỹ thuật cần một nền tảng có API, tài liệu và deployment pipeline rõ ràng.

## Hướng Giải Quyết Cấp Sản Phẩm

| Vấn đề | Hướng giải quyết |
| --- | --- |
| Student khó tham gia lớp | Hỗ trợ Class Code và Invite Link |
| Tài liệu và bài tập phân tán | Tổ chức nội dung theo Classroom, Class Stream và Classwork |
| Teacher khó giao bài và nhận bài | Xây dựng Assignment và Submission workflow |
| Student không rõ trạng thái học tập | Cung cấp Progress, due date, submission status và grade |
| Teacher thiếu dữ liệu đánh giá | Cung cấp Grades/Progress report theo Classroom và Student |
| Admin khó quản trị | Cung cấp Admin dashboard, user management và role management |
| Developer khó tích hợp | Chuẩn hóa RESTful API và Swagger/OpenAPI |
| DevOps khó triển khai | Docker hóa hệ thống và thiết lập CI/CD pipeline |

## Phạm Vi Vấn Đề Trong MVP

MVP cần tập trung giải quyết các vấn đề quan trọng nhất:

- Teacher tạo và quản lý Classroom.
- Student tham gia Classroom bằng Class Code hoặc Invite Link.
- Teacher tạo Micro Lesson, Quiz, Assignment và Material.
- Student học Lesson, làm Quiz và nộp Submission.
- Teacher xem Submission, chấm điểm và gửi Feedback.
- Student xem Progress, Grade và Feedback.
- Admin quản lý users, roles và dữ liệu vận hành cơ bản.
- API có Swagger/OpenAPI và có thể chạy bằng Docker Compose.

## Ngoài Phạm Vi Vấn Đề Ở MVP

- Native mobile app.
- Tích hợp Google Workspace thật.
- Video meeting trực tiếp.
- AI recommendation.
- Payment hoặc marketplace khóa học.
- Multi-tenant billing.
- Tích hợp Student Information System.
