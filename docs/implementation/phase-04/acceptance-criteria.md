# Phase 04 Acceptance Criteria

## 1. Quy Tắc Đánh Giá

- Tổng baseline: `68` criteria, gồm `66 Must` và `2 Conditional Should` (`P04-AC-045/046`).
- Trạng thái: `Not Run`, `Pass`, `Fail`, `Blocked`, `Not Applicable`.
- Phase exit bắt buộc `66/66 Must Pass`.
- Conditional criterion chỉ `Not Applicable` khi capability không bật và scope decision/evidence ghi rõ; nếu đã bật thì phải `Pass`.
- Không đổi `Pass` nếu evidence chưa có command/report/URL/screenshot cụ thể.
- Một Critical/High defect mở làm Gate E fail dù count đủ.

## 2. Planning And Boundary

| ID | Priority | Acceptance condition | Planned evidence | Status |
| --- | --- | --- | --- | --- |
| P04-AC-001 | Must | Planning package được review, CI xanh và merge trước implementation | PR/merge/run URL | Pass |
| P04-AC-002 | Must | Scope, ADR, API, data, UI và test docs không còn decision chặn code | Readiness review | Pass |
| P04-AC-003 | Must | Không triển khai placeholder Quiz/Assignment/Grade/reporting đa hoạt động | Source/API/UI review | Pass |
| P04-AC-004 | Must | P05/P06 nhận activity/visibility/deadline/progress handoff có version | Contract review | Pass |

## 3. Authentication, Authorization And Privacy

| ID | Priority | Acceptance condition | Planned evidence | Status |
| --- | --- | --- | --- | --- |
| P04-AC-005 | Must | Mọi P04 route yêu cầu authenticated active session | API matrix | Pass |
| P04-AC-006 | Must | Role capability matrix đúng cho Student/Teacher/Admin/Super Admin | Permission unit tests | Pass |
| P04-AC-007 | Must | Teacher chỉ mutate content của Classroom mình đang sở hữu | API IDOR tests | Pass |
| P04-AC-008 | Must | Student chỉ đọc content của active Enrollment | API integration tests | Pass |
| P04-AC-009 | Must | Removed/disabled Student và inactive Teacher bị chặn đúng | API tests | Pass |
| P04-AC-010 | Must | Guessed foreign ID không làm lộ title/status/existence | Error equivalence tests | Pass |
| P04-AC-011 | Must | Body không mass-assign owner/status/revision/audit field | Schema/API tests | Pass |
| P04-AC-012 | Must | Student/Admin projection không lộ draft body, deadline reason hoặc dữ liệu thừa | DTO contract tests | Pass |

## 4. Course And Module

| ID | Priority | Acceptance condition | Planned evidence | Status |
| --- | --- | --- | --- | --- |
| P04-AC-013 | Must | Owner Teacher tạo Course `DRAFT` trong active Classroom | API + Mongo test | Pass |
| P04-AC-014 | Must | Course list search/filter/page/sort ổn định theo role | API/UI tests | Pass |
| P04-AC-015 | Must | Teacher sửa metadata với optimistic concurrency | Success + stale tests | Pass |
| P04-AC-016 | Must | Course lifecycle chỉ cho transition hợp lệ, schedule dùng server clock | Unit/API tests | Pass |
| P04-AC-017 | Must | Publish Course thiếu required valid Lesson/deadline bị chặn | Prerequisite tests | Pass |
| P04-AC-018 | Must | Archive Course là soft, terminal và giữ child/progress/history | Mongo/API tests | Pass |
| P04-AC-019 | Must | Teacher tạo/sửa Module đúng Course và ownership | API tests | Pass |
| P04-AC-020 | Must | Module lifecycle/ancestor visibility đúng | Unit/integration tests | Pass |
| P04-AC-021 | Must | Reorder Module exact-set transaction tạo order liên tục | Mongo transaction test | Pass |
| P04-AC-022 | Must | Concurrent reorder chỉ một revision thắng, không partial state | Race test | Pass |
| P04-AC-023 | Must | Student structure chỉ có effective published Module/Lesson | Projection tests | Pass |
| P04-AC-024 | Must | Structure order deterministic có `_id` tie-breaker | Query/UI tests | Pass |

## 5. Lesson And Flashcard

| ID | Priority | Acceptance condition | Planned evidence | Status |
| --- | --- | --- | --- | --- |
| P04-AC-025 | Must | Teacher tạo/sửa Lesson Markdown đúng field/range/parent | API tests | Pass |
| P04-AC-026 | Must | Content size, title, estimated time và cross-Course Module bị validate | Boundary tests | Pass |
| P04-AC-027 | Must | Preview render gần Student view nhưng không ghi progress | Component/API tests | Pass |
| P04-AC-028 | Must | Lesson schedule/publish/unpublish/archive đúng state machine | Unit/API tests | Pass |
| P04-AC-029 | Must | Published/Scheduled Lesson body và Flashcard bị khóa cho tới unpublish | Negative tests | Pass |
| P04-AC-030 | Must | Scheduled Lesson visibility đúng trước/bằng/sau thời điểm | Fake-clock tests | Pass |
| P04-AC-031 | Must | Lesson move/reorder toàn Course atomic và canonical | Mongo/API tests | Pass |
| P04-AC-032 | Must | Student navigation bỏ hidden item và trả Back/Previous/Next đúng | Unit/E2E tests | Pass |
| P04-AC-033 | Must | Teacher tạo/sửa Flashcard hợp lệ; Student xem theo Lesson visibility | API/UI tests | Pass |
| P04-AC-034 | Must | Flashcard reorder/archive atomic, keyboard-accessible và không tự complete Lesson | Transaction/component tests | Pass |

## 6. Deadline And Derived State

| ID | Priority | Acceptance condition | Planned evidence | Status |
| --- | --- | --- | --- | --- |
| P04-AC-035 | Must | Set first deadline UTC tương lai cập nhật revision đúng | API/Mongo tests | Pass |
| P04-AC-036 | Must | Reset published deadline bắt buộc reason 10-500 | Boundary tests | Pass |
| P04-AC-037 | Must | Clear deadline chỉ ở Draft/Unpublished | Lifecycle tests | Pass |
| P04-AC-038 | Must | Shorten published deadline bị chặn trong Must baseline | API test | Pass |
| P04-AC-039 | Must | History append-only có old/new/revision/actor/time/reason | Mongo/API tests | Pass |
| P04-AC-040 | Must | Lesson + history + audit cùng commit/rollback | Failure injection test | Pass |
| P04-AC-041 | Must | `NOT_STARTED/IN_PROGRESS/MISSING/COMPLETED/LATE` đúng boundary và đổi deadline | Fake-clock tests | Pass |

## 7. Announcement And Resource

| ID | Priority | Acceptance condition | Planned evidence | Status |
| --- | --- | --- | --- | --- |
| P04-AC-042 | Must | Teacher tạo, sửa và publish Announcement trong owned Classroom | API/UI tests | Pass |
| P04-AC-043 | Must | Student Stream chỉ thấy effective published Announcement, sort/page đúng | API/E2E tests | Pass |
| P04-AC-044 | Must | Unpublish/archive Announcement ẩn khỏi Student và giữ audit | Integration test | Pass |
| P04-AC-045 | Conditional | External resource chỉ nhận safe HTTPS URL và reauthorize access | URL/security tests hoặc N/A decision | Not Applicable |
| P04-AC-046 | Conditional | GCS upload private, MIME/size/access/cleanup controls đầy đủ | Cloud/security evidence hoặc N/A decision | Not Applicable |

## 8. Student Learning And Progress

| ID | Priority | Acceptance condition | Planned evidence | Status |
| --- | --- | --- | --- | --- |
| P04-AC-047 | Must | Enrolled Student xem Classwork published theo canonical order | API/UI tests | Pass |
| P04-AC-048 | Must | Lesson Player render sanitized content, deadline và Flashcard | Component/E2E tests | Pass |
| P04-AC-049 | Must | Explicit Lesson start idempotent; GET không side effect | API/Mongo tests | Pass |
| P04-AC-050 | Must | Complete lần đầu trả first timestamp; retry không thay timestamp | API tests | Pass |
| P04-AC-051 | Must | Concurrent complete tạo đúng một natural-key record/side effect | Race test | Pass |
| P04-AC-052 | Must | To-do v1 chỉ gồm visible required incomplete Lesson, overdue trước | Query/UI tests | Pass |
| P04-AC-053 | Must | Completed Lesson rời active To-do và deadline update phản ánh ngay | Integrated E2E | Pass |
| P04-AC-054 | Must | Student deadline/progress view chỉ có dữ liệu của chính mình | IDOR/API/UI tests | Pass |

## 9. Teacher Dashboard And Admin Governance

| ID | Priority | Acceptance condition | Planned evidence | Status |
| --- | --- | --- | --- | --- |
| P04-AC-055 | Must | Course Dashboard summary count/average đúng một `asOf` | Query/API tests | Pass |
| P04-AC-056 | Must | Activity list có status, required, deadline và completion count đúng | API/UI tests | Pass |
| P04-AC-057 | Must | Student list search/filter/page đúng active roster | API/UI tests | Pass |
| P04-AC-058 | Must | Ranking v1 deterministic và trả metric version, không gọi là grade | Unit/API/UI tests | Pass |
| P04-AC-059 | Must | Admin thấy contentCount/governance metadata nhưng không mutate/body | API/UI authorization tests | Pass |

## 10. Quality, Security, DevOps And Evidence

| ID | Priority | Acceptance condition | Planned evidence | Status |
| --- | --- | --- | --- | --- |
| P04-AC-060 | Must | OpenAPI có đủ Must routes/schema/security/error examples và route parity | OpenAPI CI report | Pass |
| P04-AC-061 | Must | Collection/index manifest đúng và query chính dùng index phù hợp | Mongo tests/explain evidence | Pass |
| P04-AC-062 | Must | Markdown XSS/unsafe URL corpus không thực thi hoặc leak | Security/component/E2E tests | Pass |
| P04-AC-063 | Must | Unit/integration/transaction test suites pass với coverage gate hiện tại | CI reports | Pass |
| P04-AC-064 | Must | React component và five critical browser journeys pass | Test/Playwright report | Pass |
| P04-AC-065 | Must | Critical screens keyboard-accessible, desktop/mobile không overlap/overflow | A11y/visual evidence | Pass |
| P04-AC-066 | Must | To-do/dashboard/structure đạt performance baseline hoặc approved non-high exception | Performance report | Pass |
| P04-AC-067 | Must | Docker clean build/start/seed/smoke và clean-clone onboarding pass | Command/runtime evidence | Pass |
| P04-AC-068 | Must | PR/main CI required checks, audit, secret scan xanh; evidence/exit docs đầy đủ | GitHub URLs + register | Pass |

## 11. BA Acceptance Mapping

| BA criterion | P04 criteria |
| --- | --- |
| `DATA-AC-003` Publish Content | `P04-AC-016/017/020/028/030` |
| `DATA-AC-004` Lesson Completion | `P04-AC-049..051` |
| `DATA-AC-005` Deadline Reset | `P04-AC-035..041` |
| `AC-DASH-001` Student To-do | `P04-AC-052..054` |
| `AC-DASH-002` Teacher Course Dashboard | `P04-AC-055..058` |
| `UI-TEA-001..003` | `P04-AC-013..034/042` |
| `UI-STU-004/006` | `P04-AC-047..054/065` |
| `TS-018..020/026` | `P04-AC-060..068` |

## 12. Current Result

| Group | Total | Pass | Fail | Blocked | Not Run | N/A |
| --- | --- | --- | --- | --- | --- | --- |
| All Must | 66 | 66 | 0 | 0 | 0 | 0 |
| Conditional | 2 | 0 | 0 | 0 | 0 | 2 |

Hai Conditional criteria ở trạng thái `Not Applicable` theo `conditional-resource-decision.md`. Clean-clone onboarding tại commit `ccf032c` đã pass, PR triển khai [#10](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/10) đã merge, [PR CI](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/29798342894) và [post-merge main CI](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/29799307403) đều xanh đủ 6 job. Kết quả Phase 04 là `66/66 Must Pass`.
