# Phase 05 Test Case Execution Matrix

## 1. Release Identity

| Field | Value |
| --- | --- |
| Catalog | `P05-IT-001..074` |
| Implementation source commit | `e755ca6` |
| Release merge commit | `88404f3` |
| Implementation Pull Request | [#14](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/14) |
| PR CI | [Continuous Integration #30251135895](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/30251135895) |
| Post-merge `main` CI | [Continuous Integration #30251385372](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/30251385372) |
| Evaluation date | `2026-07-27` |
| Result | `74/74 Pass` |

## 2. Count Interpretation

`P05-IT-001..074` là `74` scenario nghiệp vụ trong catalog, không phải yêu cầu Vitest phải
in đúng `74` test block. Phase 05 gom các assertion có chung fixture/transaction vào vertical
integration test để giảm setup lặp và vẫn kiểm tra cùng một database state.

Automated evidence tại release commit gồm:

- `17` Phase 05 Mongo/API vertical integration test blocks.
- `21` Phase 05 API policy/domain unit test blocks.
- `14` React assessment component/page test blocks.
- `12` dedicated Phase 05 Playwright journeys.
- Full Mongo integration regression `72/72`, API unit `180/180`, Web `99/99`.

Vì vậy con số `72/72` của Mongo runner là số test block của toàn bộ integration suite; nó
không biểu thị thiếu hai scenario so với catalog.

## 3. Evidence Bundles

| Bundle | Automated source |
| --- | --- |
| `DATA` | `phase-five-data-foundation.integration.test.ts`, `phase-five-foundation.test.ts` |
| `AUTHOR` | `phase-five-quiz-authoring.integration.test.ts`, `phase-five-question-policy.test.ts`, Teacher Quiz E2E |
| `ATTEMPT` | `phase-five-attempts-submissions.integration.test.ts`, `phase-five-quiz-attempt-policy.test.ts`, Student Quiz E2E |
| `SCORE` | `phase-five-scoring.test.ts`, Quiz review/regrade integration, Teacher review E2E |
| `ASSIGNMENT` | `phase-five-assignment-policy.test.ts`, Assignment/Submission integration, Assignment E2E |
| `GRADE` | `phase-five-grading-deadline-policy.test.ts`, Grade/return/regrade integration, Grade E2E |
| `DEADLINE` | deadline policy, set/revoke/history integration, Deadline/To-do E2E |
| `READMODEL` | mixed activity integration, Phase 04 progress/dashboard regression, Student/Admin E2E |
| `MIGRATION` | migration/preflight/rollback/explain integration, named-index assertions |

## 4. Catalog Execution

| Catalog range | Scenario count | Primary evidence | Result |
| --- | ---: | --- | --- |
| `P05-IT-001..008` | 8 | `DATA`: model/index sync, validation, unique natural keys, legacy progress compatibility và safe projection assertions | `8/8 Pass` |
| `P05-IT-009..016` | 8 | `AUTHOR`: owned Quiz CRUD, four Question types, revision conflict, exact reorder, invalid payload, preview redaction và publish lock | `8/8 Pass` |
| `P05-IT-017..026` | 10 | `ATTEMPT`: concurrent start/resume, attempt limit, CAS save, stale save, idempotent submit, own result và lazy timeout reconciliation | `10/10 Pass` |
| `P05-IT-027..034` | 8 | `SCORE`: objective golden fixtures, exact multiple-choice scoring, manual review, release, regrade, Grade history và privacy | `8/8 Pass` |
| `P05-IT-035..044` | 10 | `ASSIGNMENT`: lifecycle/policy, TEXT-only boundary, safe Student detail, draft CAS, concurrent turn-in, unsubmit/resubmit, history và derived roster | `10/10 Pass` |
| `P05-IT-045..052` | 8 | `GRADE`: score/evidence/revision validation, transactional return, regrade history, draft privacy, own returned Grade và IDOR denial | `8/8 Pass` |
| `P05-IT-053..060` | 8 | `DEADLINE`: Lesson/Quiz/Assignment exception, extension-only policy, stale revision, revoke/history, effective deadline và Student isolation | `8/8 Pass` |
| `P05-IT-061..068` | 8 | `READMODEL`: mixed Classwork/To-do/Deadline/progress, completion reversal, Teacher metric, Admin metadata-only counts và P04 Lesson regression | `8/8 Pass` |
| `P05-IT-069..074` | 6 | `MIGRATION`: compatible expand, invalid preflight, idempotent migration/rollback plan, expiry reconciliation và named `IXSCAN` evidence | `6/6 Pass` |
| **Total** | **74** | Unit + Mongo/API integration + OpenAPI + React + Playwright evidence on release commit | **`74/74 Pass`** |

## 5. Execution Results

| Gate | Result |
| --- | --- |
| API unit | `180/180 Pass` |
| Web component/page | `99/99 Pass` |
| Mongo replica-set integration | `72/72 Pass` |
| OpenAPI contract | `9/9 Pass`; `52/52` Phase 05 operations documented |
| Phase 05 browser journeys | `12/12 Pass` |
| Full Chromium regression | `26/26 Pass` |
| PR required CI | `6/6 Pass` |
| Post-merge `main` required CI | `6/6 Pass` |

## 6. Conclusion

Không có catalog scenario bị bỏ trống. Chênh lệch giữa `74` catalog scenarios và `72`
integration test blocks là khác biệt đơn vị đếm, không phải thiếu coverage. Traceability này
được dùng cùng `acceptance-criteria.md` và `phase-exit-evidence.md` để đóng Gate E.
