# Non-Functional Requirements Overview

## Mục Đích

Tài liệu này là trang tổng quan cho mục **13 - Non-Functional Requirements** của dự án **Microlearning Classroom LMS Platform**. Non-functional requirements không mô tả hệ thống làm chức năng gì, mà mô tả hệ thống phải hoạt động tốt như thế nào.

Đối với dự án này, NFR đặc biệt quan trọng vì hệ thống có:

- Student, Teacher, Admin và Super Admin.
- Dữ liệu cá nhân, dữ liệu học tập, điểm số, feedback và submission.
- RESTful API dùng JWT/session, Swagger/OpenAPI.
- ReactJS frontend, Node.js/ExpressJS backend, MongoDB.
- Docker, CI/CD và Cloud deployment.
- Admin governance, audit log, teacher invitation token và manual invitation link.

## Phạm Vi NFR

| Nhóm NFR | Mục đích |
| --- | --- |
| Security | Bảo vệ account, token, role, API, dữ liệu học tập và admin actions. |
| Performance | Đảm bảo API/UI phản hồi đủ nhanh cho trải nghiệm học tập. |
| Scalability | Thiết kế có thể mở rộng theo số Student, Teacher, Classroom và Course. |
| Availability | Hệ thống có thể truy cập ổn định ở môi trường demo/staging/production. |
| Reliability | Hạn chế mất dữ liệu, xử lý lỗi có kiểm soát, có backup/restore. |
| Maintainability | Code, API, Swagger, environment config và deployment dễ bảo trì. |
| Supportability | Dev/QA/DevOps có đủ logs, health check, version, runbook để hỗ trợ. |
| Privacy | Hạn chế thu thập dữ liệu, bảo vệ dữ liệu cá nhân và học tập. |
| Compliance | Tuân thủ nguyên tắc bảo vệ dữ liệu ở mức phù hợp đồ án và tổ chức nội bộ. |
| Logging/Monitoring | Có log, audit log, metrics và alert foundation cho vận hành. |
| Usability/Accessibility | UI dễ dùng, có keyboard navigation, message rõ ràng, mobile usable. |

## NFR Goals Theo Role

| Role | Kỳ vọng NFR |
| --- | --- |
| Student | Login được, thấy To-do nhanh, làm Lesson/Quiz/Assignment ổn định, không thấy dữ liệu của Student khác. |
| Teacher | Tạo Course/Lesson/Quiz/Assignment không mất dữ liệu, xem progress nhanh, reset deadline có audit rõ. |
| Admin | Quản lý user/invitation/role an toàn, có audit log, không bị lẫn dữ liệu giữa Student/Teacher/Admin list. |
| Dev | API rõ contract, lỗi dễ debug, môi trường local chạy được bằng Docker. |
| QA | Có tiêu chí đo được để test performance, security, role guard, error state và deployment smoke test. |
| DevOps | Có health endpoint, logs, version metadata, backup/restore, rollback và environment config rõ. |

## NFR Priority

| Priority | Ý nghĩa |
| --- | --- |
| Must | Bắt buộc cho MVP/demo release vì ảnh hưởng bảo mật, dữ liệu hoặc luồng chính. |
| Should | Nên có để hệ thống chuyên nghiệp hơn, có thể hoàn thiện trong MVP+ hoặc staging. |
| Could | Có thể làm sau, không chặn MVP nhưng giúp production readiness. |

## NFR Measurement Principles

NFR cần đo được. Các yêu cầu trong mục 13 nên có ít nhất một trong các cách đo:

- Response time target.
- Error rate target.
- Uptime target.
- Recovery target.
- Security test checklist.
- Role access test.
- Log/audit evidence.
- CI/CD quality gate.
- Load test hoặc smoke test.
- Manual review checklist.

## Baseline Cho Đồ Án/MVP

Vì đây là dự án học tập/đồ án có định hướng cloud deployment, NFR được chia thành 2 mức:

| Mức | Ý nghĩa |
| --- | --- |
| MVP/Staging Baseline | Mức tối thiểu cần đạt để demo chuyên nghiệp và Dev/DevOps học được quy trình. |
| Production-Ready Direction | Hướng mở rộng nếu sản phẩm được triển khai thật cho tổ chức. |

MVP/Staging không cần đạt mọi tiêu chuẩn enterprise, nhưng phải tránh các lỗi nghiêm trọng như:

- Lưu password plain text.
- Expose token/secrets trong response/log.
- Student xem được grade/submission của Student khác.
- Teacher quản lý được Classroom không thuộc quyền.
- Admin list tải toàn bộ user không phân trang.
- Không có health check sau deployment.
- Không có backup cơ bản cho MongoDB.
- Không có error response chuẩn.

## Tài Liệu Trong Mục 13

| File | Nội dung |
| --- | --- |
| `non-functional-requirements-overview.md` | Tổng quan NFR, phạm vi, mục tiêu và baseline. |
| `nfr-catalog.md` | Catalog NFR tổng hợp theo mã NFR. |
| `security-requirements.md` | Authentication, authorization, token, API, file upload, audit security. |
| `performance-scalability.md` | Response time, load target, pagination, indexing, scaling. |
| `availability-reliability.md` | Uptime, health check, backup, restore, rollback, data integrity. |
| `maintainability-supportability.md` | Code quality, API consistency, Swagger, config, support runbook. |
| `privacy-compliance.md` | Data privacy, retention, minimization, export, masking. |
| `logging-monitoring.md` | Application logs, audit logs, metrics, alerts, monitoring checklist. |
| `usability-accessibility.md` | Usability, accessibility, responsive quality và UI error handling. |
| `nfr-quality-gates.md` | Quality gates cho Dev, QA, DevOps trước khi release. |

## Definition Of Done Cho NFR

Một NFR được xem là đủ rõ khi có:

- Mã requirement.
- Mô tả rõ.
- Priority.
- Cách đo hoặc bằng chứng xác nhận.
- Owner chính.
- Liên kết đến chức năng/API/data/UI nếu cần.

## Ghi Chú

- NFR không thay thế Functional Requirements, nhưng có thể chặn release nếu không đạt mức Must.
- Security, privacy, backup và access control là nhóm Must vì liên quan dữ liệu thật của user.
- Performance target trong tài liệu này là baseline hợp lý cho MVP/staging; khi có production traffic thật cần đo lại và điều chỉnh.
