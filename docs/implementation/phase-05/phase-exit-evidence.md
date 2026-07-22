# Phase 05 Phase Exit Evidence

## 1. Snapshot

| Field | Current value |
| --- | --- |
| Phase | `P05 - Assessments And Grading` |
| Document purpose | Phase Exit evidence template |
| Planning status | `READY_TO_CODE` |
| Gate A | `APPROVED` - `2026-07-22` |
| Implementation status | `NOT_STARTED` |
| Evaluation status | `NOT_EVALUATED` |
| Source commit | Pending |
| Implementation PR | Pending |
| Merge commit | Pending |
| PR CI run | Pending |
| Post-merge main CI run | Pending |

Tài liệu này được tạo trước để quy định evidence cần thu thập. Các ô Pending không được điền bằng dự đoán hoặc kết quả chạy trên commit khác.

## 2. Acceptance Result

| Scope | Total | Pass | Fail | Blocked | Not Run | N/A |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Must | 74 | 0 | 0 | 0 | 74 | 0 |
| Conditional | 4 | 0 | 0 | 0 | 0 | 4 |

Exit yêu cầu `74/74` Must Pass. Conditional phải Pass khi enabled hoặc có approved N/A evidence khi defer.

## 3. Gate Result

| Gate | Expected evidence | Current result |
| --- | --- | --- |
| Gate A | Planning approval/readiness + PR/CI/merge publication | Content approved; repository publication pending |
| Gate B | Domain/data/index/migration/transaction | Not started |
| Gate C | Quiz/Attempt/scoring/result/privacy | Not started |
| Gate D | Assignment/Submission/Grade/deadline | Not started |
| Gate E | Integration/OpenAPI/E2E/CI/clean clone | Not started |

## 4. Command Evidence Template

Điền command chính xác theo `package.json` tại source commit được đánh giá.

| Command | Expected | Result | Timestamp | Evidence/location |
| --- | --- | --- | --- | --- |
| `npm ci` | Lockfile install Pass | Not run | - | - |
| `npm run lint` | Pass | Not run | - | - |
| `npm run typecheck` | API/Web Pass | Not run | - | - |
| `npm test` | API/Web Pass; ghi số test | Not run | - | - |
| Mongo integration command | Replica-set suites Pass; ghi số test | Not run | - | - |
| OpenAPI contract command | Runtime parity Pass; ghi operation count | Not run | - | - |
| Coverage command | Tất cả configured threshold Pass | Not run | - | - |
| `npm run build` | API/Web production builds Pass | Not run | - | - |
| E2E command | Critical journeys Pass; ghi browser/count | Not run | - | - |
| Full CI-equivalent command | Full quality gate Pass | Not run | - | - |
| `npm audit --omit=dev --audit-level=high` | Không blocking production vulnerability | Not run | - | - |
| Secret scan | Không blocking secret finding | Not run | - | - |
| `git diff --check` | No whitespace errors | Not run | - | - |

## 5. Domain And Data Evidence Template

| Check | Target | Result | Evidence |
| --- | --- | --- | --- |
| Quiz/Question aggregate | Validation/lifecycle/reorder correct | Not evaluated | - |
| Attempt snapshot | Immutable and bounded | Not evaluated | - |
| Active Attempt concurrency | One active natural key | Not evaluated | - |
| Scoring | Golden fixtures exact | Not evaluated | - |
| Submit/timeout | Idempotent terminal transition | Not evaluated | - |
| Submission revision | Current pointer + immutable history | Not evaluated | - |
| Grade/regrade | Revision/history/audit atomic | Not evaluated | - |
| Deadline exception | Precedence/history/recalculation correct | Not evaluated | - |
| Index manifest | Key/options/name correct | Not evaluated | - |
| Query plans | Expected IXSCAN/no unapproved COLLSCAN | Not evaluated | - |
| Migration/rollback | Preflight and dry-run Pass | Not evaluated | - |

## 6. Security And Privacy Evidence Template

| Check | Target | Result | Evidence |
| --- | --- | --- | --- |
| RBAC/ownership/enrollment | Full negative matrix Pass | Not evaluated | - |
| Answer secrecy | No key/scoring internals before release | Not evaluated | - |
| Grade privacy | No draft/cross-student visibility | Not evaluated | - |
| Submission privacy | Student only sees own work | Not evaluated | - |
| IDOR | Foreign object IDs denied consistently | Not evaluated | - |
| Audit/log redaction | No answer/grade/private content/secret leak | Not evaluated | - |
| URL/media | HTTPS/allowlist/safe rendering when enabled | Not evaluated | - |
| Upload boundary | No multipart/local disk implementation | Not evaluated | - |

## 7. Runtime, Browser And Accessibility Template

| Check | Target | Result | Evidence |
| --- | --- | --- | --- |
| Docker images | Clean API/Web production build | Not evaluated | - |
| Mongo replica set | Healthy and transaction-capable | Not evaluated | - |
| Deterministic seed | First/repeat counts stable | Not evaluated | - |
| Swagger UI/JSON | HTTP 200 and P05 operations present | Not evaluated | - |
| Teacher Quiz journey | Author/publish/review/regrade | Not evaluated | - |
| Student Quiz journey | Start/save/resume/submit/result | Not evaluated | - |
| Assignment journey | Create/draft/turn-in/grade/return | Not evaluated | - |
| Deadline/To-do journey | Exception changes effective state | Not evaluated | - |
| Desktop visual | No overlap/truncation/broken state | Not evaluated | - |
| Mobile visual | No horizontal overflow; controls usable | Not evaluated | - |
| Keyboard/axe | Critical screens accessible | Not evaluated | - |
| Dirty navigation | Unsaved/unconfirmed work protected | Not evaluated | - |
| Clean clone | Setup/test/build/seed/smoke reproducible | Not evaluated | - |

## 8. Performance Template

Performance dataset, warm-up, request count, machine/CI context và percentile phải được ghi cùng kết quả.

| Query/journey | Budget | Result | Dataset/evidence |
| --- | --- | --- | --- |
| Student To-do mixed activities | Theo NFR/baseline đã chấp thuận | Not run | - |
| Teacher Quiz result list | Theo NFR/baseline đã chấp thuận | Not run | - |
| Teacher Assignment submission list | Theo NFR/baseline đã chấp thuận | Not run | - |
| Student own Grade list | Theo NFR/baseline đã chấp thuận | Not run | - |
| Course progress v2 | Theo NFR/baseline đã chấp thuận | Not run | - |

Không đặt một con số p95 mới trong exit evidence nếu planning baseline/NFR chưa chấp thuận con số đó.

## 9. Defects And Exceptions

| Severity | Open count | References/disposition |
| --- | ---: | --- |
| Critical | Not evaluated | - |
| High | Not evaluated | - |
| Medium | Not evaluated | - |
| Low | Not evaluated | - |

| Conditional item | Enabled? | Result | N/A approval/evidence |
| --- | --- | --- | --- |
| Question media URL | No | Not Applicable | Gate A `2026-07-22`; feature flag `false` |
| Assignment LINK/MARK_DONE | No | Not Applicable | Gate A `2026-07-22`; feature flag `false` |
| Private comments | No | Not Applicable | Gate A `2026-07-22`; deferred, no contract |
| Basic Gradebook | No | Not Applicable | Gate A `2026-07-22`; deferred to P06 |

## 10. Remote Evidence Template

| Evidence | URL/commit | Verified by | Result |
| --- | --- | --- | --- |
| Planning PR and merge | Pending | Pending | Pending |
| Implementation PR | Pending | Pending | Pending |
| Source commit | Pending | Pending | Pending |
| Merge commit | Pending | Pending | Pending |
| PR required CI | Pending | Pending | Pending |
| Post-merge main CI | Pending | Pending | Pending |
| Review/approval | Pending | Pending | Pending |

## 11. Exit Decision

```text
Decision: NOT_EVALUATED
Reason: Phase 05 implementation has not started and no runtime/remote acceptance evidence exists.
```

Chỉ đổi decision thành `COMPLETED` sau khi checklist Gate A-E, Acceptance Criteria, risk/defect review và tất cả evidence bắt buộc đã được xác minh trên đúng release commit.
