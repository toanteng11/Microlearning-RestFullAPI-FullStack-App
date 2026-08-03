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
| P06-EV-API-004 | Admin/Audit APIs/OpenAPI | Local Pass/Committed | Commit `2bbbc2d`; `admin-reporting-api-evidence.md`; API `220/220`; OpenAPI parity Pass |
| P06-EV-SEC-001 | RBAC/IDOR | Local Pass | Ownership-before-query, cross-Teacher và out-of-roster Mongo route tests Pass |
| P06-EV-SEC-002 | Projection/privacy/threshold | Admin API Local Pass | Safe AuditLog projection; Grade/answer/Submission/feedback denylist; threshold policy applies equally to Admin/Super Admin |
| P06-EV-SEC-003 | Query/rate/bound injection | Local Pass | Strict Zod query; invalid sort `400`; page max `50`; analytics identity limit `120`; integration Pass |
| P06-EV-SEC-004 | CSV/event Conditional | Local Pass/Committed | Commit `f1baf06`; `conditional-reporting-evidence.md` |

## 5. Web Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P06-EV-WEB-001 | Student UI/component/E2E | Local Pass | Full Web `109/109`; full browser E2E `29/29`; `student-reporting-evidence.md` |
| P06-EV-WEB-002 | Teacher UI/component/E2E | Local Pass/Committed | Commit `9096d78`; Teacher component `7/7`; Teacher E2E `2/2` |
| P06-EV-WEB-003 | Gradebook UI/E2E | Local Pass/Committed | Commit `fe36dda`; Gradebook component `6/6`; Gradebook E2E `3/3` |
| P06-EV-WEB-004 | Admin UI/E2E | Local Pass/Committed | Commit `c1f5fa9`; `admin-reporting-web-evidence.md`; Admin E2E `2/2` |
| P06-EV-WEB-005 | Responsive review | Local Pass | Student/Teacher/Gradebook/Admin desktop và `390x844`; no document overflow |
| P06-EV-WEB-006 | Accessibility report | Local Pass | Axe WCAG 2A/2AA/2.1A/2.1AA; serious/critical `0` |
| P06-EV-WEB-007 | Conditional UI | Local Pass/Committed | Commit `f1baf06`; allowedActions/flag disabled and enabled component cases Pass |

## 6. NFR/DevOps Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P06-EV-NFR-001 | 100x50 benchmark | Pass | 5 iterations; p50 `355.11 ms`; p95 `1069.79 ms`; heap `27.37 MB`; local 2026-08-03 |
| P06-EV-NFR-002 | Explain/index review | Pass | Named index `report_summary_course_default_ranking` asserted in Mongo test |
| P06-EV-NFR-003 | Rebuild batch resource use | Pass | Batch size `1` integration case; CLI default batch `50`; benchmark dataset `100x50` |
| P06-EV-NFR-004 | Gradebook endpoint benchmark | Local Pass | `100x50`, 10 measured requests, p95 `78.87 ms`; target `<=1500 ms` |
| P06-EV-NFR-005 | Admin Audit indexed filter | Local Pass | `200` AuditLog rows, 10 requests, p95 `28.07 ms`; named actor-role index; target `<=1200 ms` |
| P06-EV-CI-001 | Docker integrated smoke | Local Pass | Mongo replica set + API + Web healthy; deterministic seed; fresh browser `34/34` |
| P06-EV-CI-002 | Clean clone | Local Pass | `C:\tmp\phase06-clean-20260803-1115`; `npm ci` + `npm run check:ci`; `quality-hardening-evidence.md` |
| P06-EV-CI-003 | Implementation PR CI | Pass | [PR run `30786303279`](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/30786303279); required checks `6/6` Pass |
| P06-EV-CI-004 | Post-merge main CI | Pass | [Main run `30786783937`](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/30786783937); commit `d2abe52`; `6/6` jobs Pass |
| P06-EV-CI-005 | Dependency/secret scan | Pass | Production audit and Secret Scan Pass on PR and post-merge main CI |

## 7. Exit Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P06-EV-EXIT-001 | 68 Must AC result | Pass `68/68` | `acceptance-criteria.md`; AC-066/068 backed by PR/main CI and P07 acceptance |
| P06-EV-EXIT-002 | Conditional disposition | Local Pass | 4 enabled capabilities Pass, 2 `APPROVED_NA`; `conditional-reporting-evidence.md` |
| P06-EV-EXIT-003 | Regression result | Local Pass | API `230`, Web `126`, integration `97`, browser E2E `34` |
| P06-EV-EXIT-004 | Defect/waiver review | Local Pass | Critical `0`, High `0`; `quality-hardening-evidence.md`, `risk-and-issues.md` |
| P06-EV-EXIT-005 | Exit report/signoff | Pass | `exit-report.md`, `phase-exit-evidence.md`; release identity and signoff recorded |
| P06-EV-EXIT-006 | P07 handoff acceptance | Accepted | `phase-07-handoff.md`; Project Owner/P07 consumer accepted on `2026-08-03` |

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
