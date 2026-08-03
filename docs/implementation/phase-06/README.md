# Phase 06 - Reporting And Analytics

## 1. Mục Đích

Phase 06 chuyển dữ liệu Classroom, Course, Lesson, Quiz, Assignment, Submission, Grade và
Learning Progress đã có thành thông tin có thể hành động cho Student, Teacher và Admin.
Student nhìn thấy việc cần làm, tiến độ và kết quả của chính mình; Teacher theo dõi Course,
Gradebook, mức hoàn thành, điểm quá trình và nhóm cần hỗ trợ; Admin theo dõi vận hành ở mức
metadata/aggregate an toàn.

Reporting trong phase này không tạo một nguồn sự thật học tập mới. Transactional data của
Phase 02-05 vẫn là authoritative source; read model chỉ được phép tăng tốc truy vấn, phải có
version, freshness, khả năng rebuild và reconciliation.

## 2. Trạng Thái

| Thuộc tính | Giá trị |
| --- | --- |
| Phase ID | `P06` |
| Tên | `Reporting And Analytics` |
| Dependency | Phase 05 đã hoàn thành tại merge commit `88404f3`; handoff `P05-P06-HANDOFF-V1` đã được chấp nhận |
| Planning baseline date | `2026-07-29` |
| Planning status | `MERGED_TO_MAIN` |
| Technical completeness | `ACCEPTED_AT_GATE_A` |
| Gate A | `APPROVED` |
| Implementation status | `LOCAL_RELEASE_CANDIDATE_REMOTE_PENDING` |
| Exit target | Toàn bộ Must acceptance criteria Pass, không còn Critical/High defect, evidence có thể tái lập |
| Phase tiếp theo | `P07 - DevOps And Deployment` |

Gate A, planning baseline và planning PR remote CI đã Pass. Toàn bộ Part 01-16 đã có runtime
implementation và local quality evidence. Part 17 đã hoàn thành phần evidence tại local; Phase 06
đang là `LOCAL_RELEASE_CANDIDATE_REMOTE_PENDING` cho đến khi quality branch được mở PR, required CI
Pass, merge qua protected `main`, post-merge main CI Pass và P07 consumer chấp nhận handoff.

## 3. Business Outcome

- Student mở Dashboard và thấy ngay pending, due soon, late/missing work, tiến độ Course và
  Grade đã được trả của chính mình.
- Teacher mở owned Course và thấy summary, activity completion, Student ranking mặc định
  `processScore DESC`, Gradebook, assessment performance và danh sách cần hỗ trợ.
- Teacher drill down đúng một Student trong owned Course mà không đọc dữ liệu ngoài phạm vi.
- Admin xem user/classroom/course/invitation/audit aggregate phục vụ quản trị, không đọc raw
  answer, Submission body, draft Grade hoặc private feedback.
- Mọi metric quan trọng có definition/version, `asOf`, `recalculatedAt` và trạng thái freshness.
- CSV export, nếu Gate A bật, chỉ xuất đúng projection/filter/quyền, có giới hạn và chống CSV
  formula injection; không lưu file trên local disk.
- Analytics event chỉ phục vụ product/operational insight, không thay thế Progress, Grade,
  Enrollment hoặc AuditLog.

## 4. BA Baseline

| Nhóm | ID/tài liệu chính |
| --- | --- |
| Functional Requirements | `FR-016`, `FR-018`, `FR-027`, `FR-049/050/055/059..064/067/069` |
| Reporting Requirements | `REP-001..020` |
| Business Rules | `BR-029`, `BR-033/034`, `BR-069..081`, `BR-105..110` |
| Acceptance | `AC-DASH-001/002`, `AC-ADM-001`, `AC-RPT-001/002`, `AC-API-001..003`, `AC-SEC-001`, `AC-DATA-001` |
| Reporting Catalog | `RPT-STU-001..004`, `RPT-TEA-001..006`, `RPT-ADM-001..006`, `ANA-PRD-001..003`, `ANA-OPS-001/002` |
| NFR | `NFR-PERF-001..010`, `NFR-PERF-API-001..007`, privacy, security, observability và maintainability |
| Handoff | `P05-P06-HANDOFF-V1` |

Refinement và disposition các điểm chưa hoàn toàn thống nhất với BA gốc nằm tại
`ba-alignment-and-decisions.md`.

## 5. Must Scope

1. Student Dashboard summary dùng To-do, Course progress và returned Grade của chính Student.
2. Student Progress page theo Course, gồm required/completed, progress %, process score và
   freshness; trend chỉ hiển thị khi có snapshot đủ tin cậy.
3. Teacher Course Dashboard mở rộng từ P05 với metric contract P06, activity completion,
   assessment status, support indicators và top ranking.
4. Teacher Progress Ranking phân trang phía server, lọc/search/sort có allowlist và mặc định
   `processScore DESC` với tie-breaker ổn định.
5. Basic/advanced Course Gradebook cho Lesson/Quiz/Assignment, current returned Grade,
   missing/late/ungraded state và Student/Course scope đúng quyền.
6. Teacher Student Learning Detail cho một Student thuộc roster của owned Course.
7. Admin Dashboard và governance reports cho user, invitation, Classroom, Course và AuditLog
   metadata; aggregate không lộ nội dung học tập nhạy cảm.
8. Metric definition/version registry; `processScore` V1 do backend tính; freshness/no-data/
   partial/stale contract thống nhất.
9. Rebuildable `CourseProgressSummary` read model, invalidation, reconciliation và fallback có
   kiểm soát; transactional source vẫn authoritative.
10. Permission, ownership, enrollment, privacy, small-group, query-bound và IDOR controls.
11. OpenAPI/Swagger khớp runtime; unit, integration, component, E2E, security và performance
    evidence.
12. Docker demo seed, CI quality gates, clean-clone verification và Phase 07 handoff.

## 6. Conditional Scope

Các item dưới đây chỉ được bật bằng Gate A/change control, có owner và acceptance riêng:

- Bounded synchronous CSV export cho Teacher Gradebook và Admin governance report.
- Safe analytics event ingestion và aggregate trend không chứa PII không cần thiết.
- Student progress trend nếu snapshot history đủ dữ liệu; nếu chưa đủ phải hiển thị `NO_DATA`.
- Admin learning-outcome aggregate khi group size đạt threshold và privacy review Pass.
- Weighted `processScore` V2 chỉ khi Product Owner phê duyệt công thức, weight, ungraded/
  missing policy, historical recalculation và migration.

## 7. Deferred / Out Of Scope

- XLSX và asynchronous export job/private file download: Phase 07 sau private Google Cloud
  Storage, scheduler/worker và retention contract.
- Upload/download file, signed URL, malware scan và object lifecycle: Phase 07.
- Data warehouse, BI platform, Kafka, Redis, message broker hoặc reporting microservice.
- Plagiarism, proctoring, transcript, grading period, letter grade và category weighting.
- Predictive AI, automated intervention, recommendation engine hoặc risk score không giải thích.
- Admin xem raw answers, answer key, Submission body, draft Grade hoặc private feedback.
- Notification/email delivery; analytics không được dùng làm Notification source.

## 8. Quyết Định Cốt Lõi

| Chủ đề | Baseline Phase 06 |
| --- | --- |
| Architecture | Modular Monolith; module `reporting` giao tiếp qua published reader ports |
| Source of truth | Enrollment, Activity, Progress, Submission, Grade và AuditLog transactional data |
| Read model | `CourseProgressSummary`, versioned, rebuildable, không chứa PII hiển thị |
| Process score | `P06_PROCESS_SCORE_V1 = progressPercentage`; `null` khi không có required activity |
| Ranking | `processScore DESC`, completed DESC, missing ASC, late ASC, lastActive DESC, Student ID ASC |
| Grade average | `sum(returned score) / sum(returned maxScore) * 100`; không trộn draft Grade |
| Freshness | `FRESH`, `STALE`, `PARTIAL`, `REBUILDING`, `FAILED`; mọi aggregate có `asOf/recalculatedAt` |
| Export | CSV sync có giới hạn, feature flag và audit; không local disk; XLSX/async deferred |
| Analytics event | Best effort, schema/version/dedupe/no unnecessary PII; không phải learning truth |
| Time | Store UTC; display/filter theo `Asia/Ho_Chi_Minh` mặc định và timezone contract |
| Empty denominator | API trả `null`/`N/A`, không trả `0%` gây hiểu sai |
| Privacy | Backend scope trước filter/query; Admin metadata/aggregate only; small-group threshold |

## 9. Tài Liệu Phase

| File | Mục đích |
| --- | --- |
| `phase-plan.md` | Gate, workstream, milestone, critical path và PR strategy |
| `scope-and-deliverables.md` | Scope, actor, deliverable, dependency và boundary |
| `ba-alignment-and-decisions.md` | BA refinement và resolution các điểm chưa thống nhất |
| `technical-decisions.md` | Decision register và rejected alternatives |
| `gate-a-decision-sheet.md` | Recommended decisions và approval record để chuyển READY_TO_CODE |
| `gate-a-review-evidence.md` | Gate A rationale, resolved inconsistencies và local baseline evidence |
| `architecture-and-module-design.md` | Module, port, query flow, refresh/reconciliation |
| `compatibility-and-cutover-plan.md` | Route ownership, permission, nullability và P05->P06 cutover |
| `metric-definition-and-process-score.md` | Metric dictionary, formula, version và ranking |
| `course-gradebook-and-ranking.md` | Gradebook cell, grade average, late/missing và sort |
| `student-reporting-experience.md` | Student Dashboard, Progress, Grade và privacy |
| `teacher-reporting-experience.md` | Teacher dashboard, drill-down và support workflow |
| `admin-reporting-and-governance.md` | Admin aggregate, audit metadata và privacy |
| `admin-reporting-api-evidence.md` | Admin reporting API/OpenAPI/privacy evidence |
| `admin-reporting-web-evidence.md` | Admin Dashboard/Governance Web/E2E evidence |
| `reporting-access-and-privacy.md` | RBAC, ownership, projection, small group và audit |
| `data-model-and-indexes.md` | Collection, index, TTL, invariant và migration |
| `read-model-refresh-and-reconciliation.md` | Invalidation, refresh, stale/partial và repair |
| `source-event-invalidation-matrix.md` | Mutation method -> scope/reasons/transaction mapping |
| `api-contract.md` | REST endpoint, query, DTO, error và compatibility |
| `report-dto-and-query-contracts.md` | Canonical TypeScript DTO, enum, nullability và strict query defaults |
| `runtime-contract-catalog.md` | Constants, permissions, ports, schemas và TypeScript contract |
| `api-ui-integration-matrix.md` | API -> route/screen/action/state mapping |
| `backend-implementation-plan.md` | Compile-safe backend vertical slices |
| `frontend-implementation-plan.md` | React routes, components, request state và accessibility |
| `export-and-csv-safety.md` | Bounded CSV, projection, injection protection và audit |
| `analytics-event-contract.md` | Event envelope, catalog, privacy, dedupe và operations |
| `conditional-reporting-evidence.md` | CSV/event/trend/outcome result và approved N/A record |
| `source-file-blueprint.md` | File Create/Modify cụ thể |
| `devops-environment-and-seeding.md` | Env, seed, Docker, CI, observability và runbook |
| `migration-and-rollback.md` | Index/read-model rollout, compatibility và rollback |
| `testing-strategy.md` | Test pyramid, fixtures, NFR và quality gates |
| `test-case-catalog.md` | Unit/integration/OpenAPI/Web/E2E/security/performance cases |
| `test-case-execution-matrix.md` | Kết quả thực thi theo test group, command và evidence |
| `acceptance-criteria.md` | Điều kiện Pass/Fail kiểm chứng được |
| `traceability-matrix.md` | BA -> task -> API/UI/data -> test/evidence |
| `work-breakdown-structure.md` | Epic/task/dependency/output/estimate/status |
| `execution-parts/README.md` | Chia 18 phần code nhỏ, dependency, Parent PR, test và Definition of Done |
| `implementation-checklist.md` | Gate A-E và Definition of Done |
| `risk-and-issues.md` | Risk, trigger, prevention, contingency và owner |
| `developer-start-guide.md` | Thứ tự bắt đầu code và command kiểm tra |
| `pull-request-execution-guide.md` | Branch/PR scope, test và evidence từng increment |
| `development-readiness-review.md` | Gate A scorecard và approval record |
| `evidence-register.md` | Evidence cần thu thập trong implementation |
| `quality-hardening-evidence.md` | Full quality, Docker, performance, visual và clean-clone evidence |
| `phase-exit-evidence.md` | Mẫu bằng chứng đóng phase |
| `phase-07-handoff.md` | Contract/boundary bàn giao cho deployment |
| `exit-report.md` | Báo cáo đóng Phase 06 |

## 10. Definition Of Ready

- Must/Conditional/Deferred và P06/P07 boundary không mâu thuẫn.
- Metric formula, denominator, rounding, timezone, freshness và definition version đã khóa.
- Existing route ownership, permission reuse, nullable cutover và old Gradebook retirement đã khóa.
- API request/response/error/pagination/sort và ownership đã khóa.
- Canonical DTO/query cùng source-event invalidation matrix đã khóa.
- Gradebook cell/status và ranking tie-breaker đã khóa.
- Read-model invalidation/rebuild/reconciliation/fallback đã khóa.
- Admin aggregate projection và small-group privacy đã khóa.
- Export/analytics Conditional có feature flag và kill switch.
- Source blueprint, WBS, test catalog, acceptance và evidence ánh xạ được.
- Không còn decision `TBD` chặn Must implementation.
- Planning PR được review, CI xanh, merge vào `main` và Gate A được ghi nhận.

Developer sau Gate A đọc theo đường ngắn:
`execution-parts/README.md` -> file `part-XX-*.md` đang thực hiện ->
`source-file-blueprint.md` -> `runtime-contract-catalog.md` ->
`api-ui-integration-matrix.md` -> `test-case-catalog.md` ->
`pull-request-execution-guide.md`, sau đó mở domain document của slice đang code.

## 11. Exit Signal

Phase 06 chỉ được ghi `COMPLETED` khi Must scope chạy bằng React/API/MongoDB thật; OpenAPI
khớp runtime; scope/privacy/formula/freshness/reconciliation tests Pass; dataset baseline đạt NFR;
Docker/E2E/clean-clone Pass; implementation PR và post-merge `main` CI xanh; không còn
Critical/High defect; evidence có commit/URL cụ thể; Phase 07 nhận được env, storage/export,
observability và deployment contracts rõ ràng.
