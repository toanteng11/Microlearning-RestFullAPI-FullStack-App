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
| P06-EV-DATA-001 | Schema/index tests | Not Run | - |
| P06-EV-DATA-002 | Migration idempotency | Not Run | - |
| P06-EV-DATA-003 | Backfill output/count | Not Run | - |
| P06-EV-DATA-004 | Refresh/concurrency/fault isolation | Not Run | - |
| P06-EV-DATA-005 | Reconcile/repair | Not Run | - |
| P06-EV-DATA-006 | No-PII read model review | Not Run | - |

## 4. API/Security Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P06-EV-API-001 | Student APIs/OpenAPI | Not Run | - |
| P06-EV-API-002 | Teacher APIs/OpenAPI | Not Run | - |
| P06-EV-API-003 | Gradebook APIs/OpenAPI | Not Run | - |
| P06-EV-API-004 | Admin/Audit APIs/OpenAPI | Not Run | - |
| P06-EV-SEC-001 | RBAC/IDOR | Not Run | - |
| P06-EV-SEC-002 | Projection/privacy/threshold | Not Run | - |
| P06-EV-SEC-003 | Query/rate/bound injection | Not Run | - |
| P06-EV-SEC-004 | CSV/event Conditional | Not Run/N/A | - |

## 5. Web Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P06-EV-WEB-001 | Student UI/component/E2E | Not Run | - |
| P06-EV-WEB-002 | Teacher UI/component/E2E | Not Run | - |
| P06-EV-WEB-003 | Gradebook UI/E2E | Not Run | - |
| P06-EV-WEB-004 | Admin UI/E2E | Not Run | - |
| P06-EV-WEB-005 | Responsive screenshots | Not Run | - |
| P06-EV-WEB-006 | Accessibility report | Not Run | - |

## 6. NFR/DevOps Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P06-EV-NFR-001 | 100x50 benchmark | Not Run | - |
| P06-EV-NFR-002 | Explain/index review | Not Run | - |
| P06-EV-NFR-003 | Rebuild batch resource use | Not Run | - |
| P06-EV-CI-001 | Docker integrated smoke | Baseline Pass | `gate-a-review-evidence.md`; rerun tại Gate E |
| P06-EV-CI-002 | Clean clone | Not Run | - |
| P06-EV-CI-003 | Implementation PR CI | Not Run | - |
| P06-EV-CI-004 | Post-merge main CI | Not Run | - |
| P06-EV-CI-005 | Dependency/secret scan | Baseline Partial | Production audit Pass; remote Secret Scan chờ PR CI |

## 7. Exit Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P06-EV-EXIT-001 | 68 Must AC result | Not Run | - |
| P06-EV-EXIT-002 | Conditional disposition | Gate A Pass | `gate-a-decision-sheet.md`; runtime result cập nhật Gate E |
| P06-EV-EXIT-003 | Regression result | Not Run | - |
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
