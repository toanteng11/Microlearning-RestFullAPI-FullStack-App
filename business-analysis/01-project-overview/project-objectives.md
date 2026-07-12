# Mục Tiêu Dự Án

## Mục Đích

Tài liệu này xác định mục tiêu nghiệp vụ, mục tiêu sản phẩm, mục tiêu kỹ thuật và mục tiêu MVP của dự án **Microlearning Classroom LMS Platform**.

## Vision Ở Cấp Project Overview

Xây dựng một hệ thống Classroom LMS nội bộ giúp Teacher tổ chức lớp học, giao nội dung học tập, theo dõi tiến độ và đánh giá Student; đồng thời giúp Student có trải nghiệm học tập rõ ràng, dễ tham gia, dễ hoàn thành và dễ theo dõi kết quả.

## Mục Tiêu Nghiệp Vụ

| ID | Mục tiêu | Mô tả | Priority |
| --- | --- | --- | --- |
| BO-001 | Chuẩn hóa workflow lớp học nội bộ | Cung cấp quy trình rõ ràng cho tạo Classroom, mời Student, đăng nội dung, giao bài và theo dõi tiến độ | Must |
| BO-002 | Tăng mức độ tham gia của Student | Giúp Student dễ join Classroom, dễ xem Classwork và dễ hoàn thành nội dung học | Must |
| BO-003 | Giảm tải thao tác quản lý cho Teacher | Tập trung các thao tác tạo bài, giao bài, nhận bài, chấm điểm và feedback trong cùng hệ thống | Must |
| BO-004 | Tăng khả năng đo lường kết quả học tập | Cung cấp dữ liệu về progress, quiz attempts, submissions, grades và completion | Must |
| BO-005 | Hỗ trợ vận hành nội bộ | Admin có công cụ quản lý users, roles, classrooms và reports | Should |
| BO-006 | Tạo nền tảng có thể mở rộng | Thiết kế hệ thống có API, deployment và monitoring rõ ràng để phát triển lâu dài | Should |

## Mục Tiêu Sản Phẩm

| ID | Mục tiêu | Mô tả | Kết quả kỳ vọng |
| --- | --- | --- | --- |
| PO-001 | Classroom Management | Teacher có thể tạo, cập nhật, archive và quản lý Classroom | Classroom hoạt động như không gian học tập trung tâm |
| PO-002 | Classroom Joining | Student có thể tham gia bằng Class Code hoặc Invite Link | Join flow nhanh, rõ ràng và có kiểm soát |
| PO-003 | Class Stream | Teacher có thể đăng Announcement/Post | Student theo dõi được thông báo và hoạt động mới |
| PO-004 | Classwork | Teacher có thể tạo Micro Lesson, Quiz, Assignment và Material | Nội dung học tập được tổ chức rõ ràng |
| PO-005 | Submission Workflow | Student có thể nộp Assignment và Teacher có thể review | Quy trình giao bài - nộp bài được số hóa |
| PO-006 | Grading and Feedback | Teacher có thể chấm điểm và gửi Feedback | Student xem được kết quả và nhận xét |
| PO-007 | Progress Tracking | Hệ thống ghi nhận lesson completion, quiz score, submission status và grade | Teacher và Student xem được tiến độ học |
| PO-008 | Admin Management | Admin quản lý users, roles và dữ liệu vận hành | Hệ thống có khả năng quản trị cơ bản |
| PO-009 | API Documentation | Backend có Swagger/OpenAPI | Developer và QA có thể hiểu/test API dễ dàng |

## Mục Tiêu Kỹ Thuật

| ID | Mục tiêu | Mô tả | Technology |
| --- | --- | --- | --- |
| TO-001 | Frontend application | Xây dựng web app cho Student, Teacher và Admin | ReactJS |
| TO-002 | Backend RESTful API | Xây dựng API rõ ràng, versioned và có authorization | Node.js, ExpressJS |
| TO-003 | Database | Lưu users, classrooms, classwork, submissions, progress và reports | MongoDB |
| TO-004 | API Documentation | Tài liệu hóa endpoints, request/response và error schema | Swagger/OpenAPI |
| TO-005 | Containerization | Đóng gói frontend, backend và database cho local/dev environment | Docker, Docker Compose |
| TO-006 | CI/CD | Tự động hóa build, test và deployment | CI/CD pipeline |
| TO-007 | Cloud Deployment | Đưa hệ thống lên cloud environment | Cloud provider được chọn tại ADR-010 / deployment decision gate |
| TO-008 | Monitoring Foundation | Có nền tảng log và monitoring cơ bản | Logging, monitoring tools |

## Mục Tiêu MVP

MVP cần chứng minh được các workflow cốt lõi:

1. User có thể register/login và được phân quyền theo role.
2. Teacher có thể tạo Classroom.
3. Teacher có thể mời Student bằng Class Code hoặc Invite Link.
4. Student có thể join Classroom thành công.
5. Teacher có thể tạo Classwork gồm Micro Lesson, Quiz, Assignment hoặc Material.
6. Student có thể học Lesson, làm Quiz và nộp Assignment.
7. Teacher có thể xem Submission, chấm điểm và gửi Feedback.
8. Student có thể xem Progress, Grade và Feedback.
9. Admin có thể quản lý users và roles ở mức cơ bản.
10. API có tài liệu Swagger/OpenAPI.
11. Hệ thống có thể chạy bằng Docker Compose.
12. Hệ thống có pipeline CI/CD cơ bản và có thể deploy lên Cloud.

## Tiêu Chí Thành Công Cấp Cao

| Nhóm tiêu chí | Mô tả |
| --- | --- |
| Business success | Teacher và Student có thể hoàn thành workflow dạy-học cơ bản trong hệ thống |
| Product success | Classroom, Classwork, Submission, Grade và Progress hoạt động đúng kỳ vọng |
| Technical success | API ổn định, có documentation, chạy được bằng Docker và deploy được qua CI/CD |
| UX success | Student dễ join Classroom, dễ thấy bài cần làm và dễ nộp bài |
| Operational success | Admin có thể quản lý user/role và theo dõi dữ liệu vận hành cơ bản |

## Không Phải Mục Tiêu Của MVP

- Không xây native mobile app ở MVP.
- Không tích hợp sâu với Google Workspace.
- Không xây live video meeting.
- Không triển khai AI recommendation.
- Không xây payment, billing hoặc course marketplace.
- Không xây đầy đủ enterprise LMS phức tạp.
