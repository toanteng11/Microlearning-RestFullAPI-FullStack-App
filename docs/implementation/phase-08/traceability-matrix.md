# Phase 08 — Traceability Matrix

Traceability proves coverage; it does not prove Pass. Results belong in execution/evidence records with timestamp and exact identity.

## Source-to-P08 mapping

| Source baseline | P08 verification | Acceptance/evidence |
|---|---|---|
| Auth/RBAC/session/invitation | UAT-001..004, 023..026, negative tests | P08-AC-003/004/005 |
| Classroom/join/content | UAT-005..008 | P08-AC-003/004 |
| Learning/assessment/deadline/grade | UAT-009..017 | P08-AC-003/004/005 |
| Reporting/admin/audit/privacy | UAT-018..022 | P08-AC-004/005 |
| API/OpenAPI/data | UAT-023..024 + CI/integration | P08-AC-003/005 |
| Cloud/runtime/supply chain | UAT-028..031 + workflows/scripts | P08-AC-002/006/009/010 |
| Backup/restore/rollback/DR | UAT-032 + recovery records | P08-AC-007/008/011 |
| Governance/UAT/release | G0–G8, matrix, decisions | P08-AC-001/005/012–014 |

## P07 66/66 regression index

| P07 range | Domain | P08 treatment | Evidence |
|---|---|---|---|
| P07-AC-001..008 | planning/Gate A | handoff/scope/dependency review | EV-001..004 |
| P07-AC-009..016 | runtime/container | exact candidate health/routing/image | EV-005/010/015 |
| P07-AC-017..026 | Terraform/IAM/secrets/artifact | Production readiness and lineage | EV-004..007/016 |
| P07-AC-027..034 | Atlas/data | Production data/network/backup controls | EV-006/015/039 |
| P07-AC-035..044 | CI/CD/Staging | stable record and promotion guard | EV-005/020/030 |
| P07-AC-045..052 | cloud actors | System Test/UAT role and negative paths | EV-010/015/020 |
| P07-AC-053..060 | operations/recovery/cost | observe/restore/rollback/capacity | EV-006/008/038/039 |
| P07-AC-061..066 | hardening/exit | scans, handoff, closure | EV-016/026/050/055 |

P07 report's `66/66` remains a `BASELINE_REPORTED` value; P08 must revalidate release-affecting behavior and record deviations.

## Exact BA acceptance coverage baseline

| BA acceptance IDs | P08 catalog/system coverage | P08 gate criteria |
| --- | --- | --- |
| `AC-AUTH-001..006` | UT-001/002/023/025/026/030 + auth API regression | AC-003/004/005 |
| `AC-INV-001..003`, `AC-JOIN-001..003` | UT-003/004/006/007/023/030 | AC-003/004/005 |
| `AC-CNT-001..002`, `AC-LRN-001..002`, `AC-DLN-001..003` | UT-008..010/015..017 | AC-003/004/005 |
| `AC-ASM-001..006` | UT-011..016 + cross-scope API/data checks | AC-003/004/005 |
| `AC-DASH-001..002`, `AC-ADM-001..002`, `AC-RPT-001..002` | UT-010/018..022/029/030 | AC-003/004/005/009 |
| `AC-API-001..003`, `API-AC-001..009`, `DATA-AC-001..010` | UT-023/024/028 + OpenAPI/integration/idempotency checks | AC-003/005 |
| `SEC-AC-001..015` | UT-003/004/014/022..027/030 + security/redaction scan | AC-003/005/006/009 |
| `UI-AC-001..007`, `UI-STU-001..006`, `UI-TEA-001..003/005/006`, `UI-ADM-001..003` | role browser journeys, states, responsive/a11y checks | AC-003/004/005 |
| `DOP-AC-001..007/009/010/012..014/017/018` | CI, lineage, cloud, promotion, smoke, backup/restore/rollback | AC-002/006..011 |
| Conditional BA IDs such as `DOP-AC-008`, `SEC-AC-009/012`, `UI-TEA-004`, `UI-ADM-004` | test when enabled; otherwise scoped `APPROVED_NA` decision | linked affected criterion |

The execution artifact must expand these ranges into one row per applicable BA Must ID. A range mapping proves planned coverage only; it never proves Pass.

## Evidence status

All mappings begin `PENDING`. `APPROVED_NA` needs a linked decision and cannot be counted as a Must Pass.
