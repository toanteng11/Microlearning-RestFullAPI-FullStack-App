# Phase 06 Test Case Execution Matrix

## 1. Status

`ADMIN_API_LOCAL_PASS_REMOTE_PENDING`. Part 01-13 đã có local code/test evidence; Parent PR,
remote required CI, review và merge vẫn đang chờ.

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
| `P06-UT-009..014` | Grade/ranking/Gradebook | 6 | Pass | Policy/foundation/Gradebook tests; commits `1afe813`, `fe36dda` |
| `P06-UT-015..017,020` | Freshness/time/version | 4 | Pass | Policy/env/foundation tests; commit `1afe813` |
| `P06-UT-018..019` | CSV/event Conditional | 2 | Not Run | Scheduled Part 15; flags remain `false` |

## 4. Integration Groups

| IDs | Scope | Expected count | Result | Evidence |
| --- | --- | ---: | --- | --- |
| `P06-IT-001..010` | Foundation/schema/index | 10 | Pass | Focused Mongo foundation `11/11`; commit `1afe813` |
| `P06-IT-011..020` | Refresh/rebuild/reconcile | 10 | Pass | Mongo refresh cases, reconciliation tests và CLI evidence |
| `P06-IT-021..028` | Student | 8 | Pass | Full Mongo integration `87/87`; Student reporting suite Pass |
| `P06-IT-029..038,042` | Teacher | 11 | Pass | Teacher service/route/integration tests; ownership, ranking, analytics và detail Pass |
| `P06-IT-039..041` | Gradebook | 3 | Pass | `phase-six-gradebook.integration.test.ts`; full Mongo `90/90` |
| `P06-IT-043..050` | Admin/privacy | 8 | Local Pass | `phase-six-admin-reporting.test.ts`; focused Mongo integration `4/4`; commit `2bbbc2d` |
| `P06-IT-051..060` | Conditional/security | 10 | Not Run/N/A | - |

## 5. Web And Browser

| IDs | Expected count | Result | Evidence |
| --- | ---: | --- | --- |
| `P06-WEB-001..003` | 3 | Pass | Student reporting component suite |
| `P06-WEB-004..007` | 4 | Pass | `teacher-reporting.test.tsx`; Teacher component `7/7` |
| `P06-WEB-008,010,013..015` | 5 | Pass | Gradebook empty/responsive/error/URL/keyboard/long text; Web `115/115` |
| `P06-WEB-009,011..012` | 3 | Not Run/N/A | Admin và Conditional Parts 14-15 |
| `P06-E2E-01..04` | 4 | Pass | `phase-06-student-reporting.spec.ts`; full browser suite Pass |
| `P06-E2E-05,06,08` | 3 | Pass | `phase-06-teacher-reporting.spec.ts`; Teacher `2/2` |
| `P06-E2E-07,09` | 2 | Pass | Gradebook status/filter và regrade invalidation; Gradebook E2E `3/3` |
| `P06-E2E-10..12` | 3 | Not Run/N/A | Admin và Conditional Parts 14-15 |
| Accessibility/visual responsive review | 1 review set | Pass | Gradebook `390x844` overflow Pass; Axe serious/critical `0` |

## 6. Performance

| IDs | Expected count | Result | Dataset/report |
| --- | ---: | --- | --- |
| `P06-PERF-001` | 1 | Pass | Calculator benchmark `100x50`, p95 `278.75 ms`, heap `35 MB` |
| `P06-PERF-002..003` | 2 | Pass | `100x50`: Dashboard p95 `562.55 ms`; ranking p95 `278.44 ms` |
| `P06-PERF-004` | 1 | Pass | Gradebook endpoint `100x50`, p95 `160.69 ms`, target `<=1500 ms` |
| `P06-PERF-005` | 1 | Pass | Rebuild batch resource evidence từ Part 06 |
| `P06-PERF-006` | 1 | Local Pass | Audit filter, 200 rows/10 requests, p95 `28.07 ms`, named index, target `<=1200 ms` |

## 7. Contract And Regression

| Suite | Result | Evidence |
| --- | --- | --- |
| OpenAPI parser/parity | Student + Teacher + Gradebook + Admin Pass local | 13 unique P06 operations; API suite `220/220` |
| P05 version assertions | Pass | P05 Gradebook operation/flag retired; one P06 operation |
| P02-P05 regression | Pass local | API `215/215`, Web `115/115`, integration `90/90`, E2E `32/32` |
| Docker replica-set smoke | Pass | Integrated Mongo/API/Web stack và deterministic seed |
| Clean clone | Not Run | - |
| Secret/dependency scan | Remote Pending | Required CI jobs chạy tại P06-PR02 |

## 8. Final Summary

```text
Unit/component: API 220/220; Web 115/115; coverage gates Pass
Integration: prior full replica-set 90/90; Part 13 focused local Mongo 4/4; remote replica-set rerun pending
Web: Student, Teacher và Gradebook required Part 07-12 cases Pass; Admin Web is Part 14
Browser E2E: 32/32 full regression Pass; Gradebook 3/3
Performance: 6/6 local evidence present; final hardening rerun belongs to Part 16
OpenAPI/regression/operations: Student + Teacher + Gradebook + Admin local Pass
Decision: ADMIN_API_LOCAL_PASS_REMOTE_PENDING
```
