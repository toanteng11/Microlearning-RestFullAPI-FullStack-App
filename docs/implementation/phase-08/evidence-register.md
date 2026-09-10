# Phase 08 — Evidence Register

Evidence raw artifacts phải có release ID, exact identity, UTC timestamp, actor/tool, retention location và redaction review. Tất cả rows dưới đây khởi tạo `PENDING`; không phải actual result.

| ID | Evidence | Owner | Required content | Status |
|---|---|---|---|---|
| P08-EV-001 | P07 handoff acceptance | TL | valid record, signatures/decision, UTC | `PENDING` |
| P08-EV-002 | Release identity lock | TL/DevOps | commit/digest/revision/URL/manifest | `PENDING` |
| P08-EV-003 | Test/UAT readiness | QA/BA | HTTPS/version, synthetic personas/data/catalog/evidence workspace | `PENDING` |
| P08-EV-004 | Production readiness | DevOps | Terraform/IAM/secret/Atlas/network | `PENDING` |
| P08-EV-005 | CI and lineage | DevOps | workflow runs, manifest, SBOM/scan | `PENDING` |
| P08-EV-006 | Atlas backup/restore/RPO/RTO decision | DevOps | profile decision, backup proof + isolated restore; PITR actual or approved N/A | `PENDING` |
| P08-EV-007 | Production separation | DevOps/Security | state/SA/secret/DB identity | `PENDING` |
| P08-EV-008 | Observability readiness | DevOps | dashboard/uptime/alert route | `PENDING` |
| P08-EV-010 | System Test summary | QA | catalog counts and raw reports | `PENDING` |
| P08-EV-015 | API/data/security regression | QA/Security | negative checks, redaction, integrity | `PENDING` |
| P08-EV-016 | Artifact/IaC/dependency scans | Security | findings, checksum, expiry | `PENDING` |
| P08-EV-020 | UAT execution matrix | BA/QA | all rows, actors, actual/evidence | `PENDING` |
| P08-EV-025 | UAT sign-off | PO | decision ID, scope, date UTC | `PENDING` |
| P08-EV-026 | Defect/waiver closure | QA/TL | severity, retest, CR/waiver | `PENDING` |
| P08-EV-030 | G5 Go/No-Go | PO | decision, conditions, recommendations | `PENDING` |
| P08-EV-031 | Production plan/apply | DevOps | plan hash, workflow/change, apply result | `PENDING` |
| P08-EV-037 | Production smoke/traffic | QA/DevOps | revision, traffic, health/version | `PENDING` |
| P08-EV-038 | Observation/hypercare | DevOps | T+0,15m,1h,24h,72h records | `PENDING` |
| P08-EV-039 | Recovery | DevOps | backup/restore/rollback metrics/invariants | `PENDING` |
| P08-EV-040 | Operations handover | DevOps/Support | runbook/dashboard/on-call | `PENDING` |
| P08-EV-044 | Training/communications | BA/PO | audience, material, acknowledgement | `PENDING` |
| P08-EV-050 | Final acceptance | PO/TL | criteria decision and residuals | `PENDING` |
| P08-EV-055 | Exit report | TL/BA | closure, lessons, follow-up | `PENDING` |

## Integrity checks

- [ ] Link points to raw artifact, not a prose assertion.
- [ ] Counts match execution matrix and acceptance criteria.
- [ ] No secret, token, password, full URI or real PII.
- [ ] Identity is identical across handoff, tests, promotion and exit.
- [ ] Artifact path is release-scoped: `artifacts/phase-08/<release-id>/...`.
- [ ] PRE_RELEASE evidence stops at G5; FINAL evidence includes G6-G8 actual results.
