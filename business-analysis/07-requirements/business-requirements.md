# Business Requirements

## Mục Đích

Tài liệu này xác định các **Business Requirements** cấp cao của dự án **Microlearning Classroom LMS Platform**. Business Requirements mô tả nhu cầu nghiệp vụ, giá trị sản phẩm và kết quả mong muốn trước khi đi vào chi tiết Functional Requirements.

Hệ thống hướng đến một nền tảng LMS nội bộ, lấy Classroom làm trung tâm, giúp Teacher tạo nội dung microlearning, Student học theo việc cần làm, Admin quản trị hệ thống và đội kỹ thuật triển khai sản phẩm bằng ReactJS, Node.js/ExpressJS, MongoDB, Docker, CI/CD, Swagger/OpenAPI và Cloud deployment.

## Bảng Business Requirements

| ID | Business Requirement | Giá trị nghiệp vụ | Priority | Chỉ số thành công |
| --- | --- | --- | --- | --- |
| BRQ-001 | Hệ thống phải hỗ trợ mô hình Internal LMS dựa trên Classroom do Teacher dẫn dắt. | Tổ chức lớp học nội bộ có cấu trúc, rõ Teacher, Student và nội dung học. | Must | Số Classroom active, số Student enrolled |
| BRQ-002 | Hệ thống phải hỗ trợ microlearning với Course, Module, Lesson, Flashcard, Quiz, Assignment và Resource. | Chia nhỏ nội dung để Student dễ học, dễ hoàn thành và dễ đo tiến độ. | Must | Số Course/Lesson được publish, completion rate |
| BRQ-003 | Teacher phải là actor chính tạo và quản lý learning content. | Đảm bảo quyền sở hữu nghiệp vụ giảng dạy thuộc về Teacher. | Must | Teacher tạo được Course/Lesson/Quiz/Assignment |
| BRQ-004 | Student phải có thể tự đăng ký account, login và sau đó tham gia Classroom bằng Class Code hoặc Invite Link. | Giảm ma sát onboarding nhưng vẫn bảo đảm chỉ Student đã xác thực mới được tạo Enrollment. | Must | Registration success rate, login-to-join success rate, join error rate |
| BRQ-005 | Student phải thấy việc cần làm ngay trên Dashboard. | Giúp Student biết bài nào cần học, quiz nào cần làm, assignment nào cần nộp. | Must | To-do engagement rate, overdue item reduction |
| BRQ-006 | Student phải học, làm quiz, nộp assignment và xem feedback trong cùng hệ thống. | Tạo vòng đời học tập đầy đủ thay vì phân tán qua nhiều kênh. | Must | Lesson completion, quiz attempts, submissions |
| BRQ-007 | Teacher phải xem được toàn bộ Course mình quản lý khi mở Course. | Giúp Teacher kiểm soát bài học, deadline, Student list và progress trong một màn hình. | Must | Course Dashboard usage, time to find progress |
| BRQ-008 | Teacher phải xem được điểm quá trình của Student và bảng xếp hạng progress từ cao xuống thấp. | Giúp Teacher phát hiện Student làm tốt và Student cần hỗ trợ. | Must | Progress dashboard views, at-risk detection |
| BRQ-009 | Teacher phải đặt và reset được deadline hoàn thành cho từng Lesson/Activity. | Tăng tính kỷ luật học tập, giúp Student quản lý thời gian và cho phép xử lý ngoại lệ khi lớp học cần gia hạn. | Must | Deadline visibility, late item tracking, deadline reset tracking |
| BRQ-010 | Quiz phải hỗ trợ câu hỏi trắc nghiệm, đúng/sai, câu hỏi ngắn và media tùy chọn nếu cần. | Teacher tạo được câu hỏi linh hoạt, có minh họa trực quan. | Must/Should | Quiz creation success, question media usage |
| BRQ-011 | Teacher phải chấm điểm, gửi feedback và return work cho Student. | Hoàn thiện quy trình đánh giá và cải thiện học tập. | Must | Graded submissions, feedback sent |
| BRQ-012 | System phải ghi nhận progress, quiz score, submission status, grade và feedback. | Dữ liệu học tập có thể đo lường và báo cáo. | Must | Progress data completeness |
| BRQ-013 | Admin phải quản lý Teacher/Student/Admin account, role và account status bằng các danh sách riêng theo role. | Vận hành hệ thống có kiểm soát, đúng quyền và tránh trộn dữ liệu user không tối ưu. | Must | Student/Teacher/Admin list accuracy, account status accuracy, role change audit |
| BRQ-014 | Admin phải mời Teacher bằng manual invitation link, không biết mật khẩu của Teacher. | Onboarding Teacher an toàn, không phụ thuộc email provider trong MVP. | Must | Invitation activation success, zero password exposure |
| BRQ-015 | Admin phải copy invitation link và tự gửi thủ công qua kênh phù hợp. | Phù hợp bối cảnh đồ án, không bắt buộc tích hợp Gmail/SMTP. | Must | Manual invitation flow completed |
| BRQ-016 | Admin phải cấu hình Enrollment Policy cấp hệ thống. | Kiểm soát Class Code và Invite Link ở cấp governance. | Must | Policy enforcement success |
| BRQ-017 | Admin phải xem reports, usage analytics và audit log. | Theo dõi vận hành, bảo mật và hiệu quả học tập. | Must | Report availability, audit coverage |
| BRQ-018 | Hệ thống phải bảo toàn dữ liệu khi khóa account, archive Classroom hoặc offboarding Teacher. | Không mất Course, Progress, Submission, Grade và AuditLog. | Must | Data retention success |
| BRQ-019 | Hệ thống phải cung cấp RESTful API rõ ràng và được document bằng Swagger/OpenAPI. | Frontend, backend và QA làm việc theo contract thống nhất. | Must | Swagger endpoint coverage |
| BRQ-020 | Hệ thống chỉ tham khảo workflow Google Classroom, không định vị là clone. | Giữ trải nghiệm quen thuộc nhưng vẫn đúng bản sắc microlearning. | Must | Scope consistency review |
| BRQ-021 | Hệ thống phải có role-based access control và object-level access control. | Student/Teacher/Admin chỉ truy cập đúng dữ liệu được phép. | Must | Authorization test pass rate |
| BRQ-022 | Hệ thống phải có UI điều hướng rõ ràng như Back, Previous, Next và breadcrumb. | Giảm mất phương hướng khi học hoặc quản trị nhiều bước. | Must | Navigation usability pass |
| BRQ-023 | Hệ thống phải hỗ trợ file/resource cơ bản như PDF, image, video URL, link hoặc attachment. | Đáp ứng nhu cầu tài liệu học tập thực tế. | Should | Resource open/download success |
| BRQ-024 | Hệ thống phải có nền tảng DevOps để chạy local bằng Docker, build/test/deploy bằng CI/CD và đưa lên Cloud. | Sản phẩm không chỉ có code mà có khả năng vận hành thật. | Must | Deployment success rate |
| BRQ-025 | Hệ thống phải có monitoring, health check, backup và rollback strategy ở mức nền tảng. | Giảm rủi ro khi vận hành demo/staging/production. | Must | Health check uptime, rollback readiness |

## Business Requirement Theo Actor

| Actor | Business Needs Chính |
| --- | --- |
| Student | Tự đăng ký account, login, join lớp nhanh, thấy việc cần làm, học bài ngắn, làm quiz, nộp bài, xem điểm/feedback, theo dõi deadline |
| Teacher | Tạo Classroom/Course, tạo nội dung, đặt deadline, xem Student list, xem progress ranking, chấm điểm, feedback |
| Admin | Quản lý account/role/status, mời Teacher, cấu hình policy, xem reports/audit, xử lý governance/offboarding |
| Dev/QA | API rõ, requirement testable, Swagger đầy đủ, dữ liệu có cấu trúc |
| DevOps | Docker, CI/CD, Cloud deployment, monitoring, backup, rollback |

## Business Success Metrics

| Metric | Ý nghĩa |
| --- | --- |
| Active Classrooms | Số lớp đang vận hành |
| Course Published Rate | Tỷ lệ Course được Teacher publish |
| Student Join Success Rate | Tỷ lệ Student join thành công bằng Code/Link |
| To-do Completion Rate | Tỷ lệ việc cần làm được Student hoàn thành |
| Lesson Completion Rate | Tỷ lệ hoàn thành Lesson |
| Quiz Attempt Rate | Tỷ lệ Student làm Quiz |
| Assignment Submission Rate | Tỷ lệ Student nộp Assignment |
| Average Progress Score | Điểm quá trình trung bình |
| Late/Missing Work Rate | Tỷ lệ bài trễ/chưa làm |
| Teacher Feedback Rate | Tỷ lệ bài được Teacher feedback |
| Audit Coverage | Tỷ lệ hành động quan trọng có audit log |
| Deployment Success Rate | Tỷ lệ deploy thành công qua CI/CD |

## Business Assumptions

- Đối tượng chính của hệ thống là **Teacher** và **Student**.
- Admin cung cấp Teacher account bằng manual invitation link.
- Student có thể tự đăng ký account; phải login với account `ACTIVE` trước khi tự join Classroom bằng Code/Link khi policy cho phép.
- Teacher là người tạo và quản lý nội dung học tập.
- Admin không thay Teacher tạo/chấm bài hằng ngày, trừ khi có governance permission.
- MVP ưu tiên web app ReactJS, chưa cần mobile app native.
- RESTful API là style chính, không dùng GraphQL trong MVP.
- Google Classroom chỉ là nguồn tham khảo nghiệp vụ.

## Business Constraints

- Không bắt buộc tích hợp Gmail/SMTP trong MVP.
- Không tích hợp Google Classroom API.
- Không xây live video meeting sâu trong MVP.
- Không xây AI grading nâng cao trong MVP.
- Không xây payment/subscription/marketplace.
- Không dùng hard delete với dữ liệu học tập quan trọng.

## Business Requirement Acceptance

Một Business Requirement được xem là được đáp ứng khi:

- Có Functional Requirements tương ứng.
- Có User Stories hoặc Use Cases tương ứng.
- Có Acceptance Criteria/Test Scenarios kiểm thử được.
- Có API/Data/UI impact nếu liên quan.
- Không mâu thuẫn với Scope, Business Rules và User Roles.
