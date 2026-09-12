# Phase 08 — Evidence Register

Evidence raw artifacts phải có release ID, exact identity, UTC timestamp, actor/tool, retention location và redaction review. `LOCAL_PASS_REMOTE_PENDING` nghĩa là raw evidence đã Pass tại máy thực thi nhưng GitHub artifact bền vững chưa được workflow upload; trạng thái này chưa đủ để đóng gate remote.

| ID | Evidence | Owner | Required content | Status |
|---|---|---|---|---|
| P08-EV-001 | P07 handoff acceptance | TL | valid record, signatures/decision, UTC | `PASS` |
| P08-EV-002 | Release identity lock | TL/DevOps | commit/digest/revision/URL/manifest | `PASS` |
| P08-EV-003 | Test/UAT readiness | QA/BA | HTTPS/version, synthetic personas/data/catalog/evidence workspace | `PASS` |
| P08-EV-004 | Production readiness | DevOps | Terraform/IAM/secret/Atlas/network | `PENDING` |
| P08-EV-005 | CI and lineage | DevOps | workflow runs, manifest, SBOM/scan | `PASS` |
| P08-EV-006 | Atlas backup/restore/RPO/RTO decision | DevOps | profile decision, backup proof + isolated restore; PITR actual or approved N/A | `PENDING` |
| P08-EV-007 | Production separation | DevOps/Security | state/SA/secret/DB identity | `PENDING` |
| P08-EV-008 | Observability readiness | DevOps | dashboard/uptime/alert route | `PENDING` |
| P08-EV-010 | System Test summary | QA | catalog counts and raw reports | `PASS` |
| P08-EV-015 | API/data/security regression | QA/Security | negative checks, redaction, integrity | `PASS` |
| P08-EV-016 | Artifact/IaC/dependency scans | Security | findings, checksum, expiry | `PASS` |
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

- [x] Part 00-03 entries point to raw release-scoped artifacts; GitHub URL is added after the Part 03 workflow run.
- [x] Part 03 counts match Playwright JSON, JUnit and generated System Test summary (`6/6 PASS`).
- [x] Part 00-03 redaction scan reports no secret, token, password, full URI or real PII.
- [ ] Identity is identical across handoff, tests, promotion and exit.
- [x] Part 00-03 artifact path is release-scoped: `artifacts/phase-08/<release-id>/...`.
- [ ] PRE_RELEASE evidence stops at G5; FINAL evidence includes G6-G8 actual results.

## Actual evidence snapshot - Part 00-03

- Release ID: `P08-RC-20260912-299c45a`.
- Release root: `artifacts/phase-08/P08-RC-20260912-299c45a/` inside the uploaded GitHub artifact.
- G0/G1 and lineage evidence: `identity/release-identity.json`, `identity/provider-observation.json`, `identity/workflow-lineage.json` and `identity/staging-identity-reconciliation.json`; P07 handoff acceptance remains `P08-EV-001`.
- System Test: `system-test/playwright-results.json`, `system-test/junit.xml`, `system-test/html-report/` and `system-test/system-test-summary.json`.
- Security/IaC/dependency: `security-performance/scan-summary.json`, `security-performance/terraform-trivy.json` and `security-performance/final-redaction-report.json`.
- Source workflow URLs use CI `34671825515`, Build `34671963167`, Deploy `34672098531` and Cloud E2E `34672249300`; each is `success` for exact commit `299c45ac2ddcdb4bb4f2d7f1c733baf5fb9c008a`.
- `P08-EV-010/015/016` are retained by System Test run `34672788211` in artifact `phase-08-system-test-P08-RC-20260912-299c45a` (ID `10290549499`, digest `sha256:9a2ec4d046ae953ca4473f4de4a764a774acc7530a608f039a13437350608528`).
- Artifact expiry is `2026-12-11T04:21:29Z`; final redaction report is `PASS` with zero findings.

## Part 04-05 implementation snapshot

- Status: `LOCAL_PASS_REMOTE_PENDING`; this records implemented controls, not release Pass evidence.
- Runner: `tests/e2e/phase-08-quality.spec.ts` through the existing exact-candidate `phase-08-system-test.yml` workflow.
- Raw outputs: `security-performance/quality-observations.json`, Playwright JSON/JUnit/HTML, retry traces and failure media.
- Derived outputs: `security-performance/quality-summary.json` and `quality-summary-validation.json`; p95 is recalculated from raw samples by contract code.
- Required remote closure: workflow URL/run ID, artifact ID/digest/expiry and exact post-merge release identity. Until recorded, Part 04-05 remain `LOCAL_PASS_REMOTE_PENDING`.
