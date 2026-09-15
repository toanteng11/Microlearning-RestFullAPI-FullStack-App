# Part 08 - Production Readiness and Recovery

**Implementation status:** `LOCAL_PASS_REMOTE_PENDING`

## Outcome

Production target is isolated, reviewable and recoverable before any apply.

## Entry

- G2/G3 evidence available or progressing without Critical/High blocker.
- Selected release profile is unchanged.

## Tasks

1. Complete Production Terraform parity listed in `../source-and-workflow-blueprint.md`.
2. Confirm remote state, service account, WIF, Secret Manager resources and Cloud Run service are Production-specific.
3. Create least-privilege MongoDB user and separate database; store URI only in Secret Manager.
4. Generate Terraform plan and inspect create/update/destroy, IAM public access and cross-environment references.
5. Capture prior digest/revision and verify N/N-1 schema/data compatibility.
6. Create pre-release logical backup and perform isolated restore rehearsal; record RPO/RTO result.
7. Verify budget alerts, quotas, monitoring dashboard, uptime/alert route and incident owner.

## Profile-specific rule

Academic demo may use the same Atlas cluster only under the controls in `../release-profile-and-solo-governance.md`. Managed PITR can be `APPROVED_NA` with decision; backup and isolated restore remain Must.

## Exit

Plan/policy/recovery/operations evidence is complete with no unexpected destroy or Staging credential/state. Production remains unapplied and `P08-AC-006..009` can Pass for pre-release readiness.

## Implemented local baseline

- Production Terraform now has Phase 08 remote-state isolation, full runtime parity, exact numeric secret versions, Production-only service accounts/WIF/secrets/service name and coordinated Cloud Run/monitoring provisioning flags.
- `promote-production.yml` remains `PLAN_ONLY`, consumes the exact stable Staging digest, initializes the real Production backend, runs fmt/validate/plan/policy and deletes the plan binary after recording its SHA-256 hash.
- The Terraform plan policy validates both environments, blocks mutable images, destructive changes, long-lived keys, secret payloads and cross-environment identities, while allowing the explicitly reviewed public Production demo invoker only.
- `phase-08:production-readiness:validate` requires `P08-EV-004/006/007/008`, least-privilege Atlas access, logical backup, isolated restore, measured RPO/RTO, recovery owner and operations controls before returning `PASS`.
- Local verification passed: Production `terraform init -backend=false`, `terraform validate`, Terraform policy tests and 11 Production-readiness positive/negative contract cases.

## Remaining remote evidence

Part 08 is not `DONE` yet. Run the protected plan-only workflow for the exact candidate, retain the 90-day artifact, complete the Atlas logical backup and isolated restore rehearsal, test the alert route, and validate the assembled readiness record. No Production application apply is authorized in Part 08.
