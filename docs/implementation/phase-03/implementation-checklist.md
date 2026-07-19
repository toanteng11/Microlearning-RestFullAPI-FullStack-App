# Phase 03 Implementation Checklist

## 1. Gate A - Ready To Code

- [x] Must/Should/Out of scope đã được mô tả.
- [x] BA requirement/use case/rule/acceptance IDs đã map.
- [x] Classroom/Credential/Enrollment lifecycle đã đặc tả.
- [x] API request/response/error/list contract đã draft.
- [x] Data/index/transaction/concurrency contract đã draft.
- [x] Permission/object-scope/threat controls đã draft.
- [x] Frontend routes/states/navigation đã draft.
- [x] WBS/test/evidence/risk baseline đã draft.
- [x] BA/Product Owner duyệt scope và API transport refinement ngày `2026-07-19`.
- [x] Technical decision review hoàn tất; P03-ADR-001..018 ở trạng thái `Accepted`.
- [x] QA/Security/DevOps perspectives đã review test, secrets, runtime và quality gates.
- [x] PR #5 merge tại `1e8ad41`, Actions run #11 đạt `6/6`; Gate A là `READY_TO_CODE`.

## 2. Gate B - Runtime And Data Foundation

- [x] P03 env schema fail-fast, không unsafe default.
- [x] Permission catalog/capabilities cập nhật có tests.
- [x] Classroom/Enrollment/ClassCode/InviteLink/SystemSetting models tồn tại.
- [x] Exact named indexes pass trên real Mongo replica set.
- [x] Policy bootstrap idempotent, không overwrite.
- [x] Crypto adapters generate/hash/HMAC đúng và injectable.
- [x] Pagination/query parser allowlist/stable order.
- [x] Logger/error/audit redaction bao phủ Code/Token.

## 3. Gate C - Classroom And Policy APIs

- [x] ACTIVE Teacher create; owner/status injection bị chặn.
- [x] Teacher/Student role-scoped list đúng.
- [x] Detail object access đúng.
- [x] Update/settings CAS và effective policy đúng.
- [x] Archive/open/close Must state machine đúng; `LOCKED` luôn chặn join và lock/unlock mutation absent/denied khi Should chưa duyệt.
- [x] Admin policy revision/audit đúng.
- [x] Admin governance list/detail safe/paginated.
- [x] Negative role/owner/state tests pass.

## 4. Gate D - Credentials And Join

- [x] Class Code format/HMAC/hash-only/raw-once đúng.
- [x] Code regenerate/disable atomically; old code invalid.
- [x] Invite Link hash-only/expiry/raw-once đúng.
- [x] Preview public minimal/no-store/rate-limited.
- [x] Join precedence global -> local -> credential -> actor/membership.
- [x] Valid Code/Link tạo one ACTIVE Enrollment.
- [x] Retry/concurrent join idempotent, no duplicate/audit trùng.
- [x] Removed/blocked membership không tự rejoin.
- [x] Transaction failure không partial.

## 5. Gate E - Roster And P02 Integration

- [x] Owner roster paginated/filter/sort safe projection.
- [x] Remove Student transition + reason + audit transaction.
- [x] Removed Student bị revoke Classroom access.
- [x] Wrong owner/role direct API denied.
- [x] ClassroomOwnershipReader port không phá module boundary.
- [x] Teacher block/deactivate active owner bị chặn atomically.
- [x] Optional transfer/lock absent/denied đúng baseline vì Should chưa approved.

## 6. Gate F - React Experiences

- [x] Teacher list/create/detail/settings/roster dùng API thật.
- [x] Student Code join/list/detail dùng API thật.
- [x] Invite link xóa token URL, giữ/clear/revalidate auth context đúng.
- [x] Admin policy/governance dùng API thật.
- [x] Loading/empty/error/forbidden/stale/success đầy đủ.
- [x] Back/Forward/breadcrumb giữ query context.
- [x] Mobile/desktop không overflow/overlap.
- [x] Labels/focus/dialog/status accessibility pass.
- [x] Browser storage/console/URL không credential sau flow.

## 7. Gate G - Quality And Exit

- [x] API unit/service/route coverage pass.
- [x] Real Mongo index/transaction/concurrency suites pass.
- [x] Web component/integration suites pass.
- [x] Playwright P03 Must journeys pass.
- [x] OpenAPI parse + exact P03 route coverage pass.
- [x] Docker images/Compose/API non-root healthy.
- [x] Seed/bootstrap idempotent và safe.
- [x] Dependency audit và runtime log/raw credential scan pass.
- [ ] Secret scan trên commit Phase 03 pass; chờ job Gitleaks của remote PR.
- [x] Clean Git clone onboarding pass từ repository snapshot không có secret/dependency/artifact cũ.
- [ ] `45/45` P03 acceptance criteria Pass; hiện `44/45`, còn remote AC-045.
- [x] Traceability/risk/evidence/exit report đã cập nhật cho local exit candidate.
- [ ] Remote CI URL và reviewer sign-off có thật.

## 8. Không Được Check Done Khi

- UI đang gọi mock hoặc hard-coded Classroom.
- Backend chỉ check role nhưng không check owner/Enrollment.
- Raw Code/Token còn trong DB/log/Audit/screenshot/artifact.
- Join concurrency chỉ test fake repository.
- Unique index/transaction chưa chạy replica set thật.
- Swagger thiếu route/schema/error.
- Tests bị skip/quarantine/continue-on-error không có approved issue.
- Should bị ghi Pass dù chưa implement.
- PR merge nhưng evidence/sign-off chưa cập nhật theo Definition of Done.
