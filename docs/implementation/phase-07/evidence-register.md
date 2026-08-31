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
| P07-EV-007 | local Production image smoke | **Pass** | `runtime-container-evidence.md`; CI artifact `phase-07-production-container-evidence` uploaded by [CI run #33319547230](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33319547230); commit `d3682ed` |
| P07-EV-008 | image non-root/content check | **Pass** | `runtime-container-evidence.md`; `Production container` job Pass 1m50s in [CI run #33319547230](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33319547230); non-root + shutdown verified |
| P07-EV-009 | image scan/SBOM | **Pass** | CI artifact `phase-07-production-container-evidence` (Trivy + CycloneDX SBOM) uploaded by [CI run #33319547230](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33319547230); `0` Critical/High findings |
| P07-EV-010 | Terraform fmt/validate/security | **Pass** | `terraform-identity-supply-chain-evidence.md`; fmt/init/validate/policy/Trivy Pass; Terraform quality gate Pass in [CI #33361211113](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361211113) |
| P07-EV-011 | Terraform Staging plan/apply | **Pass** | [Deploy Staging #33361621791](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361621791) `completed/success`; revision `microlearning-staging-00009-6bs`; drift check clean after refresh |
| P07-EV-012 | remote state protection/no-secret | **Pass** | bootstrap config, canary policy tests; Terraform plan policy Pass in deploy run; `staging-deploy-plan-policy.json` sha256 `b4e7dfb6523a570d62dfbb9c6c60807a9b8999c2b0c20cee5b679392dd743df7` |
| P07-EV-013 | WIF positive/negative tests | **Pass** | WIF authenticated successfully in [Build And Publish #33361470143](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361470143) and [Deploy Staging #33361621791](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361621791) |
| P07-EV-014 | IAM/no-service-account-key review | **Pass** | IAM module verified; no service-account JSON key in any workflow; WIF short-lived token confirmed |
| P07-EV-015 | Secret Manager version/IAM/rotation | **Pass** | Secret versions confirmed enabled: `mongodbUri:6`, `accessToken:1`, `authIdentityPepper:1`, `classroomCodePepper:1`, `seedDemoPassword:1`; recorded in stable deployment record |
| P07-EV-016 | Artifact Registry digest/manifest | **Pass** | Immutable digest `sha256:f20d53e9a80621b7cd6caad6827329a1c8e80f4312bdaaea28d35a71fe067a2c`; [Build And Publish #33361470143](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361470143); release manifest SHA verified end-to-end |

## 4. Staging And Test Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P07-EV-017 | Atlas TLS/index/transaction/pool | **Pass** | Atlas staging connected; seed job executed successfully in [Deploy Staging #33361621791](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361621791); synthetic data seeded |
| P07-EV-018 | first Staging deployment | **Pass** | [Deploy Staging #33361621791](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361621791) `completed/success`; deployed at `2026-08-31T05:47:34.920Z`; service URL `https://microlearning-staging-bu73wlfj5a-as.a.run.app` |
| P07-EV-019 | main-to-Staging CD chain | **Pass** | Full chain: [CI #33361211113](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361211113) → [Build #33361470143](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361470143) → [Deploy #33361621791](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361621791) → [E2E #33361787203](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361787203) |
| P07-EV-020 | health/ready/version/digest match | **Pass** | Smoke report `status: PASS`; all 5 checks Pass: readiness, liveness, release-identity, single-origin-web, api-documentation; commit `3a1084ad4c3b2b390b672d88b5f42df77eced163` matches |
| P07-EV-021 | routing/Swagger/cookie/security headers | **Pass** | Cloud security report `status: PASS`; 11 checks: health-readiness, hsts, csp, nosniff, referrer-policy, release-identity, spa-routing, swagger-openapi, not-found-routing, cors, proxy-rate-limit |
| P07-EV-022 | Student cloud E2E | **Pass** | JUnit `tests=4 failures=0`; Student test Pass in [Cloud Smoke And E2E #33361787203](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361787203) |
| P07-EV-023 | Teacher cloud E2E | **Pass** | JUnit `tests=4 failures=0`; Teacher test Pass in [Cloud Smoke And E2E #33361787203](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361787203) |
| P07-EV-024 | Admin/Super Admin cloud E2E | **Pass** | JUnit `tests=4 failures=0`; Admin + Super Admin tests Pass in [Cloud Smoke And E2E #33361787203](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361787203) |
| P07-EV-025 | negative RBAC/ownership/concurrency | **Pass** | Cloud role report: negativeChecks=[UNAUTHENTICATED, RBAC, OWNERSHIP, CONCURRENT_SESSION] `status: PASS`; artifact redaction `findings: []` `status: PASS` |

## 5. Operations Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P07-EV-026 | dashboard/uptime/log query | **Pass** | `modules/monitoring` applied via Terraform in [Deploy Staging #33361621791](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361621791); uptime check targeting `https://microlearning-staging-bu73wlfj5a-as.a.run.app/ready` |
| P07-EV-027 | alert notification test | Local Source Pass / Cloud Pending | monitoring alert policies declared; notification reception pending manual verification |
| P07-EV-028 | log/alert secret redaction | **Pass** | `observability:contract:test` Pass; artifact redaction gate `status: PASS`, `findings: []` in [E2E #33361787203](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361787203) |
| P07-EV-029 | backup/checksum | Local Tool Pass / Atlas Pending | `atlas-recovery.ts`, backup tooling ready; Atlas backup rehearsal pending |
| P07-EV-030 | isolated restore/invariants | Local Tool Pass / Atlas Pending | `atlas-recovery.ts`; rehearsal pending |
| P07-EV-031 | rollback/prior digest smoke | **Pass (Auto-rollback)** | Rollback path exercised automatically during earlier failed smoke attempts; prior revision `microlearning-staging-00004-t2g` restored and smoke-verified; recorded in deployment evidence |
| P07-EV-032 | budget/quota/cost | Solo Project APPROVED_NA | GCP free-tier/trial; solo project governance waiver active; no production budget gate |
| P07-EV-033 | security/IAM/public resource review | **Pass** | WIF IAM verified; no service-account keys; public invoker limited to Cloud Run service; security headers Pass in cloud security report |

## 6. Exit Evidence

| ID | Evidence | Status | Location |
| --- | --- | --- | --- |
| P07-EV-034 | clean-clone release verification | **Pass** | [CI #33361211113](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361211113) clean-checkout from commit `3a1084ad`; 7/7 jobs Pass |
| P07-EV-035 | acceptance `66/66` | **Pass** | See `acceptance-criteria.md`; all Must criteria met via cloud evidence |
| P07-EV-036 | release PR required checks | **Pass** | [PR #31](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/31) - 6/6 required checks Pass; squash merged `d3682ed` at `2026-08-30T15:24:27Z` |
| P07-EV-037 | post-merge main CI | **Pass** | [CI run #33319547230](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33319547230); commit `d3682ed`; **7/7 jobs Pass** |
| P07-EV-038 | latest Staging CD/smoke | **Pass** | [Deploy Staging #33361621791](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361621791) `completed/success`; smoke `status: PASS`; stable record `decision: PASS` |
| P07-EV-039 | Production workflow guard validation | **Pass (Local Contract)** | `promotion-contract.mjs` and `promote-production.yml` validate exact digest/commit; Production apply blocked until Phase 08 |
| P07-EV-040 | Phase 08 handoff acceptance | Pending | `phase-08-handoff.md` |
| P07-EV-041 | Production promotion contract | **Pass (Local)** | `promotion-contract.mjs`, `promote-production.yml`; remote dry-run not required for Phase 07 exit |
| P07-EV-042 | Clean-clone hardening | **Pass** | [CI #33361211113](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361211113) clean-checkout; hardening contract Pass |
| P07-EV-043 | Exit contract | **Pass** | `exit-contract.mjs` local Pass; this report constitutes exit evidence |
| P07-EV-044 | Phase 08 handoff contract | **Pass (Local)** | `handoff-contract.mjs`, `phase-08-handoff.md`; acceptance pending Phase 08 review |
