# Phase 05 Acceptance Criteria

## 1. Evaluation Rules

- Baseline: `78` criteria gồm `74 Must` và `4 Conditional Should`.
- Status: `Not Run`, `Pass`, `Fail`, `Blocked`, `Not Applicable`.
- Phase exit yêu cầu `74/74 Must Pass`.
- Conditional chỉ Pass khi feature enabled và đủ security/test; nếu defer phải có approved N/A evidence.
- Không đổi `Pass` nếu thiếu command/report/URL/screenshot hoặc source reference.
- Một Critical/High defect mở làm Gate E Fail dù count đủ.

## 2. Planning And Boundary

| ID | Priority | Acceptance condition | Evidence | Status |
| --- | --- | --- | --- | --- |
| P05-AC-001 | Must | Planning package được review, CI xanh và merge trước implementation | PR/merge/run | Pass |
| P05-AC-002 | Must | Scope/decision/API/data/UI/test không còn decision chặn code | Readiness review | Pass |
| P05-AC-003 | Must | FILE/upload, advanced reporting và weighted process score không bị giả lập | Source/API/UI review | Pass |
| P05-AC-004 | Must | P06/P07 handoff/defer có version và traceability | Contract review | Pass |

## 3. Authentication, Authorization And Privacy

| ID | Priority | Acceptance condition | Evidence | Status |
| --- | --- | --- | --- | --- |
| P05-AC-005 | Must | Mọi P05 route yêu cầu active authenticated session | API matrix | Pass |
| P05-AC-006 | Must | Capability matrix đúng Student/Teacher/Admin/Super Admin | Unit/API tests | Pass |
| P05-AC-007 | Must | Teacher chỉ mutate assessment trong owned Course | IDOR tests | Pass |
| P05-AC-008 | Must | Student chỉ view/act trong active Enrollment | Integration tests | Pass |
| P05-AC-009 | Must | Student A không xem/sửa Attempt/Submission/Grade Student B | IDOR tests | Pass |
| P05-AC-010 | Must | Teacher B không xem answer/submission/grade Course Teacher A | IDOR tests | Pass |
| P05-AC-011 | Must | Correct answer/rubric không xuất hiện trong Student DTO/DOM/log | Leak tests | Pass |
| P05-AC-012 | Must | Grade draft/private feedback không visible trước return | Projection tests | Pass |
| P05-AC-013 | Must | Mass-assigned owner/score/status/time/revision bị reject | Schema tests | Pass |
| P05-AC-014 | Must | BLOCKED/inactive/removed actor bị chặn không partial write | API tests | Pass |

## 4. Quiz And Question Authoring

| ID | Priority | Acceptance condition | Evidence | Status |
| --- | --- | --- | --- | --- |
| P05-AC-015 | Must | Teacher tạo/list/detail/update Quiz đúng Course/Module scope | API/UI tests | Pass |
| P05-AC-016 | Must | Quiz lifecycle chỉ transition hợp lệ và giữ history | Unit/API tests | Pass |
| P05-AC-017 | Must | Publish validate availability/due/attempt/time/result policy | Boundary tests | Pass |
| P05-AC-018 | Must | Publish yêu cầu 1-100 valid Questions và maxScore > 0 | Negative tests | Pass |
| P05-AC-019 | Must | Bốn Question type validate đúng options/answer/rubric | Unit/API tests | Pass |
| P05-AC-020 | Must | Question CRUD/archive/reorder exact-set/revision đúng | Mongo/API tests | Pass |
| P05-AC-021 | Must | Published scoring content bị lock tới unpublish/new revision | API tests | Pass |
| P05-AC-022 | Conditional | Allowlisted image/video URL preview/remove/fallback an toàn | Gate A disposition: feature disabled | Not Applicable |
| P05-AC-023 | Must | Question không media vẫn save/publish/attempt bình thường | API/E2E | Pass |
| P05-AC-024 | Must | Attempt cũ giữ immutable snapshot sau Question edit | Mongo test | Pass |
| P05-AC-025 | Must | Teacher preview không tạo Attempt/Progress | API/UI tests | Pass |

## 5. Quiz Attempt, Scoring And Result

| ID | Priority | Acceptance condition | Evidence | Status |
| --- | --- | --- | --- | --- |
| P05-AC-026 | Must | Student intro hiển thị policy/effective deadline/remaining attempts đúng | API/UI tests | Pass |
| P05-AC-027 | Must | Start creates/resumes đúng một active Attempt | Transaction/race | Pass |
| P05-AC-028 | Must | Concurrent starts không vượt attempt limit/duplicate number | Race test | Pass |
| P05-AC-029 | Must | Attempt snapshot đủ chấm và Student projection không lộ key | Contract tests | Pass |
| P05-AC-030 | Must | Save answers validate snapshot/type/options và revision | API tests | Pass |
| P05-AC-031 | Must | Refresh/resume trả own persisted answers/state | Integration/E2E | Pass |
| P05-AC-032 | Must | Server time limit/effective expiry enforce before/equal/after boundary | Fake-clock tests | Pass |
| P05-AC-033 | Must | Timeout reconciliation idempotent và dùng latest persisted answers | Mongo tests | Pass |
| P05-AC-034 | Must | Submit/retry/concurrent submit tạo một terminal outcome | Race tests | Pass |
| P05-AC-035 | Must | Single/multiple/true-false exact scoring đúng golden fixtures | Unit tests | Pass |
| P05-AC-036 | Must | Short answer chuyển NEEDS_REVIEW và không fake final score | API/UI tests | Pass |
| P05-AC-037 | Must | Teacher manual review validate per-question score và complete set | API/UI tests | Pass |
| P05-AC-038 | Must | HIGHEST final score tie-break deterministic | Unit/integration | Pass |
| P05-AC-039 | Must | Result release policies enforce đúng Student visibility | Projection/E2E | Pass |
| P05-AC-040 | Must | Regrade giữ history/reason/audit và không sửa snapshot cũ | Mongo/API tests | Pass |

## 6. Assignment Authoring

| ID | Priority | Acceptance condition | Evidence | Status |
| --- | --- | --- | --- | --- |
| P05-AC-041 | Must | Teacher tạo/list/detail/update Assignment đúng ownership | API/UI tests | Pass |
| P05-AC-042 | Must | Assignment publish yêu cầu instruction/maxScore/due/method hợp lệ | Negative tests | Pass |
| P05-AC-043 | Must | Lifecycle draft/scheduled/published/unpublished/closed/archived đúng | Unit/API tests | Pass |
| P05-AC-044 | Must | Closed rejects turn-in/resubmit; reopen reason/audit | API tests | Pass |
| P05-AC-045 | Must | TEXT submission method end-to-end | API/E2E | Pass |
| P05-AC-046 | Must | FILE method/routes/UI không advertise khi disabled | Contract/UI tests | Pass |
| P05-AC-047 | Must | Assignment edit conflict không silent overwrite | Concurrency/UI | Pass |
| P05-AC-048 | Conditional | LINK/MARK_DONE enabled methods validate và work end-to-end | Gate A disposition: feature disabled | Not Applicable |
| P05-AC-049 | Must | Assignment preview không tạo Submission/Progress | API/UI tests | Pass |

## 7. Submission, Grade And Feedback

| ID | Priority | Acceptance condition | Evidence | Status |
| --- | --- | --- | --- | --- |
| P05-AC-050 | Must | Save draft upserts one current Submission with revision | Mongo/API tests | Pass |
| P05-AC-051 | Must | Turn-in before/after due yields submitted/late/denied correctly | Fake-clock tests | Pass |
| P05-AC-052 | Must | Duplicate/concurrent turn-in does not create duplicate/current loss | Race tests | Pass |
| P05-AC-053 | Must | MISSING/ASSIGNED derive from roster without placeholder Submission | Query tests | Pass |
| P05-AC-054 | Must | Unsubmit/resubmit follows policy and preserves revisions/history | API/Mongo tests | Pass |
| P05-AC-055 | Must | Unsubmit reverses completion and restores active To-do | Integration/E2E | Pass |
| P05-AC-056 | Must | Teacher Submission roster search/filter/sort/page/status correct | API/UI/perf | Pass |
| P05-AC-057 | Must | Grade range/evidence revision/ownership validated | API tests | Pass |
| P05-AC-058 | Must | Return transaction releases Grade/Feedback atomically | Transaction/E2E | Pass |
| P05-AC-059 | Conditional | Private comments remain visible only scoped Teacher/Student | Gate A disposition: deferred | Not Applicable |
| P05-AC-060 | Must | Regrade history/audit/visible result update correctly | Mongo/API tests | Pass |
| P05-AC-061 | Must | Own Grades list/detail returns only current Student returned results | IDOR/UI tests | Pass |

## 8. Deadline And Cross-Activity Integration

| ID | Priority | Acceptance condition | Evidence | Status |
| --- | --- | --- | --- | --- |
| P05-AC-062 | Must | Teacher set/extend/revoke per-Student exception with reason/revision | API/Mongo tests | Pass |
| P05-AC-063 | Must | Normal Teacher shortening/past/archive/non-owner mutation denied atomically | Negative tests | Pass |
| P05-AC-064 | Must | Student A exception không đổi Student B deadline/state | Integration test | Pass |
| P05-AC-065 | Must | To-do/Deadline/Classwork mix Lesson/Quiz/Assignment đúng visibility/order | API/UI tests | Pass |
| P05-AC-066 | Must | Quiz submit và Assignment turn-in/unsubmit cập nhật progress/query kế tiếp | Integration tests | Pass |
| P05-AC-067 | Must | Metric/descriptor versions, Admin metadata-only assessment counts và P04 Lesson regression đúng | Contract/privacy/regression | Pass |
| P05-AC-068 | Conditional | Basic Gradebook derived grid đúng scope; không export giả | Gate A disposition: deferred to P06 | Not Applicable |

## 9. Quality, OpenAPI And Exit

| ID | Priority | Acceptance condition | Evidence | Status |
| --- | --- | --- | --- | --- |
| P05-AC-069 | Must | OpenAPI bao phủ mọi mounted P05 operation, examples/schema valid | Contract tests | Pass |
| P05-AC-070 | Must | API/Web unit/component coverage gates Pass | CI reports | Pass |
| P05-AC-071 | Must | Mongo replica-set transaction/index/explain suites Pass | CI reports | Pass |
| P05-AC-072 | Must | Critical Playwright journeys desktop/mobile Pass | E2E report | Pass |
| P05-AC-073 | Must | XSS/URL/IDOR/leak/log-redaction tests Pass | Security evidence | Pass |
| P05-AC-074 | Must | Performance baseline meets target or approved variance | Perf report | Pass |
| P05-AC-075 | Must | Docker build/start/seed first-repeat/smoke Pass | Runtime evidence | Pass |
| P05-AC-076 | Must | Clean-clone onboarding and `npm run check:ci` Pass | Clean-clone log | Pass |
| P05-AC-077 | Must | PR/main six required CI jobs Pass; no Critical/High defect | URLs/defect log | Pass |
| P05-AC-078 | Must | Exit report/evidence/traceability complete and P06/P07 handoff accepted | Exit review | Pass |

## 10. Current Result

| Group | Total | Pass | Fail | Blocked | Not Run | N/A |
| --- | --- | --- | --- | --- | --- | --- |
| Must | 74 | 74 | 0 | 0 | 0 | 0 |
| Conditional | 4 | 0 | 0 | 0 | 0 | 4 |

Current phase execution status: `COMPLETED`. `74/74 Must` Pass trên release merge commit
`88404f3`; bốn Conditional giữ `Not Applicable` theo Gate A. Evidence chi tiết nằm trong
`test-case-execution-matrix.md`, `phase-exit-evidence.md` và các CI run của PR #14/`main`.
