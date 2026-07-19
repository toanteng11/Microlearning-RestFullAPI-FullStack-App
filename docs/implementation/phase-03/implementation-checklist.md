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
- [ ] Planning PR merge và Gate A đổi `READY_TO_CODE`.

## 2. Gate B - Runtime And Data Foundation

- [ ] P03 env schema fail-fast, không unsafe default.
- [ ] Permission catalog/capabilities cập nhật có tests.
- [ ] Classroom/Enrollment/ClassCode/InviteLink/SystemSetting models tồn tại.
- [ ] Exact named indexes pass trên real Mongo replica set.
- [ ] Policy bootstrap idempotent, không overwrite.
- [ ] Crypto adapters generate/hash/HMAC đúng và injectable.
- [ ] Pagination/query parser allowlist/stable order.
- [ ] Logger/error/audit redaction bao phủ Code/Token.

## 3. Gate C - Classroom And Policy APIs

- [ ] ACTIVE Teacher create; owner/status injection bị chặn.
- [ ] Teacher/Student role-scoped list đúng.
- [ ] Detail object access đúng.
- [ ] Update/settings CAS và effective policy đúng.
- [ ] Archive/open/close Must state machine đúng; `LOCKED` luôn chặn join và lock/unlock mutation absent/denied khi Should chưa duyệt.
- [ ] Admin policy revision/audit đúng.
- [ ] Admin governance list/detail safe/paginated.
- [ ] Negative role/owner/state tests pass.

## 4. Gate D - Credentials And Join

- [ ] Class Code format/HMAC/hash-only/raw-once đúng.
- [ ] Code regenerate/disable atomically; old code invalid.
- [ ] Invite Link hash-only/expiry/raw-once đúng.
- [ ] Preview public minimal/no-store/rate-limited.
- [ ] Join precedence global -> local -> credential -> actor/membership.
- [ ] Valid Code/Link tạo one ACTIVE Enrollment.
- [ ] Retry/concurrent join idempotent, no duplicate/audit trùng.
- [ ] Removed/blocked membership không tự rejoin.
- [ ] Transaction failure không partial.

## 5. Gate E - Roster And P02 Integration

- [ ] Owner roster paginated/filter/sort safe projection.
- [ ] Remove Student transition + reason + audit transaction.
- [ ] Removed Student bị revoke Classroom access.
- [ ] Wrong owner/role direct API denied.
- [ ] ClassroomOwnershipReader port không phá module boundary.
- [ ] Teacher block/deactivate active owner bị chặn atomically.
- [ ] Optional transfer/lock chỉ check khi Should approved.

## 6. Gate F - React Experiences

- [ ] Teacher list/create/detail/settings/roster dùng API thật.
- [ ] Student Code join/list/detail dùng API thật.
- [ ] Invite link xóa token URL, giữ/clear/revalidate auth context đúng.
- [ ] Admin policy/governance dùng API thật.
- [ ] Loading/empty/error/forbidden/stale/success đầy đủ.
- [ ] Back/Forward/breadcrumb giữ query context.
- [ ] Mobile/desktop không overflow/overlap.
- [ ] Labels/focus/dialog/status accessibility pass.
- [ ] Browser storage/console/URL không credential sau flow.

## 7. Gate G - Quality And Exit

- [ ] API unit/service/route coverage pass.
- [ ] Real Mongo index/transaction/concurrency suites pass.
- [ ] Web component/integration suites pass.
- [ ] Playwright P03 Must journeys pass.
- [ ] OpenAPI parse + exact P03 route coverage pass.
- [ ] Docker images/Compose/API non-root healthy.
- [ ] Seed/bootstrap idempotent và safe.
- [ ] Secret scan/dependency audit/log scan pass.
- [ ] Clean-clone onboarding pass.
- [ ] `45/45` P03 acceptance criteria Pass.
- [ ] Traceability/risk/evidence/exit report cập nhật.
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
