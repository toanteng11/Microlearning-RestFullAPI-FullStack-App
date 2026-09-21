# Phase 08 Production Secret-Container Bootstrap Runbook

## Purpose

Create only the four Production Secret Manager containers and four runtime `secretAccessor` bindings in
the existing Production Terraform state. This procedure never accepts, creates, reads or exports a secret
version/value, and it does not provision Cloud Run or monitoring.

## Approved resource boundary

The plan must keep all 14 IAM/WIF/state bootstrap resources at `no-op` and may create or retain exactly:

- `ml-production-mongodb-uri`;
- `ml-production-access-token-secret`;
- `ml-production-auth-identity-pepper`;
- `ml-production-classroom-code-pepper`;
- one `roles/secretmanager.secretAccessor` binding per container for
  `ml-runtime-production@microlearning-platform-502716.iam.gserviceaccount.com`.

Any update, delete, replacement, secret version, Cloud Run, monitoring or unrelated resource fails the
dedicated plan policy.

## Preconditions

1. Production identity bootstrap is applied, verified and drift-free.
2. This implementation is merged to `main`; local `main` is clean and equals fetched `origin/main`.
3. The active gcloud project is `microlearning-platform-502716`, billing is enabled and the owner account
   is authenticated.
4. No concurrent Terraform operation uses `phase-08/production`.

## Step 1: Plan only

```powershell
git fetch origin main
git switch main
git pull --ff-only
./scripts/invoke-phase-08-production-secret-bootstrap.ps1 -Mode Plan
```

Review:

- `artifacts/phase-08/production-secret-bootstrap/policy-report.json` is `PASS`;
- all 14 prerequisite resources are `no-op`;
- at most eight resources are created;
- update/delete/other counts are zero;
- summary fields say `secretVersionsCreated=false`, `secretValuesRead=false` and
  `productionServiceProvisioned=false`.

## Step 2: Explicit authorization and Apply

Record the plan hash/counts and obtain owner authorization for this exact eight-resource boundary. Then
run from clean, current `main`:

```powershell
./scripts/invoke-phase-08-production-secret-bootstrap.ps1 `
  -Mode Apply `
  -Confirmation APPLY_PHASE_08_PRODUCTION_SECRET_CONTAINERS
```

The command re-plans and re-validates before applying the saved plan. Apply authorization does not
authorize secret values or application deployment.

## Step 3: Verify metadata without reading values

```powershell
gcloud secrets list `
  --project microlearning-platform-502716 `
  --filter="name:ml-production-" `
  --format="value(name)"
```

Run Plan again. Expected result is Terraform `No changes`, with 14 prerequisite no-ops and eight secret
resource no-ops.

## Secret versions

Add values only through an approved protected owner procedure or the Google Cloud Console. Never paste a
Production MongoDB URI, password, token or pepper into source code, Terraform, GitHub variables, issue,
PR, log or evidence. After adding versions, verify only version metadata/state and configure the four
numeric GitHub environment variables expected by `promote-production.yml`.

## Next gate

Container bootstrap is supporting evidence only. G4 still requires separate Atlas database/user/network,
logical backup, isolated restore with measured RPO/RTO, tested alert route and a protected Production
`PLAN_ONLY` artifact for the exact candidate.
