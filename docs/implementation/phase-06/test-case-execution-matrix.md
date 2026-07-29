# Phase 06 Test Case Execution Matrix

## 1. Status

`FOUNDATION_LOCAL_PASS_REMOTE_PENDING`. Part 01-06 đã có kết quả local; các nhóm thuộc Part
07-17 vẫn giữ `Not Run`.

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
| `P06-IT-021..028` | Student | 8 | Not Run | - |
| `P06-IT-029..042` | Teacher/Gradebook | 14 | Not Run | - |
| `P06-IT-043..050` | Admin/privacy | 8 | Not Run | - |
| `P06-IT-051..060` | Conditional/security | 10 | Not Run/N/A | - |

## 5. Web And Browser

| IDs | Expected count | Result | Evidence |
| --- | ---: | --- | --- |
| `P06-WEB-001..015` | 15 | Not Run | - |
| `P06-E2E-01..12` | 12 | Not Run | - |
| Accessibility/visual responsive review | 1 review set | Not Run | - |

## 6. Performance

| IDs | Expected count | Result | Dataset/report |
| --- | ---: | --- | --- |
| `P06-PERF-001` | 1 | Pass | Calculator benchmark `100x50`, p95 `278.75 ms`, heap `35 MB` |
| `P06-PERF-002..006` | 5 | Not Run | Thực hiện cùng reporting API ở Part 07-14 |

## 7. Contract And Regression

| Suite | Result | Evidence |
| --- | --- | --- |
| OpenAPI parser/parity | Pass for foundation schemas | API unit/OpenAPI tests trong `npm run check:ci` |
| P05 version assertions | Pass | API regression suite |
| P02-P05 regression | Pass local | API `202/202`, Web `99/99`, integration `82/82` |
| Docker replica-set smoke | Pass for foundation | Isolated Mongo replica-set integration project |
| Clean clone | Not Run | - |
| Secret/dependency scan | Remote Pending | Required CI jobs chạy tại P06-PR02 |

## 8. Final Summary

```text
Unit: 18/20 Pass; 2 Conditional chưa đến Part 15
Integration: 20/60 Pass; 40 thuộc Part 07-15 chưa chạy
Web: 0/15
Browser E2E: 0/12
Performance: 1/6 Pass; 5 phụ thuộc runtime APIs
OpenAPI/regression/operations: Foundation local Pass
Decision: FOUNDATION_LOCAL_PASS_REMOTE_PENDING
```
