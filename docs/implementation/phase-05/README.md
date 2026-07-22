# Phase 05 - Assessments And Grading

## 1. Mục Đích

Phase 05 mở rộng nền tảng Learning Content của Phase 04 thành workflow đánh giá có thể sử dụng thực tế. Teacher tạo và phát hành Quiz/Assignment; Student làm Quiz, nộp Assignment; hệ thống tự chấm câu hỏi khách quan, chuyển câu trả lời ngắn sang manual review; Teacher chấm, phản hồi và trả kết quả; Student chỉ xem kết quả của chính mình sau khi được phát hành.

Phase này đồng thời mở rộng Activity contract, Student To-do, Deadline View và Course progress từ `LESSON` sang `QUIZ` và `ASSIGNMENT`. Phase 05 không triển khai reporting/analytics nâng cao của Phase 06 và không giả lập file storage khi private Google Cloud Storage chưa được triển khai ở Phase 07.

## 2. Trạng Thái

| Thuộc tính | Giá trị |
| --- | --- |
| Phase ID | `P05` |
| Tên | `Assessments And Grading` |
| Dependency | Phase 04 đã hoàn thành và merge vào `main` tại `4860e45` |
| Planning branch | `docs/phase-05-planning-baseline` |
| Planning status | `READY_TO_CODE` |
| Gate A | `APPROVED` - Product Owner đã chấp thuận baseline ngày `2026-07-22` |
| Implementation status | `NOT_STARTED` |
| Implementation branch đầu tiên | `feature/phase-05-foundation`; các branch sau theo `pull-request-execution-guide.md` |
| Exit target | Toàn bộ Must acceptance criteria Pass, không còn Critical/High defect |
| Phase tiếp theo | `P06 - Reporting And Analytics` |

`READY_TO_CODE` xác nhận scope, contract, decision, test catalog và thứ tự triển khai đã được chấp thuận. Trạng thái này không có nghĩa runtime đã được triển khai; Developer vẫn phải đưa planning baseline qua protected Pull Request và đồng bộ `main` trước khi tạo implementation branch đầu tiên.

## 3. Business Outcome

- Teacher tạo Quiz, cấu hình thời gian, số lần làm, hạn nộp, chính sách phát hành kết quả và bộ câu hỏi hợp lệ.
- Student bắt đầu attempt đúng quyền, lưu câu trả lời, submit an toàn và không tạo attempt/score trùng khi retry.
- Hệ thống tự chấm `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`; `SHORT_ANSWER` chuyển sang manual review.
- Teacher xem kết quả Quiz, hoàn tất manual review, phát hành hoặc trả kết quả cho Student.
- Teacher tạo Assignment, quy định hình thức nộp, hạn nộp, nộp trễ, unsubmit/resubmit và lifecycle.
- Student lưu bài nháp, turn in, unsubmit/resubmit theo policy; trạng thái on-time/late/missing được tính bằng server time.
- Teacher xem Submission table, chấm điểm, feedback, regrade và return work; mọi thay đổi quan trọng có history/AuditLog.
- Student xem Grade/Feedback của chính mình sau khi result/work được `RETURNED` hoặc phát hành theo policy.
- Teacher cấp deadline exception cho từng Student với lý do, revision và lịch sử; chỉ Student liên quan bị ảnh hưởng.
- Student To-do, Deadline View, Classwork và progress phản ánh `LESSON`, `QUIZ`, `ASSIGNMENT` theo contract version mới.

## 4. BA Baseline

| Nhóm | ID chính |
| --- | --- |
| Functional Requirements | `FR-036..048`, phần mở rộng `FR-049/050/054..057/059..064/067..069` |
| Teacher User Stories | `US-TCH-007/012..014/018/019/044/045/058..079` |
| Student User Stories | `US-STU-007/009/010/012/021/022/027/029/036..060` |
| Use Cases | `UC-010/019/021/022/041/042/045/053/056..059/061/063/064` |
| Business Rules | `BR-007`, `BR-031/032`, `BR-069..096` |
| Acceptance | `AC-ASM-001..006`, `DATA-AC-006..008`, `UI-STU-004/005/006`, `UI-TEA-004/005`, `TS-009/015/021..023/027` |

Chi tiết các refinement và disposition khác BA gốc nằm tại `ba-alignment-and-decisions.md`.

## 5. Must Scope

1. Quiz CRUD mềm, ownership, lifecycle, availability, attempt/time limit và result release policy.
2. Question CRUD/reorder cho bốn loại; validation option/correct answer/points và immutable attempt snapshot.
3. Student Quiz intro, start attempt, save answer, resume, submit, timeout reconciliation và own result.
4. Auto-grading objective question; Teacher manual review `SHORT_ANSWER`; regrade/history.
5. Teacher Quiz result list/detail và performance summary cơ bản.
6. Assignment CRUD mềm, lifecycle, due date, allowed submission methods và late/resubmit policy.
7. Student submission draft, turn in, unsubmit/resubmit, revision history và derived missing/late state.
8. Teacher Submission table/detail, grade draft, feedback, return work và regrade.
9. Student own Grade/Feedback list/detail với release boundary bắt buộc.
10. Per-Student deadline exception cho `LESSON`, `QUIZ`, `ASSIGNMENT`, gồm history/audit/recalculation.
11. Mở rộng Classwork, To-do, Deadline View và progress sang `QUIZ/ASSIGNMENT`.
12. Permission, ownership, enrollment, answer secrecy, grade privacy, concurrency và abuse controls.
13. Swagger/OpenAPI, unit, Mongo integration, component, E2E, accessibility và performance tests.
14. Docker demo seed, CI quality gates, clean-clone evidence và phase exit evidence.

## 6. Conditional Should

- Question media bằng allowlisted HTTPS image URL và approved video URL.
- Assignment submission bằng external HTTPS link.
- `MARK_DONE` cho Assignment khi Teacher bật rõ ràng.
- Private comment trong ngữ cảnh Assignment.
- Basic Course Gradebook read model; export để Phase 06.

Conditional item chỉ được bật khi Must critical path xanh, có owner, acceptance criteria và security review.

## 7. Deferred / Out Of Scope

- Upload image/video và Student file submission lên private GCS: Phase 07, theo `conditional-media-and-storage-decision.md`.
- General Learning Resource upload/download: Phase 07.
- Composite weighted `processScore`, advanced Gradebook, CSV/XLSX export và Admin reporting: Phase 06.
- Plagiarism detection, proctoring, question bank marketplace, random question pools và rubric engine nâng cao.
- Bulk grade import, grading period, category weighting, letter grade và transcript.
- Resubmit sau khi work đã `RETURNED`; P05 chỉ hỗ trợ unsubmit/resubmit trước Grade/Return theo policy.
- External email/Gmail notification; in-app notification thuộc Phase 06/07 nếu được bật.
- Real-time collaborative grading, live chat và video conference.

## 8. Quyết Định Cốt Lõi

| Chủ đề | Baseline Phase 05 |
| --- | --- |
| Architecture | Modular Monolith, domain module giao tiếp qua reader/writer port |
| Quiz version | Attempt giữ immutable assessment/question/scoring snapshot |
| Objective scoring | Backend exact-match, không nhận score từ client |
| Short answer | Luôn `NEEDS_REVIEW` trong MVP; Teacher chấm thủ công |
| Attempt concurrency | Một active attempt/Student/Quiz; attempt number cấp transactionally |
| Timeout | Server clock; lazy reconciliation trên read/write và explicit finalize path |
| Assignment submission | Một current Submission + append-only revisions/events |
| Missing | Derived state, không tạo hàng loạt placeholder Submission |
| Grade visibility | Student chỉ thấy Grade/Feedback khi `RETURNED/RELEASED` |
| Regrade | Optimistic revision + append-only grade history + AuditLog |
| Deadline exception | Override theo Student; precedence cao hơn activity default |
| Progress | `P05_REQUIRED_ACTIVITY_COMPLETION_V1`; score chưa đưa vào weighted process score |
| Storage | URL-only conditional; private upload deferred P07 |

## 9. Tài Liệu Phase

| File | Mục đích |
| --- | --- |
| `phase-plan.md` | Gate, milestone, critical path và PR strategy |
| `scope-and-deliverables.md` | Scope, actor, dependency, output và phase boundary |
| `ba-alignment-and-decisions.md` | BA refinement và disposition các điểm chưa thống nhất |
| `technical-decisions.md` | Decision register bắt buộc trước code |
| `architecture-and-module-design.md` | Module boundary, port và request flow |
| `assessment-lifecycle-and-scoring.md` | Quiz/Question/Attempt/scoring/result lifecycle |
| `assignment-submission-grading.md` | Assignment/Submission/Grade/Feedback lifecycle |
| `deadline-exceptions-and-derived-state.md` | Deadline precedence, late/missing, To-do/progress |
| `security-ownership-and-privacy.md` | RBAC, IDOR, answer secrecy, grade/privacy controls |
| `data-model-and-indexes.md` | Collection, field, index, transaction và migration |
| `migration-and-rollback.md` | Schema/index rollout, rollback và reconciliation |
| `api-contract.md` | REST endpoint, payload, response, error và OpenAPI |
| `runtime-contract-catalog.md` | TypeScript constants, permissions, ports, service và DTO contract |
| `source-file-blueprint.md` | File Create/Modify cụ thể theo module, slice và Pull Request |
| `api-ui-integration-matrix.md` | Ánh xạ 52 API cùng P04 read models tới React screen/action/state |
| `backend-implementation-plan.md` | Vertical slice backend và dependency order |
| `frontend-implementation-plan.md` | Route, screen, component, state và accessibility |
| `devops-environment-and-seeding.md` | Env, seed, Docker, CI và operational boundary |
| `testing-strategy.md` | Test pyramid, fixture, performance và quality gates |
| `test-case-catalog.md` | Chi tiết 74 integration cases, OpenAPI, Web và 12 E2E journeys |
| `acceptance-criteria.md` | Điều kiện Pass/Fail kiểm chứng được |
| `traceability-matrix.md` | BA -> task -> API/UI/data -> test |
| `work-breakdown-structure.md` | Task, dependency, output, estimate và status |
| `implementation-checklist.md` | Checklist Gate A-E |
| `risk-and-issues.md` | Risk, trigger, mitigation và contingency |
| `developer-start-guide.md` | Trình tự bắt đầu code và command kiểm tra |
| `pull-request-execution-guide.md` | Branch, file scope, test/evidence và exit cho P05-PR01..08 |
| `development-readiness-review.md` | Gate A review và điều kiện `READY_TO_CODE` |
| `conditional-media-and-storage-decision.md` | Quyết định URL-only/defer private upload |
| `evidence-register.md` | Evidence phải thu thập trong implementation |
| `phase-exit-evidence.md` | Mẫu bằng chứng đóng phase |
| `exit-report.md` | Báo cáo đóng phase, hiện ở trạng thái chưa thực thi |

## 10. Definition Of Ready

- Must/Conditional/Deferred và boundary P05/P06/P07 không mâu thuẫn.
- Quiz, Attempt, Assignment, Submission, Grade và Deadline Exception state machine đã khóa.
- Question validation, scoring, result release và regrade policy kiểm thử được.
- API request/response/error, ownership và privacy projection đã khóa.
- Collection/index/transaction/concurrency strategy đã khóa.
- To-do/progress integration có version và completion policy rõ.
- UI route cùng loading/empty/error/forbidden/conflict/expired state đã định nghĩa.
- Acceptance criteria ánh xạ được tới WBS, test và evidence.
- Không còn decision `TBD` chặn Must implementation.
- Planning PR được review, CI xanh và merge vào `main`.

Developer sau Gate A nên đọc theo đường ngắn: `source-file-blueprint.md` -> `runtime-contract-catalog.md` -> `api-ui-integration-matrix.md` -> `test-case-catalog.md` -> `pull-request-execution-guide.md`, rồi mở domain document tương ứng với slice đang code.

## 11. Exit Signal

Phase 05 chỉ được ghi `COMPLETED` khi Must scope chạy bằng React/API/MongoDB thật; OpenAPI khớp runtime route; concurrency, privacy và scoring tests pass; Docker/E2E/clean-clone pass; implementation PR và post-merge `main` CI xanh; không còn Critical/High defect; evidence có commit/URL cụ thể; Phase 06 nhận activity, grade và progress contracts đã version hóa.
