# Phase 06 Test Case Execution Matrix

## 1. Status

`LOCAL_QUALITY_PASS_REMOTE_PENDING`. Part 01-16 có local code/test evidence; Part 17 local evidence
đã hoàn thành. Release PR, remote required CI, review, protected-main merge và P07 acceptance đang chờ.

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
| `P06-UT-018..019` | CSV/event Conditional | 2 | Pass | CSV serializer/formula safety và analytics schema/privacy tests; commit `f1baf06` |

## 4. Integration Groups

| IDs | Scope | Expected count | Result | Evidence |
| --- | --- | ---: | --- | --- |
| `P06-IT-001..010` | Foundation/schema/index | 10 | Pass | Focused Mongo foundation `11/11`; commit `1afe813` |
| `P06-IT-011..020` | Refresh/rebuild/reconcile | 10 | Pass | Mongo refresh cases, reconciliation tests và CLI evidence |
| `P06-IT-021..028` | Student | 8 | Pass | Full Mongo integration `87/87`; Student reporting suite Pass |
| `P06-IT-029..038,042` | Teacher | 11 | Pass | Teacher service/route/integration tests; ownership, ranking, analytics và detail Pass |
| `P06-IT-039..041` | Gradebook | 3 | Pass | `phase-six-gradebook.integration.test.ts`; full Mongo `90/90` |
| `P06-IT-043..050` | Admin/privacy | 8 | Pass | Admin service/Mongo/privacy tests; commits `2bbbc2d`, `c1f5fa9` |
| `P06-IT-051..060` | Conditional/security | 10 | Pass | `phase-six-conditional-reporting.integration.test.ts`; commit `f1baf06` |

## 5. Web And Browser

| IDs | Expected count | Result | Evidence |
| --- | ---: | --- | --- |
| `P06-WEB-001..003` | 3 | Pass | Student reporting component suite |
| `P06-WEB-004..007` | 4 | Pass | `teacher-reporting.test.tsx`; Teacher component `7/7` |
| `P06-WEB-008,010,013..015` | 5 | Pass | Gradebook empty/responsive/error/URL/keyboard/long text; Web `126/126` |
| `P06-WEB-009,011..012` | 3 | Pass | Admin Dashboard/Governance và conditional export/component tests |
| `P06-E2E-01..04` | 4 | Pass | `phase-06-student-reporting.spec.ts`; full browser suite Pass |
| `P06-E2E-05,06,08` | 3 | Pass | `phase-06-teacher-reporting.spec.ts`; Teacher `2/2` |
| `P06-E2E-07,09` | 2 | Pass | Gradebook status/filter và regrade invalidation; Gradebook E2E `3/3` |
| `P06-E2E-10..12` | 3 | Pass | Admin governance/privacy `2/2`; disabled conditional action path Pass |
| Accessibility/visual responsive review | 1 review set | Pass | Desktop + `390x844`; overflow Pass; Axe serious/critical `0` |

## 6. Performance

| IDs | Expected count | Result | Dataset/report |
| --- | ---: | --- | --- |
| `P06-PERF-001` | 1 | Pass | Calculator benchmark `100x50`, p50 `355.11 ms`, p95 `1069.79 ms`, heap `27.37 MB` |
| `P06-PERF-002..003` | 2 | Pass | Regression `100x50`: Dashboard p95 `605.92 ms`; ranking p95 `420.86 ms` |
| `P06-PERF-004` | 1 | Pass | Gradebook endpoint `100x50`, p95 `78.87 ms`, target `<=1500 ms` |
| `P06-PERF-005` | 1 | Pass | Rebuild batch resource evidence từ Part 06 |
| `P06-PERF-006` | 1 | Local Pass | Audit filter, 200 rows/10 requests, p95 `28.07 ms`, named index, target `<=1200 ms` |

## 7. Contract And Regression

| Suite | Result | Evidence |
| --- | --- | --- |
| OpenAPI parser/parity | Student + Teacher + Gradebook + Admin + Conditional Pass local | OpenAPI `10/10`; API suite `230/230` |
| P05 version assertions | Pass | P05 Gradebook operation/flag retired; one P06 operation |
| P02-P05 regression | Pass local | API `230/230`, Web `126/126`, integration `97/97`, E2E `34/34` |
| Docker replica-set smoke | Pass | Integrated Mongo/API/Web stack và deterministic seed |
| Clean clone | Pass | Fresh clone `npm ci` + `npm run check:ci`; `quality-hardening-evidence.md` |
| Secret/dependency scan | Local dependency Pass/Remote secret Pending | Production audit Pass; required Secret Scan awaits release PR |

## 8. Final Summary

```text
Unit/component: API 230/230; Web 126/126; coverage gates Pass
Integration: full replica-set 97/97 Pass
Web: Student, Teacher, Gradebook, Admin và Conditional component cases Pass
Browser E2E: fresh Docker stack 34/34 Pass
Performance: 6/6 local evidence present
OpenAPI/regression/operations: 10/10 OpenAPI; all actor and Conditional operations local Pass
Clean clone: npm ci + check:ci Pass
Decision: LOCAL_QUALITY_PASS_REMOTE_PENDING
```
