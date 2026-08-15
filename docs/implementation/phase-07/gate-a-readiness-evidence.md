# Phase 07 Gate A Readiness Evidence

## 1. Evidence Context

| Field | Value |
| --- | --- |
| Verification time | `2026-08-14T15:45:33Z` |
| Owner | Trần Đức Toàn |
| Governance | `SOLO_PROJECT` role-based self-review |
| Branch | `docs/phase-07-planning-baseline` |
| Remote `main` | `ace51f1` - Phase 06 evidence closure after dependency security patch |
| Secret handling | No password, URI, token, billing identifier or service-account key recorded |

## 2. Local Tool Evidence

| Tool | Verified result |
| --- | --- |
| Git | `2.53.0.windows.3` |
| Node.js | `v24.14.0` |
| npm | `11.9.0` |
| Docker | Client/Server `29.3.1`, Linux engine reachable |
| Google Cloud CLI | `579.0.0` |
| Terraform | `1.15.8`, `windows_amd64`, `C:\Tools` in User PATH |

MongoDB Database Tools are not a Part 00 blocker. `mongodump` and `mongorestore` remain mandatory before
Part 13 backup/restore rehearsal.

## 3. Google Cloud Evidence

| Check | Result |
| --- | --- |
| Project | `microlearning-platform-502716` |
| Project state | `ACTIVE` |
| Region | `asia-southeast1` |
| Billing linked | Pass; CLI returned `True` |
| Budget alerts | Pass; owner confirmed `microlearning-free-usage-alert` and `microlearning-staging-budget` |
| Required APIs | Run, Artifact Registry, Secret Manager, IAM, IAM Credentials, STS, Resource Manager, Storage, Logging, Monitoring, Service Usage and Billing Budgets enabled |
| Credential direction | ADC permitted for controlled bootstrap; GitHub deploy must use WIF; JSON key forbidden |

Terraform remote-state direction is approved as:

- bucket name: `microlearning-tfstate-759791798260`;
- GCS versioning enabled;
- uniform bucket-level access enabled;
- public access prevention enforced;
- prefixes: `bootstrap`, `phase-07/staging`, `phase-07/production`;
- bootstrap creates the bucket and migrates temporary local bootstrap state before CI use.

This is a design approval, not evidence that the state bucket already exists. Resource creation belongs to
Part 03 and must produce separate Terraform evidence.

## 4. MongoDB Atlas Evidence

| Check | Result |
| --- | --- |
| Staging database | `microlearning_staging` |
| Application identity | Dedicated non-personal Staging user |
| Role | `readWrite` scoped to `microlearning_staging` |
| Legacy privileged user | Removed/revoked |
| Positive connection | Compass connection and synthetic write/read verification Pass |
| Data policy | Synthetic accounts/content only; no real Student/Teacher data |
| Production use | Prohibited in Phase 07 |

### Time-Bound Network Waiver

- Owner: Trần Đức Toàn.
- Approved use: MongoDB Atlas Free with public network reachability for synthetic Staging/demo only.
- Expiry: `2026-09-13` or immediately before any Production deployment, whichever is earlier.
- Controls: TLS/SRV, least-privilege user, bounded connection pool, no real data, URI only through Secret
  Manager, redacted logs and Atlas/application monitoring.
- Prohibition: the waiver does not approve Atlas Free, `0.0.0.0/0`, dynamic egress or logical backup as a
  Production security/availability design.
- Closure: remove the temporary rule or replace it with approved narrow/private connectivity before expiry.

## 5. GitHub Governance Evidence

### Protected `main`

- Pull Request required; independent approval is `APPROVED_NA` for the solo project.
- Six required checks: Lint/test/build, production dependency audit, MongoDB replica-set transaction,
  OpenAPI contract, Integrated browser E2E and Secret scan.
- Branch must be current with `main`; conversation resolution and linear history required.
- Administrator bypass, force push and deletion are disabled.

### `staging` Environment

- deployment source is only `main`;
- administrator bypass disabled;
- variables configured: `GCP_PROJECT_ID`, `GCP_REGION`, `GAR_REPOSITORY`, `CLOUD_RUN_SERVICE` and
  `TF_STATE_PREFIX`;
- no secret or long-lived Google credential stored.

### `production` Environment

- protected `main` only;
- administrator bypass disabled;
- the five non-secret baseline variables are configured;
- required reviewer is `APPROVED_NA` while the project has no collaborator;
- Production remains manual-only through workflow confirmation and exact Staging digest in Phase 08.

`GCP_WIF_PROVIDER` and `GCP_DEPLOY_SERVICE_ACCOUNT` are intentionally absent until Part 05 creates and
verifies those resources. They must be added as non-secret environment variables before a deploy job runs.

## 6. Decision

```text
Gate A: APPROVED
Planning PR: MERGED_PASS
Implementation: GRANTED_READY_TO_CODE
Cloud resource apply: CONTROLLED_BY_EXECUTION_PART_AND_TERRAFORM_PLAN
Production apply: NOT_GRANTED_UNTIL_PHASE_08_GO_NO_GO
```

This record contains sanitized evidence only. Provider screenshots remain owner-controlled and must not
include passwords, full MongoDB URI, billing instruments or access tokens.
