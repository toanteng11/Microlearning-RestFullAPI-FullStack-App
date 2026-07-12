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
| GitHub required checks | Branch protection configured; `Secret scan` cần được thêm vào required checks sau khi workflow xuất hiện |

Phase 02 có thể bắt đầu analysis/technical design và local implementation. Merge governance trên remote chỉ hoàn chỉnh sau khi Pull Request đầu tiên chạy đủ `Lint, test and build`, `Production dependency audit` và `Secret scan`.

## 2. Decisions Phải Chốt Trước Auth Code

| Decision ID | Chủ đề | Câu hỏi cần trả lời | Owner |
| --- | --- | --- | --- |
| P02-D01 | Token storage | httpOnly cookie hay access token storage strategy nào phù hợp threat model? | Technical Lead/Security |
| P02-D02 | Session model | Refresh token rotation, reuse detection, revocation và logout thế nào? | Backend/Security |
| P02-D03 | Password | Argon2/bcrypt, length, compromised password và reset policy? | Backend/Security |
| P02-D04 | Registration | Student registration fields, email uniqueness/verification và abuse control? | BA/Product/Backend |
| P02-D05 | Teacher invitation | Token hash, one-time use, expiry, revoke và email matching? | BA/Backend/Security |
| P02-D06 | RBAC | Permission matrix cho Guest/Student/Teacher/Admin/Super Admin? | BA/Technical Lead |
| P02-D07 | Account state | `PENDING`, `ACTIVE`, `SUSPENDED`, `LOCKED` transition? | BA/Backend |
| P02-D08 | Rate limit | Login/register/invitation thresholds và response behavior? | Security/DevOps |

## 3. BA Trace Cần Review

- Authentication requirements và error codes.
- User Roles/Permissions.
- Student self-registration rule.
- Manual Teacher Invitation Link flow.
- Admin Student/Teacher/Admin separated lists.
- Security/NFR/acceptance criteria liên quan account/token/audit.

## 4. Phase 02 Entry Checklist

- [ ] P02 decisions có owner và acceptance impact.
- [ ] User/session/invitation data model được review.
- [ ] Auth API endpoints được thêm vào OpenAPI trước/đồng thời implementation.
- [ ] Negative authorization matrix được thiết kế.
- [ ] Frontend protected route/session restore design được review.
- [ ] Audit events cho invitation/account actions được xác định.
- [x] GitHub remote/branch protection được cấu hình trước merge đầu tiên.
- [ ] Required check `Secret scan` được thêm vào branch rule sau khi job xuất hiện trên GitHub.
