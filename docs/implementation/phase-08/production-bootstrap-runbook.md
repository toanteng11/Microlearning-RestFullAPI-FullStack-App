# Phase 08 Production Bootstrap Runbook

## Purpose

Create only the owner-managed Production identities and GitHub OIDC trust required for the protected
`Phase 08 Production Promotion` workflow. This bootstrap does not create Secret Manager containers,
read secret values, provision Cloud Run, create monitoring resources or deploy the application.

## Approved resource boundary

The bootstrap plan may contain only these 14 Terraform resources:

- two service accounts: `ml-runtime-production` and `ml-github-production`;
- seven explicit deployer project-role bindings;
- one deployer `serviceAccountUser` binding on the runtime identity;
- one Workload Identity Pool, one GitHub provider and one impersonation binding;
- one Terraform state bucket IAM binding.

The plan policy rejects every `update`, `delete`, replacement, Cloud Run, Secret Manager or monitoring
resource. A partially completed/idempotent run may show approved resources as `no-op`.

## Preconditions

1. Branch containing this runbook has passed CI and is merged to `main`.
2. Local `main` is clean and equals a freshly fetched `origin/main`.
3. `gcloud` is authenticated as the project owner; project is
   `microlearning-platform-502716`, lifecycle is `ACTIVE`, and billing is enabled.
4. Terraform and GitHub CLI are installed. `gh auth status` succeeds for the repository owner.
5. No concurrent Terraform operation is active for `phase-08/production`.

## Step 1: Plan only

Run from repository root in PowerShell:

```powershell
git fetch origin main
git switch main
git pull --ff-only
./scripts/invoke-phase-08-production-bootstrap.ps1 -Mode Plan
```

Review both files:

- `artifacts/phase-08/production-bootstrap/policy-report.json` must be `PASS`;
- `artifacts/phase-08/production-bootstrap/summary.json` must report `applied: false`,
  `productionServiceProvisioned: false`, zero update/delete and at most 14 creates.

Stop if the plan contains any resource outside the approved boundary. A successful plan is not evidence
that Production has been provisioned.

## Step 2: Explicit owner authorization

Record the reviewed plan hash and resource counts. The owner must explicitly authorize this IAM/WIF
bootstrap before Apply. Authorization for the bootstrap is not authorization to deploy the application.

## Step 3: Apply the saved reviewed boundary

After authorization, rerun from clean, current `main`:

```powershell
./scripts/invoke-phase-08-production-bootstrap.ps1 `
  -Mode Apply `
  -Confirmation APPLY_PHASE_08_PRODUCTION_BOOTSTRAP `
  -ConfigureGitHubEnvironment
```

The command re-creates and re-validates the plan before applying it. It then writes only non-secret
GitHub environment variables for the Production WIF provider, deployer service account, project, region,
Artifact Registry repository, Cloud Run service name and `phase-08/production` state prefix.

## Step 4: Verify without reading secrets

```powershell
gcloud iam service-accounts describe `
  ml-github-production@microlearning-platform-502716.iam.gserviceaccount.com
gcloud iam service-accounts describe `
  ml-runtime-production@microlearning-platform-502716.iam.gserviceaccount.com
gcloud iam workload-identity-pools providers describe production-promote `
  --workload-identity-pool=github-production `
  --location=global `
  --project=microlearning-platform-502716
gh variable list --env production `
  --repo toanteng11/Microlearning-RestFullAPI-FullStack-App
```

Expected GitHub values include `TF_STATE_PREFIX=phase-08/production`,
`GCP_WORKLOAD_IDENTITY_PROVIDER_PRODUCTION` and `GCP_DEPLOY_SERVICE_ACCOUNT_PRODUCTION`. Do not place
MongoDB credentials or application secrets in GitHub variables.

## Next gate

Bootstrap completion unlocks, but does not complete, Part 08. Next create the four Production secret
containers/versions through the approved owner procedure, configure numeric secret-version variables,
then run protected Production Promotion in `PLAN_ONLY`. Actual G4 additionally requires Atlas logical
backup, isolated restore with measured RPO/RTO and a tested alert route.

## Actual execution record

The owner-approved bootstrap was applied on `2026-09-20` from trusted `main` commit
`2111ed4e084c77000561591849a8384239aa4b33`.

- guarded Apply: `14 added, 0 changed, 0 destroyed`;
- post-apply plan: Terraform `No changes`, `0 create / 14 no-op / 0 update / 0 delete`;
- both Production service accounts exist and the WIF provider is `ACTIVE`;
- all seven non-secret GitHub Production environment variables are present;
- `secretValuesRead=false` and `productionServiceProvisioned=false`.

The redacted record is retained in `production-bootstrap-actual-evidence.md`. This closes only the
bootstrap procedure; G4 remains `PENDING`.
