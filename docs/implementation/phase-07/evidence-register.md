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
| P07-EV-007 | local Production image smoke | Pending | CI/local report |
| P07-EV-008 | image non-root/content check | Pending | report |
| P07-EV-009 | image scan/SBOM | Pending | workflow artifact |
| P07-EV-010 | Terraform fmt/validate/security | Pending | workflow run |
| P07-EV-011 | Terraform Staging plan/apply | Pending | redacted artifact |
| P07-EV-012 | remote state protection/no-secret | Pending | configuration/test |
| P07-EV-013 | WIF positive/negative tests | Pending | workflow runs |
| P07-EV-014 | IAM/no-service-account-key review | Pending | redacted policy output |
| P07-EV-015 | Secret Manager version/IAM/rotation | Pending | resource/version record |
| P07-EV-016 | Artifact Registry digest/manifest | Pending | release manifest |

## 4. Staging And Test Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P07-EV-017 | Atlas TLS/index/transaction/pool | Pending | integration report |
| P07-EV-018 | first Staging deployment | Pending | workflow/deployment record |
| P07-EV-019 | main-to-Staging CD chain | Pending | workflow URLs |
| P07-EV-020 | health/ready/version/digest match | Pending | smoke report |
| P07-EV-021 | routing/Swagger/cookie/security headers | Pending | cloud report |
| P07-EV-022 | Student cloud E2E | Pending | Playwright/JUnit |
| P07-EV-023 | Teacher cloud E2E | Pending | Playwright/JUnit |
| P07-EV-024 | Admin/Super Admin cloud E2E | Pending | Playwright/JUnit |
| P07-EV-025 | negative RBAC/ownership/concurrency | Pending | API/E2E report |

## 5. Operations Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P07-EV-026 | dashboard/uptime/log query | Pending | Cloud Monitoring URLs |
| P07-EV-027 | alert notification test | Pending | redacted record |
| P07-EV-028 | log/alert secret redaction | Pending | canary result |
| P07-EV-029 | backup/checksum | Pending | manifest |
| P07-EV-030 | isolated restore/invariants | Pending | rehearsal report |
| P07-EV-031 | rollback/prior digest smoke | Pending | rollback record |
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
