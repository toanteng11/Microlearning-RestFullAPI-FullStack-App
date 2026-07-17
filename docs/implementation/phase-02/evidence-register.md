# Phase 02 Evidence Register

## 1. Quy tắc

File này được cập nhật khi triển khai. Không đưa password, access/refresh token, invitation link, cookie value, Mongo URI hoặc dữ liệu cá nhân thật vào evidence.

Baseline local được kiểm chứng ngày `2026-07-17` trên branch `phase-02-quality-release`, commit code `ff0e5fd`. Chi tiết command/result đã khử dữ liệu nhạy cảm nằm trong `phase-exit-evidence.md`.

## 2. Evidence Catalog

| Evidence ID | Nội dung cần chứng minh | Trạng thái | Link/path/result |
| --- | --- | --- | --- |
| P02-EVD-API-001 | Register/login/profile API | Local Pass | `tests/integration/auth.integration.test.ts`; API unit total `73/73` |
| P02-EVD-API-002 | Refresh/logout/reuse | Local Pass | Auth integration: rotation, grace race, outside-grace reuse, logout |
| P02-EVD-API-003 | Admin list/status/role | Local Pass | `admin-users.integration.test.ts`: role separation, atomic status/role |
| P02-EVD-API-004 | Invitation state/concurrency transaction | Local Pass | `teacher-invitations.integration.test.ts`: `6/6` |
| P02-EVD-API-005 | Invitation/final Super Admin invariants | Local Pass | Concurrent create/accept và concurrent Super Admin block tests |
| P02-EVD-DATA-001 | Required indexes/unique/partial/TTL | Local Pass | `data-indexes.integration.test.ts`: `2/2`, named index + duplicate behavior |
| P02-EVD-DATA-002 | Replica set transaction behavior | Local Pass | Integration total `21/21`; commit/rollback; Mongo `rs0` primary |
| P02-EVD-WEB-001 | Login/Register/Profile components | Local Pass | Web test total `48/48`; auth/profile suites pass |
| P02-EVD-WEB-002 | Admin list/invitation components | Local Pass | Loading/empty/error/filter/detail/copy/revoke/activate states pass |
| P02-EVD-WEB-003 | Student/Admin/Teacher E2E | Local Pass | `tests/e2e/phase-02-critical-journeys.spec.ts`: `4/4` |
| P02-EVD-WEB-004 | Desktop/mobile/accessibility review | Local Pass | Browser review: no horizontal overflow; labeled controls; no console error |
| P02-EVD-WEB-005 | Multi-tab refresh/race grace | Local Pass | Two-tab reload E2E + outside-grace API reuse test |
| P02-EVD-SEC-001 | Password/hash/token DB safety | Local Pass | Argon2id/hash-only assertions in auth/invitation integration suites |
| P02-EVD-SEC-002 | Cookie attributes/browser storage | Local Pass | E2E confirms HttpOnly, SameSite=Lax, auth path, no persistent token |
| P02-EVD-SEC-003 | Negative role/status/permission matrix | Local Pass | `authenticate.test.ts`, Admin/Invitation direct API denial tests |
| P02-EVD-SEC-004 | Rate/cooldown boundaries | Local Pass | Five failures then cooldown; password boundary unit/integration tests |
| P02-EVD-SEC-005 | Log/AuditLog redaction | Local Pass | `logger.test.ts`; runtime log scan found no password/bearer/raw invitation token |
| P02-EVD-DOC-001 | OpenAPI parse/route coverage | Local Pass | `app.test.ts`: `6/6`; 19 P02 operations mapped; Swagger shows 24 total |
| P02-EVD-OPS-001 | Docker build/non-root/health | Local Pass | Web/API build; Web/API/Mongo healthy; API `uid=1000(node)` |
| P02-EVD-OPS-002 | Remote required checks | Remote Pending | Điền Pull Request run URL sau khi push/open PR |
| P02-EVD-OPS-003 | Bootstrap/seed idempotency | Local Pass | Bootstrap `created true -> false`; seed `5/0 -> 0/5`; no credential output |
| P02-EVD-OPS-004 | Clean-clone onboarding | Local Pass | `npm ci`, check/build, replica init, bootstrap, seed, integration/E2E pass |
| P02-EVD-OPS-005 | Auth environment fail-fast | Local Pass | `environment.test.ts`: `10/10`; Production/origin/secret/range guards |
| P02-EVD-DOC-002 | Traceability/checklist/exit package | Local Complete | Tài liệu cập nhật; formal reviewer sign-off chờ remote CI |
| P02-EVD-DOC-003 | Development readiness Gate A | Complete | `development-readiness-review.md` ngày `2026-07-15` |

## 3. Evidence Quality

- Command evidence ghi commit SHA, environment và result chính.
- Screenshot che token/cookie value/email cá nhân; chỉ giữ attributes/behavior cần thiết.
- CI evidence link đúng run/PR, không chỉ Actions homepage.
- Test artifact phải truy ngược được tới build/commit.
- DB evidence dùng synthetic data và chỉ show hash presence/type, không raw credential.

## 4. Remote Closure Slot

Sau khi Pull Request chạy xong, bổ sung đúng bốn trường sau mà không sửa local result:

- Pull Request URL.
- GitHub Actions run URL gắn đúng commit tài liệu cuối.
- Tên và trạng thái các required checks.
- Reviewer/approval/date trong `exit-report.md`.
