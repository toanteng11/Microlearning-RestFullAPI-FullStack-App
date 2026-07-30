# Phase 06 Evidence Register

## 1. Rules

Evidence ID không được đánh dấu Pass khi chưa có commit/URL/path/result. Không commit secret,
raw production data hoặc private CSV.

## 2. Planning Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P06-EV-PLAN-001 | Planning document link/encoding validation | Pass | `gate-a-review-evidence.md` |
| P06-EV-PLAN-002 | Gate A approvals | Pass | `gate-a-decision-sheet.md`; `gate-a-review-evidence.md` |
| P06-EV-PLAN-003 | Planning PR/main CI | Pass | PR run `30448148966` (`6/6`); main run `30448420376` Pass |
| P06-EV-PLAN-004 | Planning merge commit | Pass | Squash merge `e7437bc`; local `main` synchronized |

## 3. Data Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P06-EV-DATA-001 | Schema/index tests | Pass | Commit `1afe813`; `phase-six-reporting-foundation.integration.test.ts` |
| P06-EV-DATA-002 | Migration idempotency | Pass | Commit `1afe813`; migration preflight chạy lặp trong focused Mongo suite |
| P06-EV-DATA-003 | Backfill output/count | Pass | Legacy candidate `0`; rebuild all `0` Course; `gate-b-foundation-evidence.md` |
| P06-EV-DATA-004 | Refresh/concurrency/fault isolation | Pass | Commit `1afe813`; CAS, watermark race, stale worker, transaction rollback/fault tests |
| P06-EV-DATA-005 | Reconcile/repair | Pass | `phase-six-reconciliation.test.ts`; CLI dry-run và explicit repair Pass |
| P06-EV-DATA-006 | No-PII read model review | Pass | Summary schema denylist test và migration prohibited-field preflight |

## 4. API/Security Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P06-EV-API-001 | Student APIs/OpenAPI | Local Pass/Committed | Commit `f560233`; `student-reporting-evidence.md`; API `206/206`; OpenAPI parity Pass |
| P06-EV-API-002 | Teacher APIs/OpenAPI | Local Pass/Committed | Commit `9096d78`; `teacher-reporting-evidence.md`; API `210/210`; OpenAPI parity Pass |
| P06-EV-API-003 | Gradebook APIs/OpenAPI | Local Pass/Committed | Commit `fe36dda`; `gradebook-evidence.md`; unique P06 operation |
| P06-EV-API-004 | Admin/Audit APIs/OpenAPI | Not Run | - |
| P06-EV-SEC-001 | RBAC/IDOR | Local Pass | Ownership-before-query, cross-Teacher và out-of-roster Mongo route tests Pass |
| P06-EV-SEC-002 | Projection/privacy/threshold | Gradebook Local Pass | Returned-only average; private answer/feedback denylist Pass; Admin threshold pending |
| P06-EV-SEC-003 | Query/rate/bound injection | Local Pass | Strict Zod query; invalid sort `400`; page max `50`; integration Pass |
| P06-EV-SEC-004 | CSV/event Conditional | Not Run/N/A | - |

## 5. Web Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P06-EV-WEB-001 | Student UI/component/E2E | Local Pass | Full Web `109/109`; full browser E2E `29/29`; `student-reporting-evidence.md` |
| P06-EV-WEB-002 | Teacher UI/component/E2E | Local Pass/Committed | Commit `9096d78`; Teacher component `7/7`; Teacher E2E `2/2` |
| P06-EV-WEB-003 | Gradebook UI/E2E | Local Pass/Committed | Commit `fe36dda`; Gradebook component `6/6`; Gradebook E2E `3/3` |
| P06-EV-WEB-004 | Admin UI/E2E | Not Run | - |
| P06-EV-WEB-005 | Responsive review | Local Pass | Gradebook/Teacher analytics `390x844`, no document overflow |
| P06-EV-WEB-006 | Accessibility report | Local Pass | Gradebook Axe WCAG 2A/2AA/2.1A/2.1AA; serious/critical `0` |

## 6. NFR/DevOps Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P06-EV-NFR-001 | 100x50 benchmark | Pass | 3 iterations; p95 `278.75 ms`; heap `35 MB`; local 2026-07-29 |
| P06-EV-NFR-002 | Explain/index review | Pass | Named index `report_summary_course_default_ranking` asserted in Mongo test |
| P06-EV-NFR-003 | Rebuild batch resource use | Pass | Batch size `1` integration case; CLI default batch `50`; benchmark dataset `100x50` |
| P06-EV-NFR-004 | Gradebook endpoint benchmark | Local Pass | `100x50`, 10 measured requests, p95 `160.69 ms`; target `<=1500 ms` |
| P06-EV-CI-001 | Docker integrated smoke | Local Pass | Mongo replica set + API + Web healthy; clean deterministic seed; browser `32/32` |
| P06-EV-CI-002 | Clean clone | Not Run | - |
| P06-EV-CI-003 | Implementation PR CI | Local Pass/Remote Pending | `npm run check:ci`; API `215`; Web `115`; integration `90`; E2E `32`; remote pending |
| P06-EV-CI-004 | Post-merge main CI | Not Run | - |
| P06-EV-CI-005 | Dependency/secret scan | Baseline Partial | Production audit Pass; remote Secret Scan chờ PR CI |

## 7. Exit Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P06-EV-EXIT-001 | 68 Must AC result | Not Run | - |
| P06-EV-EXIT-002 | Conditional disposition | Gate A Pass | `gate-a-decision-sheet.md`; runtime result cập nhật Gate E |
| P06-EV-EXIT-003 | Regression result | Gradebook Stack Local Pass | API `215`, Web `115`, integration `90`, browser E2E `32`; Gate E chưa chạy |
| P06-EV-EXIT-004 | Defect/waiver review | Pending | - |
| P06-EV-EXIT-005 | Exit report/signoff | Pending | - |
| P06-EV-EXIT-006 | P07 handoff acceptance | Pending | - |

## 8. Evidence Capture Format

```text
Evidence ID:
Commit:
Branch/PR:
Environment:
Command/Journey:
Dataset:
Expected:
Actual:
Result:
URL/Path:
Captured by/date:
```
