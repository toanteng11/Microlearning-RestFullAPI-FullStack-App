# Availability And Reliability Requirements

## Mục Đích

Tài liệu này xác định yêu cầu về availability, reliability, backup, restore và recovery cho **Microlearning Classroom LMS Platform**. Mục tiêu là hệ thống có thể chạy ổn định ở môi trường staging/demo/cloud và có hướng mở rộng production-ready.

## Availability Targets

| Environment | Target | Ghi chú |
| --- | --- | --- |
| Local development | Best effort | Dev có thể chạy bằng Docker/Docker Compose. |
| Staging/demo | >= 95% trong thời gian demo/sprint review | Phù hợp đồ án, không phải SLA production. |
| Production direction | >= 99.5% monthly uptime | Chỉ áp dụng nếu triển khai thật. |

## Health Check Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-AVL-HC-001 | Backend phải có endpoint `/health`. | Must | Endpoint trả `UP`, `DEGRADED` hoặc `DOWN`. |
| NFR-AVL-HC-002 | Detailed health endpoint không được expose secrets. | Must | Không trả connection string, credentials, tokens. |
| NFR-AVL-HC-003 | Health check phải kiểm tra MongoDB connectivity ở mức phù hợp. | Should | MongoDB down thì status không được báo UP giả. |
| NFR-AVL-HC-004 | Version endpoint nên trả version, commit SHA, environment. | Should | DevOps xác nhận đúng build sau deploy. |
| NFR-AVL-HC-005 | CI/CD hoặc DevOps smoke test phải gọi health endpoint sau deploy. | Must | Deploy fail nếu service không healthy. |

## Reliability Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-REL-001 | Mutation quan trọng phải trả kết quả rõ ràng và không tạo duplicate không mong muốn. | Must | Join classroom/submit quiz không tạo duplicate ngoài policy. |
| NFR-REL-002 | Submit Quiz/Assignment phải chống double submit ở frontend và backend. | Must | Double click không tạo nhiều attempt/submission sai policy. |
| NFR-REL-003 | Reset Lesson Deadline không được xóa progress/submission/attempt cũ. | Must | Data cũ vẫn còn sau deadline reset. |
| NFR-REL-004 | Grade/feedback update phải lưu chính xác và có audit hoặc timestamp. | Must | Student thấy grade/feedback mới sau Teacher submit. |
| NFR-REL-005 | Backend phải xử lý dependency error bằng response chuẩn, không crash process. | Must | MongoDB lỗi trả 503/500 chuẩn và log. |
| NFR-REL-006 | Frontend phải có retry/error state cho API lỗi. | Must | User thấy message rõ và có Retry nếu phù hợp. |
| NFR-REL-007 | Scheduled/Published content không được xuất hiện sai quyền khi deploy/cache. | Must | Student chỉ thấy content published/assigned. |

## Backup Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-BKP-001 | MongoDB data phải có backup strategy cơ bản. | Must | Có tài liệu/command/script backup hoặc cloud snapshot. |
| NFR-BKP-002 | Backup phải bao gồm collections nghiệp vụ quan trọng. | Must | Users, classrooms, enrollments, courses, lessons, quizzes, assignments, submissions, grades, progress, audit logs. |
| NFR-BKP-003 | Backup không được public hoặc lưu trong repository source code. | Must | Backup location không public; không commit backup thật. |
| NFR-BKP-004 | DevOps phải biết restore backup vào môi trường test/staging. | Should | Restore thử ít nhất trước demo/release lớn. |
| NFR-BKP-005 | Trước migration/deployment có rủi ro, nên có pre-release backup. | Should | Có backup timestamp trước deploy. |

## Restore Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-RST-001 | Restore process phải có bước xác nhận environment để tránh restore nhầm. | Must | Runbook yêu cầu confirm target environment. |
| NFR-RST-002 | Restore test phải kiểm tra user login, classroom list và data học tập cơ bản. | Should | Smoke test sau restore đạt. |
| NFR-RST-003 | Restore không được expose production data vào môi trường không được phép. | Must | Nếu dùng data thật cho test phải có approval/masking nếu cần. |
| NFR-RST-004 | Restore result phải ghi nhận thời gian, người thực hiện và nguồn backup. | Should | Restore log/checklist có thông tin. |

## Rollback Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-RBK-001 | Deployment thất bại phải có rollback strategy. | Must | Có tài liệu rollback hoặc pipeline hỗ trợ. |
| NFR-RBK-002 | Frontend rollback phải kiểm tra compatibility với Backend API version. | Must | Smoke test login/dashboard sau rollback đạt. |
| NFR-RBK-003 | Backend rollback sau migration cần có đánh giá data compatibility. | Must | Không rollback code nếu DB schema/data không tương thích. |
| NFR-RBK-004 | Rollback phải được ghi lại trong deployment/release note. | Should | Có timestamp, version từ/đến, lý do. |

## Data Integrity Requirements

| Data flow | Reliability rule |
| --- | --- |
| Student join Classroom | Không tạo duplicate enrollment; nếu đã join trả conflict rõ. |
| Student complete Lesson | Không mất LearningProgress; completion idempotent nếu gọi lại. |
| Student submit Quiz | Respect attempt policy; không tạo attempt rác do retry/double click. |
| Student submit Assignment | Submission status nhất quán: submitted, resubmitted, returned, late. |
| Teacher reset Lesson Deadline | Recalculate late/missing theo deadline mới; giữ lịch sử thay đổi. |
| Teacher grade Submission | Grade và feedback phải gắn đúng submission/student. |
| Admin change role/status | Không tự nâng quyền trái phép; action có audit. |
| Admin revoke Invitation | Token không accept được sau revoke. |

## Failure Handling Requirements

| Failure | Expected behavior |
| --- | --- |
| MongoDB temporarily unavailable | API trả 503/500 chuẩn, log error, health DEGRADED/DOWN. |
| Upload storage unavailable | Upload fail rõ ràng, không tạo metadata file mồ côi nếu rollback được. |
| Email provider unavailable | Không ảnh hưởng MVP teacher invitation vì Admin gửi link thủ công. |
| Frontend API base URL sai | UI hiển thị API unavailable ở deployment/smoke test. |
| Network timeout | Frontend có retry hoặc thông báo thử lại. |
| Deployment version mismatch | DevOps kiểm tra `/api/v1/system/version` và frontend build info. |

## RTO/RPO Direction

| Metric | MVP/Staging Baseline | Production Direction |
| --- | --- | --- |
| RTO | Restore trong cùng ngày nếu demo bị lỗi dữ liệu | 1-4 giờ tùy SLA |
| RPO | Có thể mất dữ liệu từ lần backup gần nhất | <= 24 giờ hoặc tốt hơn |
| Backup frequency | Manual/pre-release hoặc daily nếu cloud hỗ trợ | Daily/hourly tùy nhu cầu |

## Acceptance Criteria

- `/health` hoạt động và không expose secrets.
- Có strategy backup MongoDB cơ bản.
- Có restore/rollback notes đủ để DevOps thực hiện.
- Các mutation chính chống duplicate sai nghiệp vụ.
- Deadline reset, grading, submission không làm mất dữ liệu học tập cũ.
- Frontend có error/retry state cho API hoặc network failure.
