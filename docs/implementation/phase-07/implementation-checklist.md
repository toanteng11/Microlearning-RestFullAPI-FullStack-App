# Phase 07 Implementation Checklist

## Gate A

- [x] Xác nhận P06 release commit/handoff.
- [x] Xác nhận GCP project access, billing và budget owner.
- [x] Cài/xác minh `gcloud` và Terraform.
- [x] Rotate Atlas credential, revoke credential cũ.
- [x] Chốt synthetic-only data và network waiver/expiry `2026-09-13`.
- [x] Tạo/chốt GitHub `staging` và `production` environment protection.
- [x] Approve Gate A; trạng thái `READY_TO_CODE` kích hoạt sau planning PR merge và main CI Pass.

## Runtime And Container

- [x] Implement relative same-origin API base.
- [x] Serve React/API/Swagger với route precedence đúng.
- [x] Hoàn thiện Production env validation/version metadata.
- [x] Xác minh health/readiness và graceful shutdown ở local.
- [x] Tạo Production multi-stage non-root image.
- [x] Bổ sung `.dockerignore`, image content checks.
- [x] Container smoke, scan và image-bound SBOM Pass ở local.
- [ ] P07-PR01 clean-checkout container CI Pass.
- [ ] P07-PR01 merge và post-merge main CI Pass để đóng Part 01-02.

## Terraform And Cloud Security

- [ ] Bootstrap remote state private/versioned.
- [x] Tạo module/API/Artifact Registry và validation contracts cho Cloud Run/monitoring ở local.
- [x] Tạo Terraform source cho runtime/seed/E2E/deploy service accounts.
- [x] Cấu hình exact WIF trust conditions và positive/negative workflows ở local.
- [ ] Chứng minh unauthorized branch/repository bị deny.
- [x] Tạo Terraform source cho Secret Manager containers và secret-level IAM; actual apply Pending.
- [x] Thêm secure stdin-only secret version script và rotation runbook.
- [ ] Add secret versions qua secure manual flow.
- [x] Terraform fmt/init/validate/policy tests và Trivy IaC Pass ở local.
- [ ] Remote Terraform plan/review evidence còn Pending.
- [x] Local canary/no-secret policy Pass.
- [ ] Remote state/plan no-secret evidence còn Pending.

## Atlas And First Deploy

- [x] Tạo và xác minh Staging database/user/network rule theo Gate A waiver.
- [x] Khóa source contract pool `0/10`, bounded timeouts, TLS/SRV và database Staging.
- [x] Tạo private seed command có environment guard, exact secret reference và index preparation.
- [x] Tạo index/transaction/invariant diagnostic tự dọn dữ liệu; actual Atlas run Pending.
- [x] Implement Cloud Run service/seed Job Terraform và two-step first-deploy workflow.
- [ ] Terraform apply first Staging revision.
- [ ] Xác minh HTTPS/probes/scale/service identity.
- [ ] Ghi deployment record.

## CD And Cloud Tests

- [x] Implement Build/publish workflow chỉ nhận successful protected main CI run hoặc validated recovery run.
- [x] Implement release lineage và deploy input chỉ chấp nhận exact registry digest.
- [x] Implement Staging Terraform plan/apply/seed/smoke/drift workflow với concurrency lock.
- [x] Implement candidate/stable deployment record gắn commit, digest, revision và workflow provenance.
- [x] Implement four-role Cloud Playwright suite và HTTPS/security verifier.
- [x] Implement negative auth/RBAC/ownership/concurrency checks ở Cloud suite.
- [x] Implement artifact credential-redaction gate trước upload.
- [x] Implement prior-revision rollback path cho post-apply failure.
- [ ] Build/publish workflow Pass thật từ protected `main`.
- [ ] Image deploy bằng exact digest trên Staging.
- [ ] Staging auto-deploy workflow Pass.
- [ ] Version/digest check Pass.
- [ ] Student/Teacher/Admin/Super Admin cloud E2E Pass.
- [ ] Negative RBAC/ownership/concurrency Pass.
- [ ] Cookie/CORS/proxy/deep-link/Swagger Pass.
- [ ] Failed-smoke rollback path Pass.

## Operations

- [x] Structured logs và redaction contract/local test Pass; Cloud canary Pending.
- [x] Dashboard/uptime/alerts source tạo bằng IaC; Cloud apply/notification Pending.
- [ ] Test notification đến đúng owner.
- [x] Synthetic backup/checksum tooling và staging-only guards đã có; Atlas run Pending.
- [x] Isolated restore/invariants tooling và checksum verification đã có; Atlas run Pending.
- [x] Prior-digest rollback workflow/incident contract đã có; Cloud rehearsal Pending.
- [ ] Post-rollback drift check clean.
- [ ] Budget/quota/cost evidence đầy đủ.

## Production Readiness And Exit

- [x] Protected Production promotion workflow reject invalid digest ở local contract test; remote dry-run Pending.
- [x] Production Atlas/network/backup gaps block P08 Go đúng trong handoff/exit contract.
- [x] Security/IAM/public-resource review contract Pass; live Cloud review Pending.
- [x] Clean-clone hardening workflow và local contract đã sẵn sàng; remote run Pending.
- [ ] `66/66` Must AC Pass.
- [ ] Conditional criteria Pass hoặc `APPROVED_NA`.
- [ ] P07 release PR và post-merge main CI Pass cho branch implementation.
- [ ] Latest Staging CD/smoke Pass.
- [ ] Evidence register không placeholder/secret.
- [ ] Exit report và P08 handoff accepted.
