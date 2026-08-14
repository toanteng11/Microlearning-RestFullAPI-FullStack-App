# Phase 06 Work Breakdown Structure

## 1. Conventions

Estimate dùng ideal developer-days, không phải cam kết lịch. Status implementation ban đầu
`BACKLOG`; toàn bộ planning T01-T09 đã `DONE`. Owner roles: `TL`, `BE`, `FE`, `QA`, `DEVOPS`,
`SEC`, `BA/PO`.

WBS là nguồn task/estimate; thứ tự code hằng ngày và checkpoint nhỏ được trình bày tại
`execution-parts/README.md`. Không tạo task mới trong Execution Parts nếu chưa ánh xạ về WBS,
acceptance và test tương ứng.

## 2. E01 - Planning And Contract Foundation

| Task | Work | Owner | Dep | Est. | Status |
| --- | --- | --- | --- | --- | --- |
| P06-E01-T01 | Review P05 handoff/source runtime | TL/BE | P05 | 0.5 | DONE |
| P06-E01-T02 | Review BA reporting/NFR/privacy | BA/TL/QA | P05 | 0.5 | DONE |
| P06-E01-T03 | Freeze Must/Conditional/Deferred | PO/TL | T01-02 | 0.5 | DONE |
| P06-E01-T04 | Approve metric/process score | PO/TL/QA | T03 | 0.5 | DONE |
| P06-E01-T05 | Approve Gradebook/ranking | PO/TL | T04 | 0.5 | DONE |
| P06-E01-T06 | Approve Admin/privacy/threshold | SEC/PO | T03 | 0.5 | DONE |
| P06-E01-T07 | Approve export/event flags | PO/SEC/DEVOPS | T03 | 0.5 | DONE |
| P06-E01-T08 | Review DTO/query/cutover/invalidation/API/data/UI/test blueprint | TL/BE/FE/QA | T04-07 | 1.0 | DONE |
| P06-E01-T09 | Merge planning PR/record Gate A | TL | T08 | 0.5 | DONE |

## 3. E02 - Data And Read Model

| Task | Work | Owner | Dep | Est. |
| --- | --- | --- | --- | --- |
| P06-E02-T01 | Constants/types/pure metric policies | BE | E01 | 1.0 |
| P06-E02-T02 | Permission/env schema/tests | BE | E01 | 0.5 |
| P06-E02-T03 | Reader/scope/durable invalidation port contracts | BE/TL | T01 | 1.0 |
| P06-E02-T04 | Producer safe adapters/batch readers | BE | T03 | 2.0 |
| P06-E02-T05 | Summary model/repository/index | BE | T01 | 1.5 |
| P06-E02-T06 | Invalidation `reasons[]` + all source hooks; wrap Student Learning/Review gaps | BE | T05 | 3.0 |
| P06-E02-T07 | Calculator/refresh | BE | T04-06 | 2.0 |
| P06-E02-T08 | Reconcile/rebuild scripts | BE/DEVOPS | T07 | 1.5 |
| P06-E02-T09 | Migration/backfill/rollback | BE/DEVOPS | T05-08 | 1.5 |
| P06-E02-T10 | Mongo/concurrency/fault tests | QA/BE | T05-09 | 2.0 |

`P06-E02-T06` chỉ hoàn thành khi:

- model/repository coalesce `reasons[]` theo scope và giữ watermark mới nhất;
- existing transactions của Enrollment/Classroom/Course/Lesson/Quiz/Assignment/Quiz
  Attempt/Submission/Grade/Deadline Exception ghi intent bằng cùng `ClientSession`;
- `StudentLearningService.start/complete` và `QuizReviewService.saveReview` được wrap
  transaction;
- producer chỉ import neutral writer contract, không import reporting model;
- noop/fake writer chỉ được truyền explicit trong focused unit tests cùng test `ClientSession`;
  production composition không có default/noop;
- rollback/multi-reason/idempotent retry tests Pass tại `P06-E02-T10`.

## 4. E03 - Student Reporting

| Task | Work | Owner | Dep | Est. |
| --- | --- | --- | --- | --- |
| P06-E03-T01 | Student reporting service | BE | E02 | 1.0 |
| P06-E03-T02 | Dashboard endpoint/composition | BE | T01 | 1.0 |
| P06-E03-T03 | Course progress list/detail | BE | T01 | 1.0 |
| P06-E03-T04 | Own Grade/To-do compatibility | BE | T01 | 0.5 |
| P06-E03-T05 | OpenAPI/integration/security tests | BE/QA | T02-04 | 1.0 |
| P06-E03-T06 | Student Dashboard integration | FE | T02 | 1.5 |
| P06-E03-T07 | Student Progress page | FE | T03 | 1.5 |
| P06-E03-T08 | UI states/accessibility/tests | FE/QA | T06-07 | 1.0 |
| P06-E03-T09 | Student E2E | QA | T05-08 | 1.0 |

## 5. E04 - Teacher Reporting

| Task | Work | Owner | Dep | Est. |
| --- | --- | --- | --- | --- |
| P06-E04-T01 | Teacher report route cutover + Dashboard refactor | BE | E02 | 1.5 |
| P06-E04-T02 | Stable ranking repository/service | BE | T01 | 1.0 |
| P06-E04-T03 | Activity analytics | BE | T01 | 1.0 |
| P06-E04-T04 | Assessment analytics | BE | T01 | 1.5 |
| P06-E04-T05 | Student detail | BE | T01 | 1.0 |
| P06-E04-T06 | Ownership/IDOR/OpenAPI tests | QA/BE | T01-05 | 1.5 |
| P06-E04-T07 | Dashboard/analytics UI | FE | T01-04 | 2.0 |
| P06-E04-T08 | Ranking/filter/page UI | FE | T02 | 1.5 |
| P06-E04-T09 | Student detail/Back state UI | FE | T05 | 1.0 |
| P06-E04-T10 | Teacher E2E | QA | T06-09 | 1.5 |

## 6. E05 - Gradebook

| Task | Work | Owner | Dep | Est. |
| --- | --- | --- | --- | --- |
| P06-E05-T01 | Gradebook cell/average policies | BE | E02 | 1.0 |
| P06-E05-T02 | Bounded columns/rows query | BE | T01 | 2.0 |
| P06-E05-T03 | Remove P05 Gradebook route/flag and cut over P06 contract | BE | T02 | 0.5 |
| P06-E05-T04 | Gradebook OpenAPI/privacy/perf tests | BE/QA | T02-03 | 1.5 |
| P06-E05-T05 | Gradebook table/responsive UX | FE | T02 | 2.0 |
| P06-E05-T06 | Gradebook component/page tests | FE/QA | T05 | 1.0 |
| P06-E05-T07 | Regrade/deadline integration E2E | QA | T04-06 | 1.0 |

## 7. E06 - Admin Reporting

| Task | Work | Owner | Dep | Est. |
| --- | --- | --- | --- | --- |
| P06-E06-T01 | Governance/audit reader adapters | BE | E02 | 1.5 |
| P06-E06-T02 | Admin Dashboard service/route | BE | T01 | 1.0 |
| P06-E06-T03 | Governance report/filter | BE | T01 | 1.0 |
| P06-E06-T04 | Threshold/redaction/audit | BE/SEC | T02-03 | 1.0 |
| P06-E06-T05 | OpenAPI/privacy/integration tests | QA/BE | T02-04 | 1.5 |
| P06-E06-T06 | Admin Dashboard/Reports UI | FE | T02-03 | 2.0 |
| P06-E06-T07 | Admin states/accessibility | FE/QA | T06 | 0.5 |
| P06-E06-T08 | Admin privacy E2E | QA/SEC | T05-07 | 1.0 |

## 8. E07 - Conditional Capabilities

| Task | Work | Owner | Dep | Est. |
| --- | --- | --- | --- | --- |
| P06-E07-T01 | Confirm Conditional enablement | PO/TL | E01 | 0.25 |
| P06-E07-T02 | CSV serializer/stream | BE | T01/E04-06 | 1.0 |
| P06-E07-T03 | Export scope/audit/safety tests | BE/QA/SEC | T02 | 1.0 |
| P06-E07-T04 | Export UI | FE | T02 | 0.5 |
| P06-E07-T05 | Event schema/model/service | BE | T01 | 1.0 |
| P06-E07-T06 | Event privacy/failure tests | QA/SEC | T05 | 0.75 |
| P06-E07-T07 | Trend snapshot/API/UI | BE/FE | T01/E03 | 1.5 |
| P06-E07-T08 | Conditional evidence/N/A record | TL/QA | T02-07 | 0.5 |

## 9. E08 - Quality, DevOps And Exit

| Task | Work | Owner | Dep | Est. |
| --- | --- | --- | --- | --- |
| P06-E08-T01 | Deterministic reporting seed | BE | E03-06 | 1.0 |
| P06-E08-T02 | 100x50 benchmark fixture | BE/QA | T01 | 1.0 |
| P06-E08-T03 | Explain/performance/load evidence | QA/BE | T02 | 1.0 |
| P06-E08-T04 | CI/OpenAPI/E2E gates | DEVOPS/QA | E03-07 | 1.0 |
| P06-E08-T05 | Docker integrated smoke | DEVOPS | T01/T04 | 0.5 |
| P06-E08-T06 | Clean-clone verification | QA/DEVOPS | T04-05 | 0.5 |
| P06-E08-T07 | Security/privacy review | SEC | E03-07 | 1.0 |
| P06-E08-T08 | Visual/accessibility review | FE/QA | E03-07 | 0.5 |
| P06-E08-T09 | Defect/waiver review | TL/PO/QA | T03-08 | 0.5 |
| P06-E08-T10 | Exit evidence/report | TL/QA | T09 | 0.5 |
| P06-E08-T11 | P07 handoff acceptance | TL/DEVOPS | T10 | 0.5 |

## 10. Estimate Summary

| Epic | Ideal days |
| --- | ---: |
| E01 | 5.0 |
| E02 | 16.0 |
| E03 | 9.5 |
| E04 | 13.5 |
| E05 | 9.0 |
| E06 | 9.5 |
| E07 Conditional | 6.5 |
| E08 | 8.0 |
| Total Must-oriented | `70.5` excluding unapproved Conditional |
| Conditional max | `6.5` |
| Total if all Conditional approved | `77.0` |

Một developer thực hiện tuần tự cần chia nhiều iteration; estimate không thay lịch chính thức.

## 11. Critical Dependencies

- E02 blocks actor reports.
- Teacher Gradebook depends P05 Grade/Submission semantics.
- Conditional export depends stable JSON report/projection.
- E08 cannot start final evidence before actor slices stable.
- Phase 07 handoff depends env/migration/observability finalized.

## 12. Execution Status Summary

| Epic | Local status | Evidence |
| --- | --- | --- |
| E01 Planning | Done | PR `#16`, merge `e7437bc` |
| E02 Data And Read Model | Done | `gate-b-foundation-evidence.md` |
| E03 Student | Done | `student-reporting-evidence.md` |
| E04 Teacher | Done | `teacher-reporting-evidence.md` |
| E05 Gradebook | Done | `gradebook-evidence.md` |
| E06 Admin | Done | Admin API/Web evidence files |
| E07 Conditional | Done/Approved N/A | `conditional-reporting-evidence.md` |
| E08 Quality And Exit | Done | `quality-hardening-evidence.md`, `phase-exit-evidence.md`; PR/main CI Pass |

E08-T11 và toàn bộ release gates đã hoàn thành qua PR `#18`, merge commit `d2abe52`, main CI run
`30786783937` và P07 consumer acceptance ngày `2026-08-03`.
