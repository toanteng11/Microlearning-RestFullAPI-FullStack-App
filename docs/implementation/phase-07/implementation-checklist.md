# Phase 07 Implementation Checklist

## Gate A

- [ ] Xác nhận P06 release commit/handoff.
- [ ] Xác nhận GCP project access, billing và budget owner.
- [ ] Cài/xác minh `gcloud` và Terraform.
- [ ] Rotate Atlas credential, revoke credential cũ.
- [ ] Chốt synthetic-only data và network waiver/expiry.
- [ ] Tạo/chốt GitHub `staging` và `production` environment protection.
- [ ] Approve Gate A và đổi trạng thái `READY_TO_CODE`.

## Runtime And Container

- [ ] Implement relative same-origin API base.
- [ ] Serve React/API/Swagger với route precedence đúng.
- [ ] Hoàn thiện Production env validation/version metadata.
- [ ] Xác minh health/readiness và graceful shutdown.
- [ ] Tạo Production multi-stage non-root image.
- [ ] Bổ sung `.dockerignore`, image content checks.
- [ ] Container smoke, scan và SBOM Pass.

## Terraform And Cloud Security

- [ ] Bootstrap remote state private/versioned.
- [ ] Tạo module/API/Artifact Registry/Cloud Run/monitoring.
- [ ] Tạo runtime/deploy service accounts.
- [ ] Cấu hình WIF trust conditions.
- [ ] Chứng minh unauthorized branch/repository bị deny.
- [ ] Tạo Secret Manager containers/IAM.
- [ ] Add secret versions qua secure manual flow.
- [ ] Terraform fmt/validate/security/plan Pass.
- [ ] State/plan không chứa secret.

## Atlas And First Deploy

- [ ] Tạo Staging database/user/network rule.
- [ ] Cấu hình pool/timeouts/TLS.
- [ ] Seed synthetic data có guard.
- [ ] Verify indexes/transactions/invariants.
- [ ] Terraform apply first Staging revision.
- [ ] Xác minh HTTPS/probes/scale/service identity.
- [ ] Ghi deployment record.

## CD And Cloud Tests

- [ ] Build/publish workflow chỉ nhận successful main commit.
- [ ] Image deploy bằng exact digest.
- [ ] Staging auto-deploy workflow Pass.
- [ ] Version/digest check Pass.
- [ ] Student/Teacher/Admin/Super Admin cloud E2E Pass.
- [ ] Negative RBAC/ownership/concurrency Pass.
- [ ] Cookie/CORS/proxy/deep-link/Swagger Pass.
- [ ] Failed-smoke rollback path Pass.

## Operations

- [ ] Structured logs và redaction Pass.
- [ ] Dashboard/uptime/alerts tạo bằng IaC.
- [ ] Test notification đến đúng owner.
- [ ] Synthetic backup/checksum Pass.
- [ ] Isolated restore/invariants Pass.
- [ ] Prior-digest rollback rehearsal Pass.
- [ ] Post-rollback drift check clean.
- [ ] Budget/quota/cost evidence đầy đủ.

## Production Readiness And Exit

- [ ] Protected Production promotion workflow reject invalid digest.
- [ ] Production Atlas/network/backup gaps block P08 Go đúng.
- [ ] Security/IAM/public-resource review Pass.
- [ ] Clean-clone full verification Pass.
- [ ] `66/66` Must AC Pass.
- [ ] Conditional criteria Pass hoặc `APPROVED_NA`.
- [ ] P07 release PR và post-merge main CI Pass.
- [ ] Latest Staging CD/smoke Pass.
- [ ] Evidence register không placeholder/secret.
- [ ] Exit report và P08 handoff accepted.
