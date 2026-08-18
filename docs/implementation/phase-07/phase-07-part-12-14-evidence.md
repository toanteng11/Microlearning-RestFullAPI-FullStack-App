# Phase 07 Parts 12-14 Evidence

## Status

`LOCAL_PASS_REMOTE_PENDING` as of `2026-08-17`.

This file records source and local contract evidence only. It intentionally does not claim that Cloud
Monitoring, Atlas backup/restore or Cloud Run rollback has been executed.

## Part 12 - Observability

| Check | Result | Evidence |
| --- | --- | --- |
| Terraform module parses and validates | Pass | `npm run terraform:validate` |
| Dashboard/log metrics/uptime/alerts are declared | Pass | `infrastructure/terraform/modules/monitoring/main.tf` |
| Required provisioning inputs and optional email channel | Pass | `variables.tf`, staging module call |
| Secret/PII redaction contract | Pass | `apps/api/src/shared/logging/logger.ts`, `npm run observability:contract:test` |
| Cloud Monitoring apply and notification reception | Pending | Must run with `terraform apply` and a redacted test signal |

## Part 13 - Backup and restore

| Check | Result | Evidence |
| --- | --- | --- |
| Staging/synthetic-only/SRV guard | Pass | `apps/api/src/scripts/atlas-recovery.ts` |
| EJSON JSONL export and deterministic collection order | Pass | `atlas:backup` source contract |
| SHA-256 manifest and index metadata | Pass | `BackupManifest`, per-collection checksum |
| Isolated restore prefix and checksum-before-insert | Pass | `atlas:restore` source contract |
| Real Atlas backup and isolated restore report | Pending | Requires secure temporary user and real staging run |

## Part 14 - Rollback and incident rehearsal

| Check | Result | Evidence |
| --- | --- | --- |
| Mutable tag/Production/same-revision rejection | Pass | `npm run operations:contract:test` |
| Health/readiness/exact-digest recovery verifier | Pass | `scripts/verify-rollback-recovery.mjs` |
| Manual WIF rollback workflow | Pass | `.github/workflows/rollback-staging.yml` |
| Incident record schema and measured timings | Pass | `scripts/create-rollback-record.mjs` and validator |
| Prior revision Cloud Run rollback and smoke | Pending | Requires two real Staging revisions and workflow run |
| Terraform drift reconciliation after traffic rollback | Pending | Must be executed through normal Terraform pipeline |

## Local verification commands

```text
npm run typecheck --workspace @microlearning/api
npm run operations:contract:test
npm run observability:contract:test
npm run terraform:validate
```

No connection string, password, token, private key or real learner data belongs in this evidence file.
