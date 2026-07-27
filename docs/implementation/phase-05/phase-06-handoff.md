# Phase 05 To Phase 06 Handoff

## 1. Handoff Identity

| Field | Value |
| --- | --- |
| Handoff ID | `P05-P06-HANDOFF-V1` |
| Producer | `P05 - Assessments And Grading` |
| Consumer | `P06 - Reporting And Analytics` |
| Source commit | `e755ca6` |
| Release merge commit | `88404f3` |
| Effective date | `2026-07-27` |
| Status | `ACCEPTED_FOR_P06_PLANNING` |

## 2. Versioned Contracts

| Contract | Runtime version | Producer | P06 usage |
| --- | --- | --- | --- |
| Mixed learning activity descriptor | `P05_ACTIVITY_DESCRIPTOR_V2` | Learning Content/Progress | Phân loại `LESSON`, `QUIZ`, `ASSIGNMENT` và tạo reporting dimensions |
| Student To-do scope | `P05_MIXED_ACTIVITY_TODO_V2` | Student Learning Service | Missing/overdue workload analysis |
| Required activity completion | `P05_REQUIRED_ACTIVITY_COMPLETION_V1` | Learning Progress | Completion numerator, denominator và percentage |
| Grade source | Current `Grade` + immutable `GradeRevision` schema version `1` | Grade module | Gradebook, score distribution, regrade history và trend |
| Assessment source | Current Quiz/Assignment lifecycle schema version `1` | Assessment modules | Published/closed activity counts và completion cohorts |

P06 không được đổi semantics của ba runtime version constants. Khi cần công thức mới, P06
phải phát hành version mới và giữ compatibility với dữ liệu P05.

## 3. Read Boundaries Available To Phase 06

| Boundary | Available data | Privacy constraint |
| --- | --- | --- |
| Activity reader | Activity identity, type, title, required flag, lifecycle và effective deadline | Không đọc Question answer key/rubric |
| Progress reader | Required/completed counts, percentage và metric version | Student scope hoặc Teacher-owned Course |
| Grade reader/repository | Returned/released current Grade, score/maxScore, revision timestamps | Không phát hành draft Grade hoặc private feedback cho Admin reporting |
| Teacher assessment result APIs | Owned Quiz result/Submission roster và basic status counts | Ownership bắt buộc; bounded pagination |
| Admin Course governance | Quiz/Assignment lifecycle counts | Metadata-only; không Student work/answer/Grade body |

P06 phải dùng port/read model được công bố. Không import trực tiếp model của Question,
Attempt answer hoặc Submission body xuyên module để xây report.

## 4. Completion And Score Semantics

- Completion P05 là trạng thái hoàn thành required activity, không phải weighted score.
- Quiz hoàn thành khi Attempt đạt canonical terminal completion theo policy.
- Assignment hoàn thành khi Submission ở trạng thái được tính hoàn thành; `UNSUBMITTED` đưa
  activity trở lại To-do.
- `MISSING` và `ASSIGNED` là derived state từ roster/activity/submission, không có placeholder
  document.
- Grade dùng integer `score/maxScore`; chỉ current returned/released Grade được dùng cho
  Student-facing analytics.
- Regrade giữ append-only `GradeRevision`; P06 phải cho phép trace ngược revision được chọn.

## 5. Scope Accepted By Phase 06

- Basic and advanced Course Gradebook read model.
- Weighted `processScore` với công thức/version công khai.
- Quiz/Assignment completion, score distribution và missing/late analysis.
- Teacher Course analytics và Student progress trend.
- Admin aggregate reporting chỉ dùng metadata/aggregate an toàn.
- CSV/XLSX export sau authorization, bounded query và formula-injection review.
- Reporting performance indexes/read models nếu evidence chứng minh query hiện tại không đủ.

## 6. Explicitly Not Handed To Phase 06

- Question answer key, rubric hoặc raw Attempt answers cho Admin aggregate reports.
- Draft Grade, private feedback hoặc Submission body ngoài actor scope.
- File/media upload, private download URL và object lifecycle; các phần này thuộc Phase 07.
- Plagiarism, proctoring, transcript và grading-period engine.
- Thay đổi P05 lifecycle hoặc scoring snapshot mà không có change control.

## 7. P07 Deferred Boundary

`ASSESSMENT_FILE_UPLOAD_ENABLED=false` và URL media mặc định disabled tại P05. Phase 07 chịu
trách nhiệm private Google Cloud Storage, signed access, malware/content validation, retention
và deletion. P06 không được tạo export/upload flow bằng local disk để lách boundary này.

## 8. Handoff Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Runtime version constants asserted | Pass | API/OpenAPI/unit/integration tests |
| Mixed Lesson/Quiz/Assignment regression | Pass | Mongo integration + `12/12` P05 E2E |
| Grade and progress privacy | Pass | IDOR/projection tests |
| Admin metadata-only boundary | Pass | Governance integration/E2E |
| Source and merge CI | Pass | PR #14 and post-merge `main`, both `6/6` |
| Critical/High defects | `0` | Phase 05 defect review |

## 9. Acceptance

Phase 06 planning chấp nhận các contract/version/boundary trong tài liệu này. Thay đổi
breaking phải cập nhật handoff ID, OpenAPI/read-model contract, migration, regression tests và
traceability trước implementation.
