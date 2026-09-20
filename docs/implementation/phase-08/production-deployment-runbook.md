# Phase 08 — Production Deployment Runbook

## Scope and safety

Runbook này chỉ được thực thi sau G5 `GO`/approved `CONDITIONAL_GO`, UAT sign-off và Production readiness evidence. Workflow `promote-production.yml` mặc định `PLAN_ONLY`; đường `APPLY` chỉ được dùng với exact G5 artifact và protected `production` environment. Nếu chưa đủ điều kiện apply thật, kết quả phải ghi `NOT RUN`.

## Pre-deploy

- [ ] Verify `image_ref` contains `@sha256:` and matches stable Staging record.
- [ ] Verify commit, manifest, SBOM/scan, UAT decision ID and G5 ID.
- [ ] Review Production Terraform plan/policy; no unexpected resource or secret value.
- [ ] Confirm Atlas, secret versions, WIF, state, quota/budget, monitoring, rollback revision and incident owner.
- [ ] Announce approved window and freeze unrelated changes.

## Existing verification commands

```powershell
npm run terraform:fmt:check
npm run terraform:validate
npm run terraform:policy:test
npm run terraform:security
npm run promotion:contract:test
npm run cloud:security:verify -- <service_url> <app_version> <commit_sha> <image_ref> <revision> <report.json>
npm run e2e:artifacts:scan -- artifacts/phase-08 <report.json>
```

The placeholders are filled only from actual workflow outputs. Terraform apply is not documented as an existing command in the current production workflow.

## Deployment and smoke

1. Use protected `workflow_dispatch`/approved change; no feature branch or laptop.
2. Capture plan hash, workflow run, actor and exact image.
3. Create revision with no/limited traffic where supported; check startup/readiness.
4. Verify health/readiness/version, login/session, one safe read-only journey per role, API/UI origin and logs.
5. Shift traffic only after smoke; keep prior stable revision through rollback window.
6. Create deployment record with release, revision, traffic, smoke, observation and decision.

## Abort/rollback

Abort for digest/version mismatch, readiness failure, auth/RBAC regression, data integrity issue, error/latency threshold, secret exposure or monitoring blind spot. Restore prior stable revision/digest, validate readiness, open incident and preserve evidence; never rebuild during rollback.

## Record template

```text
Deployment ID / change: <PENDING>
G5/UAT IDs: <PENDING>
Image/commit/digest: <PENDING>
Plan hash/workflow: <PENDING>
Production revision/traffic: <PENDING or NOT_RUN>
Smoke/observation: <PENDING>
Rollback/incident: <PENDING>
Final result: <PENDING>
```
