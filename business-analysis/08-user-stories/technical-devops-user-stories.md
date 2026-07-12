# Technical And DevOps User Stories

## Mục Đích

Tài liệu này mô tả các **technical enabler user stories** cho Developer, QA và DevOps Engineer. Những story này không trực tiếp thuộc Student/Teacher/Admin, nhưng bắt buộc để hệ thống Microlearning Classroom LMS có RESTful API rõ ràng, Swagger/OpenAPI đầy đủ, chạy được bằng Docker, có CI/CD và deploy được lên Cloud.

## Epic TECH-01 - RESTful API Và Error Handling

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TECH-001 | Là Developer, tôi muốn API dùng version prefix `/api/v1` để frontend và backend có contract ổn định. | Must | FR-066 | Tất cả endpoint MVP dùng `/api/v1`; route naming theo resource; không trộn version trong cùng endpoint. |
| US-TECH-002 | Là Developer, tôi muốn API response dùng JSON format nhất quán để frontend xử lý dễ dàng. | Must | FR-065, FR-066 | Success/error response có cấu trúc thống nhất; frontend đọc được message, data, pagination, details. |
| US-TECH-003 | Là QA, tôi muốn error response chuẩn để viết test case cho validation, authorization và business rule. | Must | FR-065 | API trả status code phù hợp 400/401/403/404/409/422/500; error có code/message rõ. |
| US-TECH-004 | Là Developer, tôi muốn list endpoints có pagination, filter và sort phía server để tránh tải dữ liệu quá lớn. | Must | FR-064 | Các danh sách users, classrooms, progress, submissions, audit logs hỗ trợ page/limit/filter/sort. |
| US-TECH-005 | Là Developer, tôi muốn API kiểm tra RBAC và object-level access để bảo vệ dữ liệu. | Must | FR-005, FR-068 | Student không xem dữ liệu người khác; Teacher chỉ quản lý Classroom owned; Admin theo permission. |

## Epic TECH-02 - Swagger/OpenAPI Documentation

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TECH-006 | Là Developer, tôi muốn Swagger/OpenAPI document đầy đủ auth APIs để frontend tích hợp login/register/reset. | Must | FR-067 | Swagger có request/response schema cho auth; có security scheme nếu cần token. |
| US-TECH-007 | Là Developer, tôi muốn Swagger document Classroom/Course APIs để triển khai Teacher và Student flow. | Must | FR-067 | Swagger có endpoints cho Classroom, join, Course, Lesson, Quiz, Assignment, Progress. |
| US-TECH-008 | Là QA, tôi muốn Swagger document Admin APIs để test User Management, Invitation, Reports và Audit. | Must | FR-067 | Swagger có endpoints cho Student List, Teacher List, Admin List, invitation, policy, audit, reports. |
| US-TECH-009 | Là Developer, tôi muốn Swagger ghi rõ auth requirement của từng endpoint để tránh gọi sai quyền. | Must | FR-067 | Endpoint public/protected/admin-only được mô tả rõ; có ví dụ lỗi 401/403. |
| US-TECH-010 | Là QA, tôi muốn Swagger được cập nhật khi endpoint thay đổi để test không lệch contract. | Must | FR-067 | Pull request thay đổi API phải cập nhật OpenAPI; thiếu doc được xem là chưa done. |

## Epic TECH-03 - Upload, Media Và Resource Access

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TECH-011 | Là Developer, tôi muốn file/media metadata lưu riêng để không lưu binary trực tiếp trong MongoDB. | Must | FR-032, FR-038, FR-068 | Database lưu URL, provider, mimeType, size, owner, access scope; binary dùng storage/provider phù hợp. |
| US-TECH-012 | Là QA, tôi muốn kiểm thử access control với media để Student chỉ xem file thuộc Classroom/Course có quyền. | Must | FR-068 | User không có quyền nhận 403/404 an toàn; signed/public URL theo policy. |
| US-TECH-013 | Là Developer, tôi muốn validate file type và size khi upload media/resource để giảm rủi ro bảo mật. | Should | FR-014, FR-032, FR-038 | File vượt size hoặc sai type bị reject; lỗi hiển thị rõ. |

## Epic DEVOPS-01 - Local Runtime Bằng Docker

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-DEVOPS-001 | Là Developer, tôi muốn chạy frontend, backend và MongoDB bằng Docker Compose để môi trường local nhất quán. | Must | FR-071 | Một lệnh có thể chạy các service chính; có hướng dẫn env; container start thành công. |
| US-DEVOPS-002 | Là Developer, tôi muốn seed dữ liệu demo để test nhanh Student/Teacher/Admin flow. | Should | FR-071 | Có demo accounts và sample Classroom/Course; seed không ghi đè dữ liệu ngoài ý muốn. |
| US-DEVOPS-003 | Là Developer, tôi muốn cấu hình biến môi trường qua `.env` để không hard-code secrets. | Must | FR-073 | API URL, database URL, JWT secret, storage config lấy từ env; secrets không commit. |

## Epic DEVOPS-02 - CI/CD Pipeline

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-DEVOPS-004 | Là DevOps Engineer, tôi muốn CI pipeline chạy lint/test/build khi có code mới để phát hiện lỗi sớm. | Must | FR-072 | Pipeline fail nếu lint/test/build fail; log đủ để debug. |
| US-DEVOPS-005 | Là DevOps Engineer, tôi muốn CD pipeline deploy bản hợp lệ lên môi trường Cloud/demo để Teacher và Student truy cập thật. | Must | FR-072, FR-073 | Chỉ deploy khi build pass; environment variables được cấu hình; deploy có release version. |
| US-DEVOPS-006 | Là QA, tôi muốn staging/demo environment ổn định để kiểm thử UAT trước production. | Should | FR-072, FR-073 | Có URL môi trường test; data/config tách với production; deploy có thể lặp lại. |

## Epic DEVOPS-03 - Health Check, Monitoring, Backup Và Rollback

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-DEVOPS-007 | Là DevOps Engineer, tôi muốn health check endpoint để biết API và database có hoạt động không. | Must | FR-070 | `/health` hoặc endpoint tương đương trả trạng thái API/database; không lộ secret. |
| US-DEVOPS-008 | Là Admin/DevOps Engineer, tôi muốn logging cơ bản để biết lỗi API và lỗi hệ thống. | Must | FR-074 | API log request/error quan trọng; log không chứa password/token nhạy cảm. |
| US-DEVOPS-009 | Là DevOps Engineer, tôi muốn monitoring cơ bản để nhận biết downtime hoặc service degraded. | Must | FR-074 | Có cách kiểm tra uptime/health; lỗi nghiêm trọng có log hoặc alert cơ bản. |
| US-DEVOPS-010 | Là DevOps Engineer, tôi muốn backup MongoDB để giảm rủi ro mất dữ liệu học tập. | Must | FR-075 | Có kế hoạch backup dữ liệu User, Classroom, Course, Submission, Progress, AuditLog. |
| US-DEVOPS-011 | Là DevOps Engineer, tôi muốn rollback bản deploy lỗi để đưa hệ thống về trạng thái ổn định. | Must | FR-075 | Có quy trình rollback version; rollback không làm mất dữ liệu quan trọng. |
| US-DEVOPS-012 | Là Product Owner, tôi muốn biết trạng thái deploy để quyết định có cho UAT/release hay không. | Should | FR-072, FR-074 | Có release note hoặc deployment record gồm version, time, status, environment. |

## Ghi Chú BA Cho Technical Stories

- Technical stories vẫn phải có acceptance criteria như user-facing stories.
- API và DevOps stories nên được đưa vào backlog sớm vì các story Student/Teacher/Admin phụ thuộc vào nền tảng này.
- Với đồ án, có thể triển khai monitoring/backup/rollback ở mức nền tảng, không cần enterprise-grade ngay từ MVP.
