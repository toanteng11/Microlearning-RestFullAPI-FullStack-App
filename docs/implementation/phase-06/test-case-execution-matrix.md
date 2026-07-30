# Phase 06 Test Case Execution Matrix

## 1. Status

`STUDENT_REPORTING_LOCAL_PARTIAL_REMOTE_PENDING`. Part 01-06 có kết quả foundation local; Part
07-08 đã pass unit/component/OpenAPI nhưng integration/E2E cần Docker runtime.

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
| `P06-IT-021..028` | Student | 8 | Authored/Blocked Local Runtime | `phase-six-student-reporting.integration.test.ts`; Docker daemon unavailable |
| `P06-IT-029..042` | Teacher/Gradebook | 14 | Not Run | - |
| `P06-IT-043..050` | Admin/privacy | 8 | Not Run | - |
| `P06-IT-051..060` | Conditional/security | 10 | Not Run/N/A | - |

## 5. Web And Browser

| IDs | Expected count | Result | Evidence |
| --- | ---: | --- | --- |
| `P06-WEB-001..003,010,013..015` | 7 | Pass | `reporting.test.tsx`; Web suite `102/102` |
| `P06-WEB-004..009,011..012` | 8 | Not Run | Teacher/Gradebook/Admin Parts 10, 12, 14 |
| `P06-E2E-01..04` | 4 | Authored/Blocked Local Runtime | `phase-06-student-reporting.spec.ts` |
| `P06-E2E-05..12` | 8 | Not Run | Later execution parts |
| Accessibility/visual responsive review | 1 review set | Not Run | - |

## 6. Performance

| IDs | Expected count | Result | Dataset/report |
| --- | ---: | --- | --- |
| `P06-PERF-001` | 1 | Pass | Calculator benchmark `100x50`, p95 `278.75 ms`, heap `35 MB` |
| `P06-PERF-002..006` | 5 | Not Run | Thực hiện cùng reporting API ở Part 07-14 |

## 7. Contract And Regression

| Suite | Result | Evidence |
| --- | --- | --- |
| OpenAPI parser/parity | Student reporting Pass local | Three unique Student operations; API suite `206/206` |
| P05 version assertions | Pass | API regression suite |
| P02-P05 regression | Pass local | API `206/206`, Web `102/102`; integration rerun pending Docker |
| Docker replica-set smoke | Pass for foundation | Isolated Mongo replica-set integration project |
| Clean clone | Not Run | - |
| Secret/dependency scan | Remote Pending | Required CI jobs chạy tại P06-PR02 |

## 8. Final Summary

```text
Unit: 18/20 foundation Pass + 3 Student reporting service cases Pass; 2 Conditional chưa đến Part 15
Integration: 20/60 foundation Pass; Student suite authored nhưng local Docker runtime unavailable
Web: 7/15 Pass
Browser E2E: 4 Student cases represented by one serial journey, authored/chưa chạy
Performance: 1/6 Pass; 5 phụ thuộc runtime APIs
OpenAPI/regression/operations: Student reporting local Pass
Decision: STUDENT_REPORTING_LOCAL_PARTIAL_REMOTE_PENDING
```
