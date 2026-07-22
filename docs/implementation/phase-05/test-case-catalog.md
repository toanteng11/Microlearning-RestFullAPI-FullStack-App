# Phase 05 Test Case Catalog

## 1. Mục Đích

Catalog này định nghĩa case tối thiểu trước khi implementation. Test ID là ổn định để dùng trong WBS, Pull Request, acceptance evaluation và evidence. Đổi behavior phải cập nhật catalog cùng contract, không chỉ sửa assertion cho xanh.

## 2. Test Harness Rules

- Unit policy dùng fixed `now`, pure fixtures và không Mongo/network.
- Integration dùng MongoDB replica set thật, collection/database test riêng và transaction thật.
- Mỗi test tự tạo actor/scope/data cần thiết; không phụ thuộc thứ tự chạy.
- ID/ObjectId/email/content đều synthetic.
- Không snapshot raw Attempt scoring key, Submission body hoặc Feedback vào CI artifact.
- Concurrency test phải thực sự chạy promises đồng thời và assert final database state.
- API test assert status, stable `error.code`, envelope và forbidden fields.
- Test timeout/date dùng exact UTC boundary: trước, bằng và sau deadline.

## 3. Unit Policy Minimum Set

| Group | Case bắt buộc |
| --- | --- |
| Quiz lifecycle | Mọi allowed/denied transition; effective scheduled publish; first-publish due rule |
| Publish prerequisite | 0 Question, invalid Question, zero/max score, short-answer + immediate release |
| Question | Bốn discriminated types, duplicate options, exact correct set, point/text limits |
| Scoring | Correct/wrong/unanswered từng type; duplicate selected IDs; integer total |
| Final score | `HIGHEST`, tie by submittedAt then ID, ignore `NEEDS_REVIEW` |
| Attempt eligibility | Enrollment, visibility, availability, due, attempt limit, active resume |
| Timeout | No limit, time limit, deadline min, exact expiry boundary |
| Assignment | Lifecycle, required due, allowed methods, FILE hard-disabled |
| Submission | Draft completeness, late boundary, unsubmit/resubmit policy |
| Grade | Score range, evidence revision, draft/return/regrade reason |
| Deadline | Override precedence, extend-only, future/reason validation, revoke |
| Derived progress | Quiz finalize, Assignment turn-in/unsubmit, required denominator |

Unit files theo `source-file-blueprint.md`; mỗi pure policy branch phải có positive và negative assertion.

## 4. Mongo/API Integration Cases `P05-IT-001..074`

### 4.1 Data Foundation `P05-IT-001..008`

| ID | File group | Setup/action | Expected assertion |
| --- | --- | --- | --- |
| `P05-IT-001` | data-foundation | Sync P05 model indexes | Tất cả named indexes tồn tại đúng key/options |
| `P05-IT-002` | data-foundation | Insert invalid Quiz/Assignment lifecycle fields | Mongoose validation từ chối, không persist partial row |
| `P05-IT-003` | data-foundation | Insert invalid Question union/options | Type-specific model validation từ chối |
| `P05-IT-004` | data-foundation | Tạo hai current Submissions cùng natural key | Unique index chặn duplicate |
| `P05-IT-005` | data-foundation | Tạo hai current Grades cùng Student/activity | Unique index chặn duplicate |
| `P05-IT-006` | data-foundation | Tạo hai active deadline exceptions cùng key | Unique index chặn duplicate |
| `P05-IT-007` | data-foundation | Nâng learning_progress activity type | Lesson row cũ vẫn đọc được; Quiz/Assignment rows hợp lệ |
| `P05-IT-008` | data-foundation | Model/repository projection scan | Schema version/timestamps/immutable ownership fields đúng |

### 4.2 Quiz And Question Authoring `P05-IT-009..016`

| ID | Setup/action | Expected assertion |
| --- | --- | --- |
| `P05-IT-009` | Teacher owner tạo Quiz | `201`, DRAFT defaults, revision=1, audit safe |
| `P05-IT-010` | Teacher khác/Student tạo hoặc đọc Teacher Quiz | Safe deny, không leak title/owner |
| `P05-IT-011` | List Quiz với filter/page/sort | Stable order + `_id`, envelope `data.items/meta` |
| `P05-IT-012` | Concurrent Quiz update cùng revision | Một update thắng; request stale nhận `409` |
| `P05-IT-013` | CRUD đủ bốn Question types | Stable option IDs, aggregate revision/maxScore đúng |
| `P05-IT-014` | Invalid options/correct set/points/media host | `422` stable details; không mutate aggregate |
| `P05-IT-015` | Reorder exact set và concurrent stale reorder | Atomic order, revision tăng một; thiếu/thừa ID bị từ chối |
| `P05-IT-016` | Publish valid/invalid Quiz và Student projection | Prerequisite/lifecycle đúng; Student JSON không có scoring key/rubric |

### 4.3 Attempt Start, Save, Submit And Timeout `P05-IT-017..026`

| ID | Setup/action | Expected assertion |
| --- | --- | --- |
| `P05-IT-017` | Active enrolled Student start published Quiz | `201`, immutable snapshot, progress IN_PROGRESS |
| `P05-IT-018` | Hai concurrent start requests | Một active attempt; response còn lại resume cùng ID |
| `P05-IT-019` | Retry start khi active | `200`, `resumed=true`, attempt limit không tăng |
| `P05-IT-020` | Start ngoài scope/unpublished/before available/after due/limit | Stable deny code; không tạo Attempt |
| `P05-IT-021` | Save valid bounded answer batch | Revision/lastSavedAt tăng, answer canonical persist |
| `P05-IT-022` | Save foreign Question/Option, score field hoặc oversized text | `422`, không persist manipulated payload |
| `P05-IT-023` | Concurrent/stale answer saves | Không overwrite answer mới; stale request `409` |
| `P05-IT-024` | Submit objective attempt | Exactly-once terminal state, server score/progress complete |
| `P05-IT-025` | Concurrent/double submit | Một finalization/Grade/progress effect; replay deterministic hoặc stable conflict |
| `P05-IT-026` | Read/save/submit tại và sau expiry | Lazy reconciliation dùng server time; answers freeze; state canonical |

### 4.4 Scoring, Review And Result Release `P05-IT-027..034`

| ID | Setup/action | Expected assertion |
| --- | --- | --- |
| `P05-IT-027` | Single choice correct/wrong/unanswered fixtures | Integer points chính xác |
| `P05-IT-028` | Multiple choice exact/partial/extra/duplicate selection | Chỉ exact normalized set nhận điểm |
| `P05-IT-029` | True/false canonical fixtures | Correct mapping và score đúng |
| `P05-IT-030` | Mixed Quiz có Short Answer submit | State `NEEDS_REVIEW`; không fake final zero result |
| `P05-IT-031` | Teacher save partial manual review | Review revision tăng; Student chưa thấy draft score/feedback |
| `P05-IT-032` | Finalize incomplete/complete review | Incomplete bị chặn; complete tính total và final candidate |
| `P05-IT-033` | Release policies IMMEDIATE/AFTER_REVIEW/TEACHER_RETURN | Student visibility đúng từng policy |
| `P05-IT-034` | Nhiều final attempts + regrade | `HIGHEST` và tie-break deterministic; history/audit append-only |

### 4.5 Assignment And Submission `P05-IT-035..044`

| ID | Setup/action | Expected assertion |
| --- | --- | --- |
| `P05-IT-035` | Teacher owner create/list/detail/update Assignment | Revision, scope, pagination và audit đúng |
| `P05-IT-036` | Publish/schedule/close/reopen/archive transitions | Preconditions/reason/effective status đúng |
| `P05-IT-037` | FILE or disabled LINK/MARK_DONE config/payload | `FEATURE_NOT_ENABLED`/validation; no fake storage data |
| `P05-IT-038` | Student detail outside/inside visible scope | Only active enrolled Student sees Student-safe DTO |
| `P05-IT-039` | First draft create bằng expected revision 0 | Một current Submission, revision 1 |
| `P05-IT-040` | Concurrent first save/update stale revision | Unique/CAS chặn duplicate/lost update |
| `P05-IT-041` | Turn in before, exactly at, after due với late enabled/disabled | submittedAt/effective due/late state dùng server clock |
| `P05-IT-042` | Double/concurrent turn-in | Một append-only revision/event; canonical replay/conflict |
| `P05-IT-043` | Unsubmit/resubmit trước return | Current state/revision/history và progress reversal đúng |
| `P05-IT-044` | Submission roster gồm assigned/draft/submitted/late/missing | Derived rows đủ active roster, không placeholder documents |

### 4.6 Grade, Return, Regrade And Privacy `P05-IT-045..052`

| ID | Setup/action | Expected assertion |
| --- | --- | --- |
| `P05-IT-045` | Save valid Grade draft | Score bounds/evidence revision/current Grade đúng |
| `P05-IT-046` | Save invalid score hoặc stale evidence/Grade revision | `422/409`, current Grade không bị overwrite |
| `P05-IT-047` | Return work success | Grade + Submission/result visibility đổi atomic, history/audit đúng |
| `P05-IT-048` | Inject failure giữa return transaction | Rollback toàn bộ; Student không thấy Grade nửa chừng |
| `P05-IT-049` | Regrade với reason | Revision/history/old-new score và audit metadata đúng |
| `P05-IT-050` | Teacher khác/Admin thường đọc private Grade/Submission | Safe deny; no body/feedback leak |
| `P05-IT-051` | Student list/detail own Grades | Chỉ `RETURNED/RELEASED` own rows, stable pagination |
| `P05-IT-052` | Student request foreign/draft Grade | Safe `404`; recursive JSON không có foreign identity/private draft |

### 4.7 Deadline Exception `P05-IT-053..060`

| ID | Setup/action | Expected assertion |
| --- | --- | --- |
| `P05-IT-053` | Set extension cho Lesson | Current/history/revision/audit và effective due đúng |
| `P05-IT-054` | Set extension cho Quiz | Attempt eligibility/expiry dùng exception |
| `P05-IT-055` | Set extension cho Assignment | Turn-in/late/missing dùng exception |
| `P05-IT-056` | Normal Teacher gửi shortening/past/invalid reason | Denied, không mutate current/history |
| `P05-IT-057` | Concurrent set cùng expected revision | Một update thắng; stale `409` |
| `P05-IT-058` | Revoke active/already revoked exception | Effective due fallback default; history append-only/idempotency rõ |
| `P05-IT-059` | List/current/history filter/page/sort | Teacher owned scope, stable order, no private work data |
| `P05-IT-060` | Student A có exception, Student B không có | A/B deadline/status khác đúng; không cross-student side effect |

### 4.8 Mixed Read Models And Progress `P05-IT-061..068`

| ID | Setup/action | Expected assertion |
| --- | --- | --- |
| `P05-IT-061` | Classwork có Lesson/Quiz/Assignment | Descriptor V2, stable mixed order và action URLs đúng |
| `P05-IT-062` | To-do trước/sau Quiz finalize | Quiz được thêm/xóa đúng completion policy; scope version V2 |
| `P05-IT-063` | To-do trước/sau Assignment turn-in/unsubmit | Assignment được xóa/thêm lại đúng |
| `P05-IT-064` | Deadlines filters mixed activities | Effective due/exception indicator/sort/descriptor version đúng |
| `P05-IT-065` | Student own progress mixed required activities | Numerator/denominator/percentage + metric version đúng |
| `P05-IT-066` | Teacher dashboard/activities/students/progress | Dùng metric P05, không weighted Grade score |
| `P05-IT-067` | Admin Course list/detail | Chỉ lifecycle counts; không Question/Attempt/Submission/Grade fields |
| `P05-IT-068` | P04 Lesson regression dataset | Existing Lesson completion/Classwork/To-do behavior còn đúng |

### 4.9 Migration, Rollback, Reconciliation And Explain `P05-IT-069..074`

| ID | Setup/action | Expected assertion |
| --- | --- | --- |
| `P05-IT-069` | Expand index/schema on P04-like dataset | Existing rows đọc/ghi được trong compatibility window |
| `P05-IT-070` | Migration preflight duplicates/invalid rows | Dry-run phát hiện và báo safe counts, không mutate |
| `P05-IT-071` | Run migration/reconciliation twice | Idempotent, second run zero unintended changes |
| `P05-IT-072` | Rollback compatibility test | Old P04 route/read path vẫn hoạt động theo rollback plan |
| `P05-IT-073` | Reconcile expired attempts/derived progress | Canonical state/count đúng, không duplicate audit/grade |
| `P05-IT-074` | Explain key list/result/roster/todo queries | Expected named indexes, không COLLSCAN ngoài documented allowlist |

## 5. OpenAPI Contract Cases

| ID | Assertion |
| --- | --- |
| `P05-OAS-001` | Exactly 52 P05 operation IDs unique và có path/method runtime tương ứng |
| `P05-OAS-002` | Mọi protected operation dùng `bearerAuth`; no fake cookie security |
| `P05-OAS-003` | Mọi operation có 2xx và relevant 401/403/404/409/422/429 responses |
| `P05-OAS-004` | Request examples pass Zod/runtime schema hoặc fixture equivalent |
| `P05-OAS-005` | List schemas dùng `data.items + meta`, không top-level pagination P05 |
| `P05-OAS-006` | Error schema có `error.details[]` và `meta.requestId/timestamp/path` |
| `P05-OAS-007` | Student schemas recursively exclude correct key/rubric/private Grade/foreign work |
| `P05-OAS-008` | Conditional operations document `FEATURE_NOT_ENABLED`; Swagger seed examples execute |

## 6. React Component/Page Cases

| ID range | Coverage tối thiểu |
| --- | --- |
| `P05-WEB-001..004` | Quiz create/builder type validation, reorder, publish prerequisite, conflict recovery |
| `P05-WEB-005..008` | Student intro/start reason, player save queue/revision, expiry, submit review |
| `P05-WEB-009..011` | Teacher result filters/manual review/finalize/regrade states |
| `P05-WEB-012..015` | Assignment methods/feature off, draft, turn-in, unsubmit/resubmit/history |
| `P05-WEB-016..018` | Roster/grader/return and Student returned-only Grade states |
| `P05-WEB-019..020` | Deadline exception validation/history/conflict và mixed learning views |

Mỗi range phải gồm loading, empty nếu áp dụng, API error mapping và forbidden/not-found state. Test dùng mocked `request` boundary nhưng production component không import mock implementation.

## 7. Browser E2E `P05-E2E-01..12`

| ID | Journey | Assertions chính |
| --- | --- | --- |
| `P05-E2E-01` | Teacher create objective Quiz -> add/reorder -> preview -> publish | UI/API lifecycle, Back/breadcrumb và Student-safe preview |
| `P05-E2E-02` | Student intro -> start -> save -> refresh/resume -> submit -> immediate result | Persist answers/revision, To-do/progress refresh |
| `P05-E2E-03` | Mixed Quiz -> Teacher review/finalize/return -> Student result | Pending không fake score; released visibility đúng |
| `P05-E2E-04` | Attempt limit/expiry/double-submit negative | Disabled reasons/stable errors/no duplicate result |
| `P05-E2E-05` | Teacher create Assignment -> Student draft/turn-in -> Teacher roster | Content/revision/status/roster row đúng |
| `P05-E2E-06` | Late enabled/disabled/closed variants | Effective state và action availability đúng |
| `P05-E2E-07` | Student unsubmit/resubmit -> history/current/To-do | Completion reversal và history retained |
| `P05-E2E-08` | Teacher grade/return/regrade -> Student own Grade | Draft privacy, returned visibility, revised score |
| `P05-E2E-09` | Extend Student A deadline | A/B distinct deadline/status; history/revoke đúng |
| `P05-E2E-10` | Cross-scope Teacher/Student deep links | Safe deny và no private DOM/network payload |
| `P05-E2E-11` | Mixed Lesson/Quiz/Assignment Classwork/To-do/Progress | Correct action URLs và metric version |
| `P05-E2E-12` | Mobile 390x844 + desktop navigation/unsaved/error states | No overflow/overlap, focus/keyboard, Back/Next, unsaved warning |

`P05-E2E-12` nằm trong responsive spec với viewport cục bộ; không cần nhân đôi toàn bộ existing suite thành mobile project.

## 8. Performance Cases

| ID | Dataset/query | Pass condition |
| --- | --- | --- |
| `P05-PERF-001` | Quiz intro/start | p95 theo budget và no unexpected COLLSCAN |
| `P05-PERF-002` | Save answer | p95 < baseline; bounded answer batch |
| `P05-PERF-003` | Submit 100 objective Questions | p95 < 2s controlled run, score deterministic |
| `P05-PERF-004` | Quiz results page | Stable indexed pagination |
| `P05-PERF-005` | Submission roster 100 Students | Derived missing query trong budget |
| `P05-PERF-006` | Grade/return | Transaction trong budget, no external I/O |
| `P05-PERF-007` | Mixed To-do | p95 < 1s controlled run |
| `P05-PERF-008` | Deadline exception list/effective resolver | Bounded queries, no N+1 per roster row |

## 9. Security Regression Cases

- Anonymous request tới mọi P05 prefix -> `401`.
- Wrong role/capability -> `403` hoặc safe `404` theo scope policy.
- Teacher owner mismatch cho every resource chain.
- Student inactive enrollment/account/classroom lock.
- IDOR với valid ObjectId thuộc Classroom khác.
- Unknown/malformed ObjectId không tạo CastError/500.
- Recursive forbidden-key scan trên Student API/OpenAPI examples.
- Log capture không có correct answer, answer text, submission body, feedback hoặc full external URL.
- Rate limiter test cho start/save/authoring và user/IP key đúng.
- URL media/link host validation không server-side fetch/redirect follow.

## 10. Command Matrix

| Scope | Command hiện có/đích |
| --- | --- |
| Unit/component | `npm test` hoặc workspace Vitest filter |
| Coverage gate | `npm run test:coverage` |
| Mongo integration | `npm run test:integration` |
| OpenAPI | `npm run test:openapi` |
| Browser | `npm run test:e2e` |
| Full local gate | `npm run check:ci` |
| Format diff | `npm run format:check` và `git diff --check` |

Không ghi command chưa tồn tại vào evidence. Nếu thêm script P05-specific, cập nhật `package.json`, CI và tài liệu trong cùng PR.

## 11. Evidence Required Per Test Group

- Exact source commit.
- Command và environment type, không chứa secret.
- Passed/failed/skipped counts.
- Mongo replica-set/seed dataset version cho integration/performance.
- CI job URL cho required remote gate.
- Playwright report/screenshot chỉ khi sanitized.
- Failure disposition liên kết Risk/Issue/PR.

Không đánh `P05-IT-*`, `P05-E2E-*` hoặc Acceptance Criteria là Pass chỉ vì test đã được viết; test phải chạy xanh trên implementation commit và required CI.
