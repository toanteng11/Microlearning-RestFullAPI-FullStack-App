# Phase 06 Test Case Execution Matrix

## 1. Status

`NOT_RUN`. File này được cập nhật cùng từng implementation PR; test catalog định nghĩa
scenario, execution matrix ghi kết quả thực tế.

## 2. Execution Rules

- `Pass` phải có test file/command/commit/CI URL hoặc report path.
- `Fail` phải có defect ID.
- `Blocked` phải có blocker/owner.
- `N/A` chỉ dùng cho Conditional không được bật và có approval.
- Rerun sau fix giữ evidence mới nhất và liên kết defect cũ.

## 3. Unit Groups

| IDs | Scope | Expected count | Result | Evidence |
| --- | --- | ---: | --- | --- |
| `P06-UT-001..008` | Completion/deadline/process score | 8 | Not Run | - |
| `P06-UT-009..014` | Grade/ranking/Gradebook | 6 | Not Run | - |
| `P06-UT-015..020` | Freshness/time/CSV/event/version | 6 | Not Run | - |

## 4. Integration Groups

| IDs | Scope | Expected count | Result | Evidence |
| --- | --- | ---: | --- | --- |
| `P06-IT-001..010` | Foundation/schema/index | 10 | Not Run | - |
| `P06-IT-011..020` | Refresh/rebuild/reconcile | 10 | Not Run | - |
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
| `P06-PERF-001..006` | 6 | Not Run | - |

## 7. Contract And Regression

| Suite | Result | Evidence |
| --- | --- | --- |
| OpenAPI parser/parity | Not Run | - |
| P05 version assertions | Not Run | - |
| P02-P05 regression | Not Run | - |
| Docker smoke | Not Run | - |
| Clean clone | Not Run | - |
| Secret/dependency scan | Not Run | - |

## 8. Final Summary

```text
Unit: 0/20
Integration: 0/60
Web: 0/15
Browser E2E: 0/12
Performance: 0/6
OpenAPI/regression/operations: Not Run
Decision: NOT_EVALUATED
```
