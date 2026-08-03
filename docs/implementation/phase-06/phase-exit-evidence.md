# Phase 06 Phase Exit Evidence

## 1. Release Identity

| Field | Value |
| --- | --- |
| Planning merge | PR `#16`; commit `e7437bc`; CI `6/6` Pass |
| Local code baseline | `f1baf06` |
| Release branch | `quality/phase-06-release-hardening` |
| Implementation/release PR | Pending |
| Release merge commit | Pending |
| Post-merge main CI | Pending |
| Local evidence date | `2026-08-03` |
| Decision | `LOCAL_PASS_REMOTE_PENDING` |

## 2. Scope Result

```text
Must local Pass: 66/68
Must remote pending: 2
Conditional enabled capabilities: 4
Conditional enabled Pass: 4
Conditional approved N/A capabilities: 2
Conditional AC result: 5 Pass, 1 Approved N/A
Critical defects: 0
High defects: 0
```

## 3. Contract Evidence

- P05 Gradebook operation/flag retired atomically; one P06 runtime/OpenAPI operation remains.
- Metric, Gradebook, Admin governance, analytics và snapshot contracts are versioned.
- Student/Teacher/Gradebook/Admin/Conditional runtime and OpenAPI parity Pass (`10/10`).
- Migration, rebuild, reconcile, invalidation race and read-model-only repair Pass.
- Conditional flags default false; backend `allowedActions` is authoritative for UI actions.

## 4. Actor Evidence

| Actor | API | Web | E2E | Privacy | Local result |
| --- | --- | --- | --- | --- | --- |
| Student | Pass | Pass | Pass | Pass | Pass |
| Teacher | Pass | Pass | Pass | Pass | Pass |
| Admin/Super Admin | Pass | Pass | Pass | Pass | Pass |

## 5. Quality Evidence

- Unit/component coverage: API `230/230`; Web `126/126`.
- Mongo replica-set integration coverage: `97/97`.
- OpenAPI parser/parity: `10/10`.
- Browser E2E: fresh integrated Docker stack `34/34`.
- Performance: Gradebook `100x50` p95 `78.87 ms`; calculator p95 `1069.79 ms`.
- Docker: Mongo replica set, API và Web healthy; Swagger smoke Pass.
- Seed: deterministic create and idempotent rerun Pass.
- Visual/accessibility: desktop/mobile no overflow; Axe serious/critical `0`.
- Clean clone: `npm ci` + `npm run check:ci` Pass.
- Dependency audit: Pass with managed time-bound exceptions.

Detailed path: `quality-hardening-evidence.md`.

## 6. External Evidence

| Evidence | Status |
| --- | --- |
| Planning PR/main CI | Pass; recorded in planning evidence |
| Release PR URL | Pending |
| Release required checks | Pending |
| Remote Secret Scan | Pending |
| Release merge commit | Pending |
| Post-merge main Actions URL | Pending |
| P07 acceptance | Pending |

Không tạo URL hoặc commit giả. Các field này chỉ được cập nhật sau hành động thật trên GitHub.

## 7. Risks, Debt And Waivers

- Critical/High open defects: `0/0` locally.
- No security/correctness waiver is used to obtain local Pass.
- Weighted V2 and XLSX/async export are approved scope deferrals, not defects.
- React Router audit exceptions are time-bound and remain subject to dependency policy.

## 8. Signoff

| Role | Decision | Date | Note |
| --- | --- | --- | --- |
| Product Owner | Pending | - | Remote release review required |
| Technical Lead | Local Ready | `2026-08-03` | Quality/evidence package complete |
| QA | Local Pass | `2026-08-03` | Automated and visual gates Pass |
| Security | Local Pass | `2026-08-03` | RBAC/IDOR/privacy/bounds Pass |
| DevOps/P07 consumer | Ready For Review | - | Acceptance pending |

## 9. Final Rule

Đổi Decision thành `PASS` chỉ khi P06-AC-066 và P06-AC-068 Pass: release PR/main CI xanh, remote
Secret Scan Pass, release commit/URLs được ghi và P07 handoff được chấp nhận.
