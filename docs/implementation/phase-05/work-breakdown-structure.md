# Phase 05 Work Breakdown Structure

## 1. Quy Ước

- Estimate là ideal engineering day (`d`), dùng để nhìn quy mô và dependency, không phải cam kết lịch.
- Status gồm `Backlog`, `In Progress`, `In Review`, `Done`, `Blocked`.
- Task chỉ `Done` khi output, test, tài liệu và evidence liên quan đã merge qua protected Pull Request.
- Priority `M` là Must; `C` là Conditional Should.
- Dự án cá nhân có thể cùng một người giữ nhiều owner, nhưng review Product, Security và QA vẫn phải được thực hiện như vai trò độc lập.
- Runtime task không được bắt đầu trước `P05-T008`.

## 2. E01 - Planning Baseline Và Gate A

| ID | P | Task | Output / Done condition | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P05-T001 | M | Review BA `FR/US/UC/BR/AC` liên quan | BA references và gap list có trong baseline | BA/TL | P04 exit | 0.75d | In Review |
| P05-T002 | M | Chốt Must/Conditional/Deferred | Scope boundary P05/P06/P07 không mâu thuẫn | PO/BA | T001 | 0.5d | In Review |
| P05-T003 | M | Refinement lifecycle/scoring/deadline | Rule kiểm thử được, không còn TBD chặn Must | PO/BE/QA | T001 | 0.75d | In Review |
| P05-T004 | M | Review architecture/data/API contract | Port, model, index, transaction và endpoint được chấp thuận | TL/BE/Data | T002,T003 | 0.75d | In Review |
| P05-T005 | M | Review UI/security/test contract | Route/state/privacy/concurrency/AC được chấp thuận | FE/Security/QA | T002,T003 | 0.75d | In Review |
| P05-T006 | M | Review storage/media disposition | URL-only/defer GCS được PO/TL chấp thuận | PO/TL/DevOps | T002 | 0.25d | In Review |
| P05-T007 | M | Validate planning package | Link, format, count, traceability và local quality gate xanh; chờ PR review để Done | DevOps/QA | T001-T006 | 0.5d | In Review |
| P05-T008 | M | Merge planning PR và phê duyệt Gate A | PR review, required checks xanh, merge `main`, readiness = `READY_TO_CODE` | Repository owner | T007 | 0.25d | Backlog |

## 3. E02 - Permission, Port, Domain Và Data Foundation

| ID | P | Task | Output / Done condition | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P05-T009 | M | Thêm permission constants P05 | Quiz/Assignment/Grade/Deadline capability rõ theo role | BE | T008 | 0.25d | Backlog |
| P05-T010 | M | Cập nhật Role capability matrix | Unit tests deny-by-default và expected grants pass | BE/Security | T009 | 0.5d | Backlog |
| P05-T011 | M | Định nghĩa Assessment/Assignment scope ports | Không import chéo Mongoose model | TL/BE | T008 | 0.5d | Backlog |
| P05-T012 | M | Mở rộng `LearningActivityDescriptor` v2 | Union Lesson/Quiz/Assignment có discriminator/version | TL/BE | T011 | 0.75d | Backlog |
| P05-T013 | M | Mở rộng progress/deadline reader ports | Contract tương thích P04 và dùng được cho P06 | TL/BE | T012 | 0.75d | Backlog |
| P05-T014 | M | Implement Quiz/Question repositories | CRUD, scope, projection và revision tests pass | BE/Data | T011 | 1.5d | Backlog |
| P05-T015 | M | Implement Attempt repository | Snapshot, active guard, attempt number và transaction pass | BE/Data | T014 | 1.5d | Backlog |
| P05-T016 | M | Implement Assignment/Submission repositories | Current pointer + append-only revision transaction pass | BE/Data | T011 | 1.5d | Backlog |
| P05-T017 | M | Implement Grade/deadline exception/history repositories | Revision, history, audit references và queries pass | BE/Data | T016 | 1.5d | Backlog |
| P05-T018 | M | Implement actor-specific projection policies | Correct answer, draft grade, private work không leak | BE/Security | T014-T017 | 1d | Backlog |
| P05-T019 | M | Thêm P05 Zod/shared DTO/error contracts | Schemas compile và negative validation tests pass | BE | T012 | 1d | Backlog |
| P05-T020 | M | Index manifest, migration preflight và rollback checks | Named indexes đúng key/options trên replica set | BE/Data/DevOps | T014-T017 | 1.25d | Backlog |

## 4. E03 - Teacher Quiz Và Question Authoring

| ID | P | Task | Output / Done condition | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P05-T021 | M | Quiz create service | Scope/ownership/default policy hợp lệ | BE | T010,T014,T018,T019 | 0.75d | Backlog |
| P05-T022 | M | Quiz list/detail service | Filter/page/sort và Teacher DTO đúng | BE | T021 | 0.75d | Backlog |
| P05-T023 | M | Quiz update service | Mutable fields, revision conflict và audit đúng | BE | T021 | 0.75d | Backlog |
| P05-T024 | M | Quiz create/list/detail/update routes | REST/OpenAPI/integration tests pass | BE/QA | T021-T023 | 0.75d | Backlog |
| P05-T025 | M | Quiz lifecycle policy | Draft/Published/Closed/Archived transitions đúng | BE | T003,T014 | 0.75d | Backlog |
| P05-T026 | M | Availability/attempt/release policy | Time window, limit, release mode kiểm thử được | BE/PO | T025 | 0.75d | Backlog |
| P05-T027 | M | Publish prerequisite validator | Invalid aggregate trả field-level reasons | BE | T025,T029-T034 | 0.75d | Backlog |
| P05-T028 | M | Quiz transition routes và audit | Atomic transition, idempotency, OpenAPI pass | BE/QA | T025-T027 | 0.75d | Backlog |
| P05-T029 | M | SINGLE_CHOICE domain validation | Options/one correct/points rules pass | BE/QA | T014,T019 | 0.5d | Backlog |
| P05-T030 | M | MULTIPLE_CHOICE domain validation | Exact correct set/nonempty uniqueness rules pass | BE/QA | T014,T019 | 0.5d | Backlog |
| P05-T031 | M | TRUE_FALSE domain validation | Boolean answer và points rules pass | BE/QA | T014,T019 | 0.25d | Backlog |
| P05-T032 | M | SHORT_ANSWER domain validation | Manual-review rule và prompt limits pass | BE/QA | T014,T019 | 0.25d | Backlog |
| P05-T033 | M | Question CRUD routes/projections | Teacher sees key; Student contract không leak | BE/Security | T018,T029-T032 | 1d | Backlog |
| P05-T034 | C | Question media URL validation/projection | HTTPS/allowlist/no server fetch tests pass hoặc approved N/A | BE/Security | T006,T033 | 0.5d | Backlog |
| P05-T035 | M | Question reorder + aggregate tests | Exact-set order, conflict, publish matrix pass | BE/QA | T027,T033 | 1d | Backlog |

## 5. E04 - Student Attempt, Scoring Và Quiz Result

| ID | P | Task | Output / Done condition | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P05-T036 | M | Attempt eligibility policy | Enrollment, visibility, window, limit, closed state đúng | BE/Security | T010,T013,T026 | 0.75d | Backlog |
| P05-T037 | M | Build immutable Attempt snapshot | Prompt/options/points/scoring version được chụp atomic | BE/Data | T015,T035 | 1d | Backlog |
| P05-T038 | M | Start Attempt transaction | Một active attempt, attempt number monotonic | BE/Data | T036,T037 | 1.25d | Backlog |
| P05-T039 | M | Resume/detail Attempt projection | Chỉ owner; không answer key; effective timeout đúng | BE/Security | T038 | 0.75d | Backlog |
| P05-T040 | M | Start/resume routes/OpenAPI | Happy/deny/retry/concurrency tests pass | BE/QA | T038,T039 | 0.75d | Backlog |
| P05-T041 | M | Save answer validation | Answer type/snapshot question/size đúng | BE | T037,T019 | 0.75d | Backlog |
| P05-T042 | M | Save answer optimistic revision | Atomic upsert, idempotent retry, stale `409` | BE/Data | T041 | 1d | Backlog |
| P05-T043 | M | Answer save route/OpenAPI | Response revision/savedAt và errors đúng | BE/QA | T042 | 0.5d | Backlog |
| P05-T044 | M | Attempt progress summary | Answered/total/remaining time không lộ score | BE | T039,T043 | 0.5d | Backlog |
| P05-T045 | M | Objective scoring engine | Golden fixtures cho ba objective types pass | BE/QA | T029-T031,T037 | 1.25d | Backlog |
| P05-T046 | M | Short-answer review state | Attempt/result `NEEDS_REVIEW` đúng | BE | T032,T045 | 0.5d | Backlog |
| P05-T047 | M | Submit/timeout transaction | Terminal transition một lần, canonical timestamp | BE/Data | T042,T045,T046 | 1.25d | Backlog |
| P05-T048 | M | Lazy timeout reconciliation | Read/write/list trả effective state nhất quán | BE | T047 | 0.75d | Backlog |
| P05-T049 | M | Submit/finalize routes/OpenAPI | Retry/double submit/expired/conflict tests pass | BE/QA | T047,T048 | 0.75d | Backlog |
| P05-T050 | M | Result release policy/projection | Immediate/after-close/manual policy và secrecy đúng | BE/Security | T026,T047 | 1d | Backlog |
| P05-T051 | M | Student own result endpoint | Chỉ own released result, breakdown đúng policy | BE/QA | T050 | 0.75d | Backlog |
| P05-T052 | M | Scoring/release regression suite | Snapshot mutation, exact-set, timeout, retry đều pass | QA/BE | T045-T051 | 1.25d | Backlog |

## 6. E05 - Assignment Và Submission

| ID | P | Task | Output / Done condition | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P05-T053 | M | Assignment create service | Scope/default lifecycle/policy đúng | BE | T010,T016,T018,T019 | 0.75d | Backlog |
| P05-T054 | M | Assignment list/detail/update service | Pagination/projection/revision/audit đúng | BE | T053 | 1d | Backlog |
| P05-T055 | M | Submission method policy | TEXT bắt buộc; LINK/MARK_DONE theo feature decision | BE/PO | T003,T006 | 0.5d | Backlog |
| P05-T056 | M | Late/unsubmit/resubmit policy | State transition và due date boundary rõ | BE/PO | T003,T055 | 0.75d | Backlog |
| P05-T057 | M | Assignment publish prerequisite/lifecycle | Invalid config bị chặn; transitions atomic | BE | T054-T056 | 0.75d | Backlog |
| P05-T058 | M | Assignment Teacher routes/OpenAPI | CRUD/transition/negative tests pass | BE/QA | T053-T057 | 0.75d | Backlog |
| P05-T059 | M | Student own Submission query/create draft | Một current submission theo natural key | BE/Data | T016,T018,T057 | 1d | Backlog |
| P05-T060 | M | Save Submission draft | Revision/content validation/idempotency đúng | BE/Data | T055,T059 | 1d | Backlog |
| P05-T061 | C | External LINK/MARK_DONE payload | HTTPS URL/method-specific contract pass hoặc approved N/A | BE/Security | T006,T055,T060 | 0.5d | Backlog |
| P05-T062 | M | Turn-in transaction | Append revision/event, canonical submittedAt/late | BE/Data | T056,T060 | 1d | Backlog |
| P05-T063 | M | Unsubmit transaction | Policy/state/revision guard đúng | BE/Data | T056,T062 | 0.75d | Backlog |
| P05-T064 | M | Resubmit transaction | Không mất history; current revision đúng | BE/Data | T063 | 0.75d | Backlog |
| P05-T065 | M | Student Submission routes/OpenAPI | Draft/turn-in/detail/history tests pass | BE/QA | T059-T064 | 0.75d | Backlog |
| P05-T066 | M | Submission concurrency/rollback suite | Double turn-in/unsubmit/save race không corrupt | QA/BE | T060-T065 | 1d | Backlog |
| P05-T067 | M | Derived assigned/missing/late query | Không tạo placeholder; server-time boundaries pass | BE/QA | T056,T059 | 0.75d | Backlog |

## 7. E06 - Grade, Feedback, Return Và Deadline Exception

| ID | P | Task | Output / Done condition | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P05-T068 | M | Teacher submission/result table queries | Scope/filter/page/sort và indexes đúng | BE/Data | T020,T052,T065 | 1d | Backlog |
| P05-T069 | M | Teacher Quiz result detail/manual review | Answer snapshot, objective score và review state đúng | BE | T046,T050,T068 | 1d | Backlog |
| P05-T070 | M | Grade draft validation | Points range, feedback limits, target type đúng | BE | T017,T019 | 0.75d | Backlog |
| P05-T071 | M | Return/regrade transaction | Revision guard, history, audit và release atomic | BE/Data | T069,T070 | 1.25d | Backlog |
| P05-T072 | M | Grade/return/regrade routes/OpenAPI | Happy/deny/stale revision tests pass | BE/QA | T071 | 0.75d | Backlog |
| P05-T073 | M | Student own Grade/Feedback query | Chỉ RETURNED/RELEASED; no cross-student fields | BE/Security | T071,T018 | 0.75d | Backlog |
| P05-T074 | C | Private Assignment comments | Membership/privacy/audit tests pass hoặc approved N/A | BE/FE/Security | T006,T065 | 1d | Backlog |
| P05-T075 | M | Effective deadline resolver | Student override > activity default, canonical time | BE | T013,T017 | 0.75d | Backlog |
| P05-T076 | M | Deadline exception validation | Gia hạn-only/reason/future/revision rules đúng | BE/PO | T075 | 0.75d | Backlog |
| P05-T077 | M | Set/reset deadline exception transaction | History/audit/revision atomic | BE/Data | T076 | 1d | Backlog |
| P05-T078 | M | Deadline exception query/history | Teacher scope và Student own projection đúng | BE/Security | T077 | 0.75d | Backlog |
| P05-T079 | M | Recompute late/missing with exception | Quiz/Assignment/To-do dùng cùng resolver | BE/QA | T067,T075-T078 | 1d | Backlog |
| P05-T080 | M | Deadline exception routes/OpenAPI/tests | Conflict/IDOR/time-boundary/history pass | BE/QA | T077-T079 | 0.75d | Backlog |

## 8. E07 - Integration Và React Web

| ID | P | Task | Output / Done condition | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P05-T081 | M | Register Quiz/Assignment activity/governance adapters | Classwork sees v2 descriptors; Admin gets metadata-only counts; Lesson không regression | BE | T012,T028,T058 | 0.75d | Backlog |
| P05-T082 | M | Extend progress metric v2 | Required activity denominator/version tests pass | BE/Data | T013,T051,T065 | 1d | Backlog |
| P05-T083 | M | Build Teacher Quiz Builder/Settings | CRUD/question/reorder/publish states dùng API thật | FE | T024,T028,T033,T035 | 2d | Backlog |
| P05-T084 | M | Build Student Quiz Intro/Player/Result | Start/save/resume/submit/timeout/result states hoàn chỉnh | FE | T040,T043,T049,T051 | 2.5d | Backlog |
| P05-T085 | M | Build Teacher Assignment Editor | CRUD/policy/publish/deadline states hoàn chỉnh | FE | T058 | 1.5d | Backlog |
| P05-T086 | M | Build Student Assignment/Submission UI | Draft/turn-in/unsubmit/history/late/missing states | FE | T065,T067,T079 | 2d | Backlog |
| P05-T087 | M | Build Teacher Results/Submission Grader | Tables, detail, review, grade, return, conflict states | FE | T068-T072 | 2d | Backlog |
| P05-T088 | M | Build Student Grades/Feedback UI | Own returned grades only, empty/error/forbidden states | FE | T073 | 1d | Backlog |
| P05-T089 | C | Build private comment thread | Accessible send/retry/history hoặc approved N/A | FE | T074 | 0.75d | Backlog |
| P05-T090 | M | Build deadline exception dialog/history | Effective deadline preview, reason, revision conflict | FE | T080 | 1d | Backlog |
| P05-T091 | M | Extend learning views và Admin governance UI | Mixed activities, due/progress versions và metadata-only assessment counts | FE/BE | T079-T082 | 1.5d | Backlog |
| P05-T092 | C | Build basic Gradebook read view | Conditional scope, no weighting/export hoặc approved N/A | FE/BE | T068,T073 | 1.25d | Backlog |
| P05-T093 | M | Complete navigation/state/accessibility behavior | Back/next/breadcrumb/loading/empty/error/conflict responsive | FE/QA | T083-T092 | 1.25d | Backlog |

## 9. E08 - Security, Quality, DevOps Và Exit

| ID | P | Task | Output / Done condition | Owner | Dependency | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P05-T094 | M | Run authorization/IDOR/field-leak matrix | Admin/Teacher/Student/anonymous cases pass | Security/QA | T040,T051,T058,T065,T072,T080 | 1.25d | Backlog |
| P05-T095 | M | Complete OpenAPI/runtime parity | Mọi P05 route/schema/error/security documented and tested | BE/QA | T028,T040,T049,T058,T065,T072,T080 | 1d | Backlog |
| P05-T096 | M | Run transaction/concurrency/rollback suite | Race matrix pass trên Mongo replica set | QA/BE | T020,T052,T066,T071,T077 | 1.5d | Backlog |
| P05-T097 | M | Run performance/index evidence | Seeded p95 budgets và explain không COLLSCAN ngoài allowlist | BE/Data/QA | T068,T079,T082 | 1d | Backlog |
| P05-T098 | M | Run accessibility/responsive/browser review | axe + keyboard + desktop/mobile critical screens pass | FE/QA | T093 | 1d | Backlog |
| P05-T099 | M | Add deterministic Phase 05 demo seed | Teacher/Students/Quiz/Assignment/Attempt/Grade synthetic | BE/DevOps | T052,T072,T080 | 0.75d | Backlog |
| P05-T100 | M | Update Docker integrated stack | Seed and API/Web readiness deterministic | DevOps | T099 | 0.5d | Backlog |
| P05-T101 | M | Extend CI jobs/gates | Mongo/OpenAPI/E2E/security/audit/secret scan xanh | DevOps/QA | T094-T100 | 0.75d | Backlog |
| P05-T102 | M | Run critical Playwright journeys | 12 journeys, desktop/mobile artifacts và no mock data | QA/FE | T093,T099-T101 | 1.25d | Backlog |
| P05-T103 | M | Run clean-clone onboarding | Fresh clone setup/build/seed/smoke thành công | DevOps/QA | T100,T101 | 0.75d | Backlog |
| P05-T104 | M | Evaluate 78 Acceptance Criteria | 74 Must Pass; Conditional Pass hoặc approved N/A | QA/PO | T094-T103 | 1d | Backlog |
| P05-T105 | M | Close/disposition risks và defects | Không Critical/High mở; còn lại có owner | TL/QA | T104 | 0.5d | Backlog |
| P05-T106 | M | Complete evidence register/phase evidence | Commit, command, count, CI URL, reports tái lập được | TL/DevOps | T104,T105 | 0.75d | Backlog |
| P05-T107 | M | Merge implementation PR + verify main CI | Protected merge, post-merge required jobs xanh | Repository owner | T106 | 0.25d | Backlog |
| P05-T108 | M | Approve exit report và P06 handoff | Phase = COMPLETED, versioned contracts bàn giao | PO/TL | T107 | 0.5d | Backlog |

## 10. Estimate Summary

| Epic | Tasks | Ước lượng |
| --- | ---: | ---: |
| E01 Planning | 8 | 4.25d |
| E02 Foundation | 12 | 12.25d |
| E03 Quiz authoring | 15 | 10.75d |
| E04 Attempt/scoring | 17 | 15.25d |
| E05 Assignment/submission | 15 | 12.25d |
| E06 Grade/deadline | 13 | 11.25d |
| E07 Integration/Web | 13 | 19.25d |
| E08 Quality/exit | 15 | 13.0d |
| **Tổng** | **108** | **98.25d ideal effort** |

Estimate là tổng effort theo vai trò và có thể thực hiện song song sau Gate B. Không dùng con số này như lịch một người tuyến tính mà chưa tính thời gian review, sửa lỗi và học công nghệ.

## 11. Critical Dependencies

1. `T008 -> T009..T020`: không code trước khi Gate A merge.
2. `T020 -> domain query`: index/migration phải có trước table/load tests.
3. `T035 -> T037`: Attempt snapshot chỉ tạo từ Quiz aggregate hợp lệ.
4. `T047 -> T050/T069`: result/review dựa trên terminal scoring canonical.
5. `T065 -> T071`: Grade Assignment chỉ gắn vào Submission canonical.
6. `T075 -> T079/T091`: tất cả late/missing/To-do dùng cùng deadline resolver.
7. `T081/T082 -> T091`: UI aggregate chỉ nâng contract sau adapter regression pass.
8. `T094..T103 -> T104`: không đánh AC Pass trước security, E2E, CI và clean clone.
