# Phase 06 Test Case Execution Matrix

## 1. Status

`TEACHER_REPORTING_LOCAL_PASS_REMOTE_PENDING`. Part 01-10 đã có local code/test evidence; Parent
PR, remote required CI, review và merge vẫn đang chờ.

## 2. Execution Rules

- `Pass` phải có test file/command/commit/CI URL hoặc report path.
- `Fail` phải có defect ID.
- `Blocked` phải có blocker/owner.
- `N/A` chỉ dùng cho Conditional không được bật và có approval.
- Rerun sau fix giữ evidence mới nhất và liên kết defect cũ.

## 3. Unit Groups

| IDs | Scope | Expected count | Result | Evidence |
| --- | --- | ---: | --- | --- |
| `P06-UT-001..008` | Completion/deadline/process score | 8 | Pass | `phase-six-reporting-policy.test.ts`; commit `1afe813` |
| `P06-UT-009..014` | Grade/ranking/Gradebook | 6 | Pass | Policy/foundation tests; commit `1afe813` |
| `P06-UT-015..017,020` | Freshness/time/version | 4 | Pass | Policy/env/foundation tests; commit `1afe813` |
| `P06-UT-018..019` | CSV/event Conditional | 2 | Not Run | Scheduled Part 15; flags remain `false` |

## 4. Integration Groups

| IDs | Scope | Expected count | Result | Evidence |
| --- | --- | ---: | --- | --- |
| `P06-IT-001..010` | Foundation/schema/index | 10 | Pass | Focused Mongo foundation `11/11`; commit `1afe813` |
| `P06-IT-011..020` | Refresh/rebuild/reconcile | 10 | Pass | Mongo refresh cases, reconciliation tests và CLI evidence |
| `P06-IT-021..028` | Student | 8 | Pass | Full Mongo integration `87/87`; Student reporting suite Pass |
| `P06-IT-029..038,042` | Teacher | 11 | Pass | Teacher service/route/integration tests; ownership, ranking, analytics và detail Pass |
| `P06-IT-039..041` | Gradebook | 3 | Not Run | Scheduled Parts 11-12 |
| `P06-IT-043..050` | Admin/privacy | 8 | Not Run | - |
| `P06-IT-051..060` | Conditional/security | 10 | Not Run/N/A | - |

## 5. Web And Browser

| IDs | Expected count | Result | Evidence |
| --- | ---: | --- | --- |
| `P06-WEB-001..003` | 3 | Pass | Student reporting component suite |
| `P06-WEB-004..007` | 4 | Pass | `teacher-reporting.test.tsx`; Teacher component `7/7` |
| `P06-WEB-008..009,011..012` | 4 | Not Run | Gradebook/Admin Parts 12, 14 |
| `P06-WEB-010,013..015` | 4 | Pass | URL/error/null/accessibility states; Web suite `109/109` |
| `P06-E2E-01..04` | 4 | Pass | `phase-06-student-reporting.spec.ts`; full browser suite Pass |
| `P06-E2E-05,06,08` | 3 | Pass | `phase-06-teacher-reporting.spec.ts`; Teacher `2/2` |
| `P06-E2E-07,09..12` | 5 | Not Run | Later execution parts |
| Accessibility/visual responsive review | 1 review set | Pass | 390x844 overflow Pass; Axe serious/critical `0` |

## 6. Performance

| IDs | Expected count | Result | Dataset/report |
| --- | ---: | --- | --- |
| `P06-PERF-001` | 1 | Pass | Calculator benchmark `100x50`, p95 `278.75 ms`, heap `35 MB` |
| `P06-PERF-002..003` | 2 | Pass | `100x50`: Dashboard p95 `562.55 ms`; ranking p95 `278.44 ms` |
| `P06-PERF-004..006` | 3 | Not Run | Gradebook/Admin/remaining hardening |

## 7. Contract And Regression

| Suite | Result | Evidence |
| --- | --- | --- |
| OpenAPI parser/parity | Student + Teacher reporting Pass local | Unique operations; API suite `210/210` |
| P05 version assertions | Pass | API regression suite |
| P02-P05 regression | Pass local | API `210/210`, Web `109/109`, integration `87/87`, E2E `29/29` |
| Docker replica-set smoke | Pass | Integrated Mongo/API/Web stack và deterministic seed |
| Clean clone | Not Run | - |
| Secret/dependency scan | Remote Pending | Required CI jobs chạy tại P06-PR02 |

## 8. Final Summary

```text
Unit/component: API 210/210; Web 109/109; coverage gates Pass
Integration: 87/87 full Mongo replica-set Pass
Web: Student và Teacher required Part 07-10 cases Pass
Browser E2E: 29/29 full regression Pass; Teacher 2/2
Performance: 3/6 Pass; remaining cases belong to later Parts
OpenAPI/regression/operations: Student + Teacher reporting local Pass
Decision: TEACHER_REPORTING_LOCAL_PASS_REMOTE_PENDING
```
