# Chỉ Số Thành Công

## Mục Đích

Tài liệu này xác định các chỉ số đo lường để đánh giá mức độ thành công của **Microlearning Classroom LMS Platform** ở các góc nhìn nghiệp vụ, sản phẩm, kỹ thuật, UX và vận hành.

## Nguyên Tắc Đo Lường

- Chỉ số phải gắn với mục tiêu rõ ràng.
- Chỉ số phải có cách đo cụ thể bằng dữ liệu hệ thống hoặc quan sát UAT.
- MVP ưu tiên đo các workflow cốt lõi trước, chưa cần dashboard phân tích phức tạp.
- Chỉ số nên được review sau mỗi milestone hoặc release.
- Giá trị target có thể điều chỉnh sau khi có dữ liệu thực tế.

## Business Metrics

| ID | Chỉ số | Mục tiêu đề xuất | Cách đo lường | Owner |
| --- | --- | --- | --- | --- |
| BM-001 | Tỷ lệ Teacher tạo Classroom thành công | >= 90% trong UAT | Số Teacher tạo Classroom thành công / tổng số Teacher thực hiện scenario | Product Owner |
| BM-002 | Tỷ lệ Student join Classroom thành công | >= 90% trong UAT | Số lượt join thành công bằng Class Code/Invite Link / tổng số lượt thử join | Product Owner |
| BM-003 | Tỷ lệ Classroom có Classwork được tạo | >= 80% Classroom active | Số Classroom có ít nhất một Classwork item / tổng Classroom active | Product Owner |
| BM-004 | Tỷ lệ Assignment có Submission | >= 70% trong pilot | Số Assignment có ít nhất một Submission / tổng Assignment được giao | Product Owner |
| BM-005 | Tỷ lệ Student hoàn thành nội dung học | Thiết lập baseline trong pilot đầu tiên; mục tiêu release sau >= baseline pilot + 10 điểm phần trăm | Số Student hoàn thành assigned lessons/quizzes / tổng Student được assign | Product Owner |

## Product Metrics

| ID | Chỉ số | Mục tiêu đề xuất | Cách đo lường | Owner |
| --- | --- | --- | --- | --- |
| PM-001 | Classroom creation completion rate | >= 95% | Log hoặc test result của flow tạo Classroom | Product Owner |
| PM-002 | Join flow completion rate | >= 90% | Join success theo Class Code và Invite Link | Product Owner |
| PM-003 | Classwork creation success rate | >= 90% | Số lần tạo Classwork thành công / tổng lần tạo | Product Owner |
| PM-004 | Submission success rate | >= 90% | Số Submission lưu thành công / tổng lượt submit | Product Owner |
| PM-005 | Grading completion rate | >= 80% Assignment có Submission | Số Submission được chấm điểm / tổng Submission | Teacher |
| PM-006 | Feedback usage rate | Thiết lập baseline trong pilot đầu tiên; mục tiêu release sau >= baseline pilot + 10 điểm phần trăm | Số Submission có Feedback / tổng Submission được trả kết quả | Teacher |
| PM-007 | Student progress visibility | 100% workflow chính | Student xem được progress cho lessons/quizzes/submissions | QA Lead |

## UX Metrics

| ID | Chỉ số | Mục tiêu đề xuất | Cách đo lường | Owner |
| --- | --- | --- | --- | --- |
| UX-001 | Thời gian Student join Classroom | <= 1 phút trong UAT | Quan sát UAT hoặc đo thời gian thao tác | BA / QA |
| UX-002 | Thời gian Teacher tạo Assignment cơ bản | <= 3 phút trong UAT | Quan sát UAT hoặc đo thời gian thao tác | BA / QA |
| UX-003 | Tỷ lệ người dùng hoàn thành task không cần hỗ trợ | >= 80% trong UAT | Số user hoàn thành task / tổng user tham gia UAT | BA / QA |
| UX-004 | Mức độ rõ ràng của Classwork | >= 4/5 điểm khảo sát | Khảo sát Teacher/Student sau UAT | Product Owner |
| UX-005 | Mức độ dễ hiểu của Submission/Feedback | >= 4/5 điểm khảo sát | Khảo sát Student sau UAT | Product Owner |

## Technical Metrics

| ID | Chỉ số | Mục tiêu đề xuất | Cách đo lường | Owner |
| --- | --- | --- | --- | --- |
| TM-001 | API availability | >= 99% ở môi trường staging/pilot | Uptime monitoring | DevOps |
| TM-002 | Average API response time | <= 500ms cho API phổ biến ở staging | APM/logging metrics | Tech Lead |
| TM-003 | API error rate | <= 2% trong test/pilot | Error logs / total API requests | Tech Lead |
| TM-004 | Swagger coverage | 100% API MVP | Số endpoint có docs / tổng endpoint MVP | Tech Lead |
| TM-005 | CI/CD build success rate | >= 90% | Pipeline history | DevOps |
| TM-006 | Docker Compose startup success | 100% trên môi trường dev chuẩn | Chạy Docker Compose và smoke test | DevOps |
| TM-007 | Critical incident count | 0 trong UAT | Incident log | Tech Lead |

## Operational Metrics

| ID | Chỉ số | Mục tiêu đề xuất | Cách đo lường | Owner |
| --- | --- | --- | --- | --- |
| OM-001 | User management completion | 100% scenario UAT | Admin tạo/cập nhật/khóa user thành công | Admin |
| OM-002 | Role assignment accuracy | 100% role test cases pass | QA test role-based access | QA Lead |
| OM-003 | Classroom management visibility | 100% Classroom hiển thị đúng cho owner/admin | Kiểm thử list/detail Classroom | QA Lead |
| OM-004 | Report availability | Các report MVP hiển thị được | Smoke test reporting dashboard | Admin / QA |
| OM-005 | Audit readiness | Critical actions có log | Kiểm tra audit logs | Tech Lead |

## MVP Acceptance Metrics

MVP được xem là đạt yêu cầu nếu:

- Các Must-have user stories chính được hoàn thành.
- Teacher tạo được Classroom và Classwork.
- Student join được Classroom bằng Class Code hoặc Invite Link theo enrollment policy của MVP.
- Student nộp được Submission cho Assignment.
- Teacher chấm điểm và gửi Feedback được.
- Student xem được Grade, Feedback và Progress.
- Admin quản lý được users và roles cơ bản.
- Swagger/OpenAPI có đủ endpoints thuộc MVP.
- Docker Compose chạy được toàn bộ hệ thống local.
- CI/CD pipeline build/test/deploy được môi trường staging.

## Ghi Chú Về Target

Các target trong tài liệu này là đề xuất ban đầu để phục vụ BA review và MVP planning. Sau khi có UAT hoặc pilot data, Product Owner, BA, QA Lead và Technical Lead có thể điều chỉnh target cho phù hợp thực tế.
