# Part 08 - Production Readiness and Recovery

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
