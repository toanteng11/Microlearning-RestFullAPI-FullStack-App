# Non-Functional Requirements Catalog

## Mục Đích

Tài liệu này tổng hợp các Non-Functional Requirements theo mã định danh để Dev, QA, DevOps và Product Owner dễ trace, review và kiểm thử.

## Catalog Tổng Hợp

| NFR ID | Nhóm | Requirement | Priority | Cách đo / Bằng chứng | Owner |
| --- | --- | --- | --- | --- | --- |
| NFR-SEC-001 | Security | Password phải được hash bằng thuật toán an toàn trước khi lưu. | Must | Database không có plain text password. | Backend Lead |
| NFR-SEC-002 | Security | JWT/access token và refresh token phải có expiry rõ ràng. | Must | Token hết hạn đúng policy; test refresh/logout. | Backend Lead |
| NFR-SEC-003 | Security | Refresh token/reset token/invitation token không lưu raw token. | Must | Database chỉ lưu hash/token digest. | Backend Lead |
| NFR-SEC-004 | Security | RBAC và object-level authorization phải áp dụng cho API protected. | Must | Security test theo Student/Teacher/Admin. | Backend Lead |
| NFR-SEC-005 | Security | Teacher Invitation Link phải one-time, có expiry, revoke và email matching. | Must | Test accept/revoke/expired/mismatch. | Backend Lead |
| NFR-SEC-006 | Security | API phải validate input và chống NoSQL injection cơ bản. | Must | Validation test; không truyền raw query nguy hiểm vào MongoDB. | Backend Lead |
| NFR-SEC-007 | Security | Registration, login, invitation, reset password và join endpoint phải có rate limiting phù hợp theo IP/identity; sau 5 lần login thất bại liên tiếp cho cùng identity trong 15 phút, hệ thống áp dụng cooldown 15 phút và chỉ trả thông báo chung. | Must | Burst register/auth/join test trả 429 hoặc lỗi chung phù hợp; login cooldown hoạt động; không lộ account tồn tại hay không. | Backend Lead / DevOps |
| NFR-SEC-008 | Security | API error production không trả stack trace hoặc secrets. | Must | Error response review. | Backend Lead |
| NFR-SEC-009 | Security | File upload phải validate type, size và ownership. | Must nếu upload in MVP | Upload invalid file bị chặn. | Backend Lead |
| NFR-SEC-010 | Security | Critical admin/teacher actions phải ghi AuditLog. | Must | AuditLog có record cho action test. | Backend Lead |
| NFR-SEC-011 | Security | Password mới phải dài 12-128 ký tự, không được có khoảng trắng đầu/cuối, không bị cắt ngầm, không bắt buộc đổi định kỳ; thông báo validate/reset/login không được tiết lộ account tồn tại. | Must | Boundary test 11/12/128/129 ký tự, space đầu/cuối, message enumeration-safe và reset flow. | Backend Lead + QA Lead |
| NFR-SEC-012 | Security | Browser auth dùng access JWT ngắn hạn chỉ trong memory; opaque refresh token chỉ ở cookie `HttpOnly`, `Secure` (Staging/Cloud), `SameSite=Lax`, `Path=/api/v1/auth`; token được hash khi lưu, rotate mỗi refresh và revoke theo session family khi logout, reuse, password reset hoặc account bị block. | Must | Browser/API security test xác nhận không có token trong localStorage/sessionStorage, refresh rotation/reuse revoke hoạt động, cookie attribute/CORS/Origin-Referer policy đúng và Cloud không chấp nhận cross-site mặc định. | Backend Lead + Frontend Lead + Security Reviewer |
| NFR-PERF-001 | Performance | Simple read API p95 <= 800ms ở MVP/staging baseline. | Should | API performance test. | Backend Lead |
| NFR-PERF-002 | Performance | Dashboard aggregate API p95 <= 1500ms với dataset MVP. | Should | Test Student/Teacher/Admin dashboard. | Backend Lead |
| NFR-PERF-003 | Performance | Frontend initial app load nên <= 3s trên network tốt ở staging. | Should | Lighthouse/manual measurement. | Frontend Lead |
| NFR-PERF-004 | Performance | List endpoint phải có pagination, default limit hợp lý. | Must | API contract và test list. | Backend Lead |
| NFR-PERF-005 | Performance | MongoDB indexes phải hỗ trợ query chính: user list, to-do, course dashboard, audit log. | Must | Index review và query plan nếu cần. | Backend Lead |
| NFR-SCL-001 | Scalability | Backend service nên stateless để có thể scale horizontal. | Should | Không phụ thuộc local memory cho session chính. | Technical Lead |
| NFR-SCL-002 | Scalability | File upload/storage không được làm backend block lâu. | Should | Upload flow có limit và timeout. | Backend Lead |
| NFR-AVL-001 | Availability | Staging/demo API có health endpoint `/health`. | Must | Health check trả UP/DEGRADED/DOWN. | DevOps |
| NFR-AVL-002 | Availability | Cloud deployment phải có smoke test sau deploy. | Must | CI/CD hoặc manual checklist. | DevOps / QA |
| NFR-AVL-003 | Availability | Production direction uptime target >= 99.5% nếu triển khai thật. | Could | Monitoring report. | DevOps |
| NFR-REL-001 | Reliability | MongoDB phải có backup strategy cơ bản. | Must | Backup file/snapshot tồn tại. | DevOps |
| NFR-REL-002 | Reliability | Restore process phải được test tối thiểu trước demo/release quan trọng. | Should | Restore checklist/result. | DevOps |
| NFR-REL-003 | Reliability | Deploy lỗi phải có rollback plan. | Must | Rollback procedure document/test. | DevOps |
| NFR-REL-004 | Reliability | Mutation quan trọng không được làm mất progress/submission/grade. | Must | Regression test. | Backend Lead / QA |
| NFR-MNT-001 | Maintainability | API response format và error format phải nhất quán. | Must | API review theo mục 11. | Backend Lead |
| NFR-MNT-002 | Maintainability | Swagger/OpenAPI phải cập nhật khi API thay đổi. | Must | Swagger quality gate. | Backend Lead |
| NFR-MNT-003 | Maintainability | Config môi trường phải dùng env variables, không hard-code secrets. | Must | Code/config review. | DevOps |
| NFR-MNT-004 | Maintainability | Code nên tổ chức theo module/domain rõ ràng. | Should | Code review. | Technical Lead |
| NFR-MNT-005 | Maintainability | CI phải chạy build/test/lint tối thiểu nếu có. | Should | CI pipeline result. | DevOps |
| NFR-PRV-001 | Privacy | API không trả passwordHash, tokenHash, raw token hoặc secrets. | Must | API response review. | Backend Lead |
| NFR-PRV-002 | Privacy | Student chỉ xem dữ liệu học tập của chính mình và Classroom đã enroll. | Must | Access control test. | Backend Lead / QA |
| NFR-PRV-003 | Privacy | Teacher chỉ xem roster/progress/grade của Classroom/Course mình có quyền. | Must | Access control test. | Backend Lead / QA |
| NFR-PRV-004 | Privacy | Admin action nhạy cảm phải có audit reason nếu phù hợp. | Should | AuditLog review. | Backend Lead |
| NFR-LOG-001 | Logging | API request cần có requestId/correlationId để trace. | Should | Log sample có requestId. | Backend Lead |
| NFR-LOG-002 | Logging | Error logs phải đủ context nhưng không chứa secrets. | Must | Log review. | Backend Lead / DevOps |
| NFR-LOG-003 | Logging | AuditLog bắt buộc cho invitation, role change, user status, deadline reset, grading. | Must | AuditLog test. | Backend Lead |
| NFR-MON-001 | Monitoring | Monitor API uptime, latency, error rate và MongoDB health. | Should | Dashboard/monitoring config. | DevOps |
| NFR-MON-002 | Monitoring | Alert khi health DOWN, error rate tăng cao hoặc failed login spike. | Could | Alert rule. | DevOps |
| NFR-USA-001 | Usability | Student Dashboard phải hiển thị To-do rõ, không để user lạc hướng. | Must | UAT Student scenario. | Frontend Lead / QA |
| NFR-USA-002 | Usability | Các màn hình chính phải có loading/empty/error state. | Must | UI state test. | Frontend Lead / QA |
| NFR-ACC-001 | Accessibility | Form chính phải có label, keyboard navigation và error message rõ. | Should | Accessibility checklist. | Frontend Lead |
| NFR-ACC-002 | Accessibility | Status quan trọng không chỉ dựa vào màu. | Must | UI review. | Frontend Lead |

## NFR Must-Have Cho MVP

MVP không nên release/demo nếu thiếu các nhóm Must sau:

- Password hashing.
- RBAC và object-level authorization.
- Teacher invitation token security.
- API validation và error response chuẩn.
- Pagination cho list lớn.
- Health endpoint.
- Basic backup strategy.
- Không expose secrets/token/passwordHash.
- Student/Teacher/Admin access control test.
- AuditLog cho admin/teacher action quan trọng.
- Student To-do và dashboard có loading/empty/error state.

## Trace Với Các Section Khác

| NFR group | Section liên quan |
| --- | --- |
| Security/RBAC | `05-user-roles`, `07-requirements`, `11-api-requirements` |
| Performance | `10-data-requirements`, `11-api-requirements`, `12-ui-ux-requirements` |
| Availability/Reliability | `../11-api-requirements/api-health-devops.md`, `../15-devops-deployment/` |
| Privacy | `../10-data-requirements/data-retention-privacy.md` |
| Logging/Monitoring | `17-business-rules`, `18-acceptance-criteria`, `15-devops-deployment` |
| Usability/Accessibility | `12-ui-ux-requirements` |
