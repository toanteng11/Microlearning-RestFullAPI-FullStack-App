# Phase 08 Production Bootstrap - Actual Evidence

## Result

- Execution status: `PASS`
- Scope status: `BOOTSTRAP_ONLY`
- Production application deployment: `NOT_RUN`
- Secret values read or recorded: `false`
- Actor: `tranductoan110305@gmail.com`
- Recorded at: `2026-09-20T15:14:50.5526752Z`
- Project/region: `microlearning-platform-502716` / `asia-southeast1`

This evidence records only the owner-approved IAM, Workload Identity Federation and Terraform state-access
bootstrap. It does not satisfy the complete G4 Production-readiness gate and does not authorize a
Production application deployment.

## Reviewed source

| Item | Actual evidence |
| --- | --- |
| Guard implementation | [PR #61](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/61) |
| Argument-binding hotfix | [PR #62](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/62) |
| Trusted source commit | `2111ed4e084c77000561591849a8384239aa4b33` |
| Post-merge main CI | [Run 35518658639](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/35518658639) - `success` |
| Apply plan hash | `sha256:e09e8e007db2462a6ad46dd677786352a3b184428225cb27b3fb24f76816645a` |
| Apply result | `14 added, 0 changed, 0 destroyed` |
| Post-apply plan hash | `sha256:7fa4f72f6f9a475b75f9262f7b7ba7005010119721a377bb4084aa5b57a7d0b0` |
| Idempotency result | `0 create, 14 no-op, 0 update, 0 delete` / Terraform `No changes` |

## Verified boundary

The applied resources are exactly the 14 allowlisted bootstrap resources:

- service accounts `ml-github-production` and `ml-runtime-production`;
- seven explicit deployer project-role bindings;
- deployer `serviceAccountUser` on the runtime identity;
- Workload Identity Pool `github-production`;
- provider `production-promote` and its impersonation binding;
- Production Terraform-state bucket IAM binding.

Read-only verification observed both service accounts and an `ACTIVE` WIF provider. The provider condition
is restricted to repository ID `1298420607`, owner ID `237665091`, `refs/heads/main`, GitHub environment
`production` and `.github/workflows/promote-production.yml@refs/heads/main`.

The GitHub `production` environment contains these non-secret variables:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GAR_REPOSITORY`
- `CLOUD_RUN_SERVICE`
- `TF_STATE_PREFIX`
- `GCP_WORKLOAD_IDENTITY_PROVIDER_PRODUCTION`
- `GCP_DEPLOY_SERVICE_ACCOUNT_PRODUCTION`

No MongoDB URI, password, token, pepper, private key or secret payload was read, written to GitHub
variables or retained in this evidence.

## Gate disposition

- Supporting evidence for `P08-EV-007`: `PASS` for IAM/WIF/state separation.
- `P08-EV-007` overall: `PENDING`, because Production secret and database identities are not yet evidenced.
- `P08-EV-004/006/008`: `PENDING`.
- G4: `PENDING`.
- Production promotion: `NO_GO` until G3, complete G4 and signed G5 are `PASS`/`GO` for the exact candidate.

## Next required evidence

1. Create the four Production secret containers and enabled numeric versions without exposing values.
2. Create a least-privilege Atlas Production user and separate database/network decision.
3. Run the protected Production workflow in `PLAN_ONLY` and retain the redacted 90-day artifact.
4. Complete logical backup, isolated restore, measured RPO/RTO and rollback evidence.
5. Test dashboard, uptime check, alert route, budget/quota and incident ownership.

