# Phase 08 — Production Readiness and Promotion

## Promotion contract

Production may receive only `image_ref=<Artifact Registry repository>@sha256:<digest>` that was built from protected `main`, lineage/SBOM/scan validated, deployed and marked stable in Staging, tested by P08, and approved by G5. No rebuild, mutable tag, laptop deploy, Staging secret/database, or unreviewed Console change.

The selected planning profile is `ACADEMIC_DEMO_RELEASE`; see `release-profile-and-solo-governance.md`. Production readiness is evaluated at G4/G5 and must not block G2/G3 execution on Staging.

## Readiness matrix

| Domain | Required proof | Status |
|---|---|---|
| Identity | commit/digest/revision/manifest match | `PENDING - generate for selected RC` |
| CI/security | `npm run check:ci`, audit, scan/SBOM/redaction | `PENDING - exact RC evidence required` |
| Terraform | fmt/validate/plan/policy, expected-only diff | `PENDING - current apply disabled` |
| Production Atlas | TLS, least-privilege user, separate DB, network, backup/restore per profile | `PENDING` |
| IAM/secrets/state | Production WIF/SA/secret/state separation | `PENDING` |
| UAT | Must pass, sign-off, defect closure | `PENDING` |
| Recovery | prior digest, backup/isolated restore and data-compatible rollback | `PENDING` |
| Operations | dashboard/uptime/alert owner/runbook/budget | `PENDING` |
| Governance | protected environment, PRE_RELEASE acceptance, G5 decision | `PENDING` |

## Current workflow boundary

`.github/workflows/promote-production.yml` is currently a protected **plan-only validation** workflow. It does not prove a real Production apply. Part 02 fixes the validator boundary; Part 08 prepares the plan; Part 09 records G5; Part 10 adds/uses protected `APPLY` with workflow review, plan artifact, WIF permissions, post-deploy evidence and `npm run promotion:contract:test`.

## Promotion sequence

1. Freeze release identity and verify stable Staging record.
2. Review Production Terraform plan and policy; keep plan hash.
3. Confirm G5 decision and change window.
4. Use protected `main` workflow/WIF; deploy the exact digest.
5. Capture revision/traffic; run approved smoke; retain prior revision.
6. Start observation and rollback window; abort on mismatch, auth/data/error/monitoring/security signal.

## Mandatory no-go conditions

Backup/restore requirements for the selected profile not approved; identity mismatch; UAT not signed; Critical/High defect; Production secret/state/database user not separated; rollback/monitoring owner absent; or APPLY boundary not changed through approved PR. Managed PITR absence alone is not a blocker for the academic profile when explicitly `APPROVED_NA`.
