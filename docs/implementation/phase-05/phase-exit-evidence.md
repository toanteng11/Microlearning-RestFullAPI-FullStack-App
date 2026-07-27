# Phase 05 Phase Exit Evidence

## 1. Snapshot

| Field | Current value |
| --- | --- |
| Phase | `P05 - Assessments And Grading` |
| Document purpose | Local implementation evidence snapshot |
| Planning status | `READY_TO_CODE` |
| Gate A | `APPROVED` - `2026-07-22` |
| Implementation status | `LOCAL_IMPLEMENTATION_COMPLETE` - Part 1-Part 7 local evidence collected |
| Evaluation status | `PENDING_REMOTE_VERIFICATION` |
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
| Gate A | Planning approval/readiness + PR/CI/merge publication | Pass; planning PR #13 merged at `24084c0` |
| Gate B | Domain/data/index/migration/transaction | Local Pass; remote verification pending |
| Gate C | Quiz/Attempt/scoring/result/privacy | Local Pass |
| Gate D | Assignment/Submission/Grade/deadline | Local Pass |
| Gate E | Integration/OpenAPI/E2E/CI/clean clone | Local gates Pass; clean clone, formal AC and remote CI pending |

## 4. Command Evidence Template

Điền command chính xác theo `package.json` tại source commit được đánh giá.

| Command | Expected | Result | Timestamp | Evidence/location |
| --- | --- | --- | --- | --- |
| `npm ci` | Lockfile install Pass | Pass trước local validation | `2026-07-27` | Local shell |
| `npm run lint` | Pass | Pass | `2026-07-27` | `npm run check` |
| `npm run typecheck` | API/Web Pass | Pass | `2026-07-27` | `npm run check` |
| `npm test` | API/Web Pass; ghi số test | API `180/180`; Web `99/99` | `2026-07-27` | `npm run check:ci` |
| Mongo integration command | Replica-set suites Pass; ghi số test | `72/72` Pass | `2026-07-27` | `MONGODB_INTEGRATION_URI=...directConnection=true npm run test:integration:coverage --workspace @microlearning/api` |
| OpenAPI contract command | Runtime parity Pass; ghi operation count | `9/9`; `52/52` P05 operations | `2026-07-27` | `npm run test:openapi --workspace @microlearning/api` |
| Coverage command | Tất cả configured threshold Pass | API unit `77.36/59.84/70.10/78.94%`; Web `83.77/71.44/82.26/87.20%`; API integration `80.66/60.95/87.56/82.97%` theo statements/branches/functions/lines | `2026-07-27` | `npm run check:ci` + `coverage-integration` |
| `npm run build` | API/Web production builds Pass | Pass | `2026-07-27` | `npm run check:ci` |
| E2E command | Critical journeys Pass; ghi browser/count | P05 `12/12`; full Chromium `26/26` | `2026-07-27` | `npm run test:e2e` |
| Full CI-equivalent command | Full quality gate Pass | Local Pass | `2026-07-27` | `npm run check:ci` |
| `npm run audit:production` | Không blocking production vulnerability | Pass với exact time-bound RSC-only exception | `2026-07-27` | Local shell |
| Secret scan | Không blocking secret finding | Current non-ignored source + `39` Git commits Pass, không phát hiện leak | `2026-07-27` | Local Gitleaks |
| `git diff --check` | No whitespace errors | Chạy lại sau cập nhật tài liệu | `2026-07-27` | Local shell |

## 5. Domain And Data Evidence Template

| Check | Target | Result | Evidence |
| --- | --- | --- | --- |
| Quiz/Question aggregate | Validation/lifecycle/reorder correct | Local Pass | Unit/integration/OpenAPI |
| Attempt snapshot | Immutable and bounded | Local Pass | Snapshot/projection assertions |
| Active Attempt concurrency | One active natural key | Local Pass | Concurrent start integration |
| Scoring | Golden fixtures exact | Local Pass | Objective/manual review suites |
| Submit/timeout | Idempotent terminal transition | Local Pass | Retry/concurrency integration |
| Submission revision | Current pointer + immutable history | Local Pass | Transaction/history integration |
| Grade/regrade | Revision/history/audit atomic | Local Pass | Integration + browser regrade |
| Deadline exception | Precedence/history/recalculation correct | Local Pass | Integration + browser extension |
| Index manifest | Key/options/name correct | Local Pass | Named index assertions |
| Query plans | Expected IXSCAN/no unapproved COLLSCAN | Local Pass | Attempt/Grade/deadline explain |
| Migration/rollback | Preflight and dry-run Pass | Local Pass | Migration integration |

## 6. Security And Privacy Evidence Template

| Check | Target | Result | Evidence |
| --- | --- | --- | --- |
| RBAC/ownership/enrollment | Full negative matrix Pass | Local Pass | Anonymous/role/owner/student matrix |
| Answer secrecy | No key/scoring internals before release | Local Pass | Recursive projection assertions |
| Grade privacy | No draft/cross-student visibility | Local Pass | Integration + own Grade browser |
| Submission privacy | Student only sees own work | Local Pass | Integration + returned work browser |
| IDOR | Foreign object IDs denied consistently | Local Pass | Foreign Teacher/cross-Student tests |
| Audit/log redaction | No answer/grade/private content/secret leak | Local Pass | Audit metadata allowlist |
| URL/media | HTTPS/allowlist/safe rendering when enabled | N/A | Feature disabled by Gate A |
| Upload boundary | No multipart/local disk implementation | Local Pass | Config/runtime review |

## 7. Runtime, Browser And Accessibility Template

| Check | Target | Result | Evidence |
| --- | --- | --- | --- |
| Docker images | Clean API/Web production build | Local Pass | Docker build |
| Mongo replica set | Healthy and transaction-capable | Local Pass | Compose health + `72/72` integration |
| Deterministic seed | First/repeat counts stable | Local Pass | P05 `14 created`, repeat `14 reused` |
| Swagger UI/JSON | HTTP 200 and P05 operations present | Local Pass | `52/52`, OpenAPI `9/9` |
| Teacher Quiz journey | Author/publish/review/regrade | Local Pass | Create/question/preview/publish/review/release |
| Student Quiz journey | Start/save/resume/submit/result | Local Pass | Start/save/hard reload/resume/submit/result/limit |
| Assignment journey | Create/draft/turn-in/grade/return | Local Pass | Create/publish/draft/turn-in/unsubmit/resubmit/roster/regrade |
| Deadline/To-do journey | Exception changes effective state | Local Pass | Dedicated browser journey |
| Desktop visual | No overlap/truncation/broken state | Local Pass | `1280x720` manual/browser review |
| Mobile visual | No horizontal overflow; controls usable | Local Pass | `390x844` browser/Playwright |
| Keyboard/axe | Critical screens accessible | Local Pass | axe serious/critical scan + keyboard focus assertion |
| Dirty navigation | Unsaved/unconfirmed work protected | Local Pass | Component tests + browser state review |
| Clean clone | Setup/test/build/seed/smoke reproducible | Not evaluated | - |

## 8. Performance Template

Performance dataset, warm-up, request count, machine/CI context và percentile phải được ghi cùng kết quả.

| Query/journey | Budget | Result | Dataset/evidence |
| --- | --- | --- | --- |
| Student To-do mixed activities | Theo NFR/baseline đã chấp thuận | Local Pass | P04 regression p95 `33.90ms`; mixed activity integration |
| Teacher Quiz result list | Theo NFR/baseline đã chấp thuận | Local Pass | Named IXSCAN; Phase 05 p95 < `500ms` |
| Teacher Assignment submission list | Theo NFR/baseline đã chấp thuận | Local Pass | Named indexes + bounded paging |
| Student own Grade list | Theo NFR/baseline đã chấp thuận | Local Pass | `grade_student_returned` IXSCAN |
| Course progress v2 | Theo NFR/baseline đã chấp thuận | Local Pass | dashboard p95 `195.56ms`; metric version asserted |

Không đặt một con số p95 mới trong exit evidence nếu planning baseline/NFR chưa chấp thuận con số đó.

## 9. Defects And Exceptions

| Severity | Open count | References/disposition |
| --- | ---: | --- |
| Critical | 0 | Local review |
| High | 0 | Local review |
| Medium | 0 | - |
| Low | 1 accepted risk | React Router RSC-only advisory; owner DevOps/Security; expiry `2026-08-31` |

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
Decision: PENDING_REMOTE_VERIFICATION
Reason: Part 1-Part 7 and local gates are complete. Implementation commit,
clean clone, formal AC evaluation,
implementation PR/main CI, approval and P06 handoff remain pending.
```

Chỉ đổi decision thành `COMPLETED` sau khi checklist Gate A-E, Acceptance Criteria, risk/defect review và tất cả evidence bắt buộc đã được xác minh trên đúng release commit.
