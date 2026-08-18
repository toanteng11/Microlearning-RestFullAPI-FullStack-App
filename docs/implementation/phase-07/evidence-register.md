# Phase 07 Evidence Register

## 1. Rules

- Không ghi secret, password, full Mongo URI hoặc service-account key.
- Evidence phải có URL/path, timestamp, commit/digest/revision và owner phù hợp.
- `Pending` chỉ hợp lệ trước execution; exit không được còn Must evidence Pending.

## 2. Planning Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P07-EV-001 | planning PR and CI | Pass | [PR #21](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/21) merged as `f5c58c3`; six required checks Pass; [post-merge main CI](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/31818169576) Pass |
| P07-EV-002 | Gate A signed decision | Pass | `gate-a-decision-sheet.md`, `gate-a-readiness-evidence.md` |
| P07-EV-003 | tool/version checks | Pass | `gate-a-readiness-evidence.md` |
| P07-EV-004 | GCP project/billing/budget access | Pass | `gate-a-readiness-evidence.md`; provider UI evidence owner-controlled |
| P07-EV-005 | Atlas rotation/revoke/network waiver | Pass With Expiry | `gate-a-readiness-evidence.md`; expires `2026-09-13` |
| P07-EV-006 | GitHub environments/protection | Pass | `gate-a-readiness-evidence.md`; live settings verified `2026-08-14` |

## 3. Build And Infrastructure Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P07-EV-007 | local Production image smoke | Local Pass / Remote Pending | `runtime-container-evidence.md`; generated `artifacts/phase-07/smoke/production-image-smoke.json` is gitignored |
| P07-EV-008 | image non-root/content check | Local Pass / Remote Pending | `runtime-container-evidence.md`; CI artifact required for final Pass |
| P07-EV-009 | image scan/SBOM | Local Pass / Remote Pending | `runtime-container-evidence.md`; generated Trivy/CycloneDX artifacts are gitignored; P07-PR01 artifact Pending |
| P07-EV-010 | Terraform fmt/validate/security | Local Pass / Remote Pending | `terraform-identity-supply-chain-evidence.md`; fmt/init/validate/policy/Trivy Pass |
| P07-EV-011 | Terraform Staging plan/apply | Source Ready / Cloud Pending | plan workflow/policy implemented; Cloud plan/apply not run |
| P07-EV-012 | remote state protection/no-secret | Local Contract Pass / Cloud Pending | bootstrap config, canary policy tests and recovery runbook |
| P07-EV-013 | WIF positive/negative tests | Workflow Ready / Cloud Pending | exact-condition workflows implemented; run URLs Pending |
| P07-EV-014 | IAM/no-service-account-key review | Local Contract Pass / Cloud Pending | IAM module and sanitized diagnostic verifier |
| P07-EV-015 | Secret Manager version/IAM/rotation | Local Contract Pass / Cloud Pending | `phase-07-part-06-08-evidence.md`, `secret-version-operations-runbook.md`; actual version record Pending |
| P07-EV-016 | Artifact Registry digest/manifest | Cloud Baseline Observed / Import-Publish Pending | existing private immutable repository audited; declarative import and manifest tests ready |

## 4. Staging And Test Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P07-EV-017 | Atlas TLS/index/transaction/pool | Diagnostic Ready / Cloud Pending | `phase-07-part-06-08-evidence.md`, `atlas-staging-verification-runbook.md`; connected report Pending |
| P07-EV-018 | first Staging deployment | Workflow Ready / Cloud Pending | `first-deploy-staging.yml`, `phase-07-part-06-08-evidence.md`; run URL/deployment record Pending |
| P07-EV-019 | main-to-Staging CD chain | Source Ready / Cloud Pending | `build-publish.yml`, `deploy-staging.yml`, `phase-07-part-09-11-evidence.md`; workflow URLs Pending |
| P07-EV-020 | health/ready/version/digest match | Local Contract Pass / Cloud Pending | `verify-cloud-security.mjs`, deployment record contract; actual smoke report Pending |
| P07-EV-021 | routing/Swagger/cookie/security headers | Local Contract Pass / Cloud Pending | Cloud security verifier và Playwright cookie checks; actual cloud report Pending |
| P07-EV-022 | Student cloud E2E | Test Ready / Cloud Pending | `phase-07-cloud-roles.spec.ts`; Playwright/JUnit run Pending |
| P07-EV-023 | Teacher cloud E2E | Test Ready / Cloud Pending | `phase-07-cloud-roles.spec.ts`; Playwright/JUnit run Pending |
| P07-EV-024 | Admin/Super Admin cloud E2E | Test Ready / Cloud Pending | `phase-07-cloud-roles.spec.ts`; Playwright/JUnit run Pending |
| P07-EV-025 | negative RBAC/ownership/concurrency | Test Ready / Cloud Pending | API/browser assertions và artifact redaction gate; run Pending |

## 5. Operations Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P07-EV-026 | dashboard/uptime/log query | Local Source Pass / Cloud Pending | `modules/monitoring`, `phase-07-part-12-14-evidence.md`; Cloud Monitoring URLs Pending |
| P07-EV-027 | alert notification test | Source Ready / Cloud Pending | monitoring alert policies; redacted notification record Pending |
| P07-EV-028 | log/alert secret redaction | Local Contract Pass / Cloud Pending | `logger.ts`, `observability:contract:test`; canary result Pending |
| P07-EV-029 | backup/checksum | Local Tool Pass / Atlas Pending | `atlas-recovery.ts`, `backup-restore-disaster-recovery.md`; manifest Pending |
| P07-EV-030 | isolated restore/invariants | Local Tool Pass / Atlas Pending | `atlas-recovery.ts`; rehearsal report Pending |
| P07-EV-031 | rollback/prior digest smoke | Local Contract Pass / Cloud Pending | `rollback-staging.yml`, `rollback-and-incident-response.md`; record Pending |
| P07-EV-032 | budget/quota/cost | Pending | report |
| P07-EV-033 | security/IAM/public resource review | Pending | review report |

## 6. Exit Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P07-EV-034 | clean-clone release verification | Pending | report/commit |
| P07-EV-035 | acceptance `66/66` | Pending | `acceptance-criteria.md` |
| P07-EV-036 | release PR required checks | Pending | PR URL |
| P07-EV-037 | post-merge main CI | Pending | Actions URL |
| P07-EV-038 | latest Staging CD/smoke | Pending | Actions URL |
| P07-EV-039 | Production workflow guard validation | Pending | test/run |
| P07-EV-040 | Phase 08 handoff acceptance | Pending | `phase-08-handoff.md` |
| P07-EV-041 | Production promotion contract | Local Pass / Remote Pending | `promotion-contract.mjs`, `promote-production.yml` |
| P07-EV-042 | Clean-clone hardening | Local Pass / Remote Pending | `phase-07-hardening.yml`, hardening contract và artifact |
| P07-EV-043 | Exit contract | Local Pass / Remote Pending | `exit-contract.mjs`, `exit-report.md` |
| P07-EV-044 | Phase 08 handoff contract | Local Pass / Acceptance Pending | `handoff-contract.mjs`, `phase-08-handoff.md` |
