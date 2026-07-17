# Phase 02 Readiness

## 1. Foundation Readiness

| Điều kiện | Trạng thái |
| --- | --- |
| Web/API workspace build và test được | Ready |
| MongoDB/configuration foundation | Ready |
| Error/request ID/log contract | Ready |
| Swagger/OpenAPI contract foundation | Ready |
| Docker local integration | Ready |
| CI workflow file | Ready |
| GitHub required checks | Ready; quality, dependency audit và secret scan đã pass và được bảo vệ |

Phase 02 có thể bắt đầu analysis, technical design và implementation. Mọi thay đổi tiếp tục đi qua Pull Request với `Lint, test and build`, `Production dependency audit` và `Secret scan` là required checks.

## 2. Decisions Phải Chốt Trước Auth Code

| Decision ID | Chủ đề | Câu hỏi cần trả lời | Owner |
| --- | --- | --- | --- |
| P02-ADR-001 | Token storage | httpOnly cookie hay access token storage strategy nào phù hợp threat model? | Technical Lead/Security |
| P02-ADR-002 | Session model | Refresh token rotation, reuse detection, revocation và logout thế nào? | Backend/Security |
| P02-ADR-003 | Password | Argon2/bcrypt, length, compromised password và reset policy? | Backend/Security |
| P02-ADR-004 | Registration/RBAC | Student fields, permission và account state baseline nào? | BA/Product/Backend |
| P02-ADR-005 | Transaction | Collection, index, transaction và replica-set boundary nào? | Backend/DevOps |
| P02-ADR-006 | Teacher invitation | Token hash, one-time use, expiry, revoke và email matching? | BA/Backend/Security |
| P02-ADR-007 | Rate limit | Login/register/invitation thresholds và response behavior? | Security/DevOps |
| P02-ADR-008 | Bootstrap | Initial Super Admin được tạo an toàn thế nào? | DevOps/Security |

Các câu hỏi trên đã được khóa thành implementation baseline tại `../phase-02/technical-decisions.md`, `../phase-02/security-session-and-rbac.md` và `../phase-02/data-model-and-indexes.md` ngày 2026-07-15. Từng auth Pull Request vẫn phải qua security assertions và required CI checks trước khi merge.

## 3. BA Trace Cần Review

- Authentication requirements và error codes.
- User Roles/Permissions.
- Student self-registration rule.
- Manual Teacher Invitation Link flow.
- Admin Student/Teacher/Admin separated lists.
- Security/NFR/acceptance criteria liên quan account/token/audit.

## 4. Phase 02 Entry Checklist

- [x] P02 ADR có owner workstream và acceptance impact.
- [x] User/session/invitation data model và concurrency invariant được review.
- [x] Auth API contract đủ schema để OpenAPI triển khai cùng code.
- [x] Negative authorization matrix được thiết kế.
- [x] Frontend protected route/session restore/multi-tab design được review.
- [x] Audit events cho invitation/account actions được xác định.
- [x] GitHub remote/branch protection được cấu hình trước merge đầu tiên.
- [x] Required check `Secret scan` được thêm vào branch rule sau khi job xuất hiện trên GitHub.
