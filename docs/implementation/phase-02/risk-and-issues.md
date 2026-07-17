# Phase 02 Risks And Issues

## 1. Risk Scale

- Probability/Impact: Low, Medium, High.
- Rating High khi một chiều High và chiều còn lại ít nhất Medium, hoặc liên quan credential/privilege/data integrity.
- High risk chưa có mitigation/evidence chặn phase exit.

## 2. Risk Register

| ID | Risk | P/I | Trigger | Mitigation | Contingency/Owner |
| --- | --- | --- | --- | --- | --- |
| P02-R01 | XSS lấy access token trong memory | M/H | Token xuất hiện persistent storage/log | CSP/React escaping, memory-only, no debug log, dependency scan | Security review; block release |
| P02-R02 | Refresh replay hoặc concurrent refresh tự revoke | M/H | Multiple tabs refresh cùng cookie | Web Locks/BroadcastChannel, CAS, grace retry và outside-grace reuse tests | Force login; analyze session events / FE+BE |
| P02-R03 | CSRF trên refresh/logout | M/H | Cross-origin request được chấp nhận | SameSite Lax, same-site, Origin/Referer allowlist | Disable affected endpoint/deploy fix / Security |
| P02-R04 | Mongo standalone làm transaction không chạy | M/H | `Transaction numbers...` error | Replica set Local/CI before invitation code | Block T058; fix runtime / DevOps |
| P02-R05 | Argon2 native package fail Docker/CI | M/M | Install/build error | Verify package early PR-02A, multi-stage runtime test | Evaluate approved bcrypt fallback via ADR / Backend |
| P02-R06 | Permission quá rộng hoặc chỉ kiểm frontend | M/H | Wrong-role API returns data | Central middleware + endpoint declaration + direct API negative tests | Disable route, incident review / Backend |
| P02-R07 | Block User nhưng JWT cũ vẫn dùng được | M/H | Protected API trusts token status | Load current User each request + session revoke | Revoke all sessions/hotfix / Backend |
| P02-R08 | Invitation raw token lộ từ user-facing URL/body/log | M/H | Token string in log/evidence | Immediate URL cleanup, POST-body API, body redaction, log tests | Revoke invitation, review exposure / DevOps |
| P02-R09 | Không thể copy lại link do hash-only | H/M | Admin reloads before sending | One-time warning, immediate copy, revoke/create replacement | BA-approved rotate-link feature later / BA+FE |
| P02-R10 | Duplicate User/invitation do concurrency | M/H | Parallel requests create >1 record | User unique index, pending-email unique partial index, transaction/concurrency tests | Data repair + root-cause / Backend |
| P02-R11 | Rate limiter memory không nhất quán multi-replica | H/M later | API scaled >1 | Document single-instance boundary; shared store P07 | Limit replica=1 until shared store / DevOps |
| P02-R12 | Initial Admin credential bị commit/log | M/H | Bootstrap uses arg/env/log | Hidden prompt, disabled default, secret scan | Rotate/delete/rebootstrap; incident log / DevOps |
| P02-R13 | Forgot Password bị claim dù không delivery | H/M | UI/API placeholder marked done | Conditional Should and no public link response | Defer to provider decision / PO |
| P02-R14 | User list query chậm/regex abuse | M/M | p95 or CPU increases | Prefix/escaped bounded search, indexes, max limit | Disable broad search/add search index / Backend |
| P02-R15 | Teacher block thiếu ownership rule | H/M at P03 | Classroom domain introduced | Explicit extension port/readiness gate | P03 cannot exit until integrated / TL |
| P02-R16 | Audit chứa PII/token/request body | M/H | Redaction assertion fails | Allowlists, no generic body metadata | Purge restricted logs per incident policy / Security |
| P02-R17 | Swagger lệch code | M/M | Frontend/QA sees schema mismatch | same-PR contract, route coverage CI | Block merge / Backend+QA |
| P02-R18 | Auth E2E flaky | M/M | intermittent CI timeout | deterministic clock/data, readiness wait, trace on failure | Quarantine only with approved issue, not silent ignore / QA |
| P02-R19 | Concurrent privileged mutations làm mất Super Admin cuối | L/H | Hai target khác nhau cùng được demote/block | Fixed SystemGuard transaction + concurrent invariant test | Restore qua reviewed bootstrap/repair / Backend+Security |

## 3. Decision Closure

| Decision | Baseline | Status/date | Implementation review |
| --- | --- | --- | --- |
| Token/session model | P02-ADR-001/002 | Accepted `2026-07-15` | Auth PR security tests |
| Password/Argon2 params | P02-ADR-003 | Accepted `2026-07-15` | Benchmark + security review |
| Admin permission baseline | P02-ADR-004 | Accepted `2026-07-15` | Negative RBAC matrix |
| Transaction/replica set | P02-ADR-005 | Accepted `2026-07-15` | Real Mongo transaction tests |
| One-time invitation link UX | P02-ADR-006 | Accepted `2026-07-15` | Browser + redaction review |
| Bootstrap operation | P02-ADR-008 | Accepted `2026-07-15` | CLI/redaction review |
| Forgot/reset inclusion | Deferred from Must | Closed for baseline | Change Control before any reset code |

## 4. Issue Handling

- Issue có credential/token/privilege leak: stop affected merge/demo, revoke/rotate, preserve safe evidence và mở incident record.
- Data partial/duplicate: không sửa thủ công mơ hồ; viết repair plan/script có backup và review.
- Security test fail: không waiver bằng cách tắt test hoặc giảm assertion.
- Provider/dependency chưa có: ghi `Blocked` với owner; không tạo mock Production path rồi claim complete.

## 5. Residual Risks Expected At Exit

P02 có thể chấp nhận với ghi chú:

- IP limiter là process-local vì runtime vẫn một API replica.
- JWT key rotation automation và shared session/rate store chuyển Phase 07.
- Teacher ownership/offboarding integration chờ Classroom ở Phase 03.
- Forgot/reset password chờ delivery decision nếu chưa được scope vào.

Không chấp nhận residual risk về password/token raw exposure, privilege escalation, invalid account access hoặc invitation partial transaction.
