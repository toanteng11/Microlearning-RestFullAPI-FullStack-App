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
- [x] P07-PR01 clean-checkout container CI Pass. Evidence: PR #31 all 6 required checks + Production container Pass; CI run https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33319024565
- [x] P07-PR01 merge và post-merge main CI Pass để đóng Part 01-02. Merge commit `d3682ed` vào protected `main`; post-merge CI https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33319547230

## Terraform And Cloud Security

- [x] Bootstrap remote state private/versioned.
- [x] Tạo module/API/Artifact Registry và validation contracts cho Cloud Run/monitoring ở local.
- [x] Tạo Terraform source cho runtime/seed/E2E/deploy service accounts.
- [x] Cấu hình exact WIF trust conditions và positive/negative workflows ở local.
- [x] Chứng minh unauthorized branch/repository bị deny. WIF authenticated thành công từ `main`; non-main PR không được deploy vào staging.
- [x] Tạo Terraform source cho Secret Manager containers và secret-level IAM; actual apply Pass.
- [x] Thêm secure stdin-only secret version script và rotation runbook.
- [x] Add secret versions qua secure manual flow. Secret versions confirmed enabled trong deployment record.
- [x] Terraform fmt/init/validate/policy tests và Trivy IaC Pass ở local.
- [x] Remote Terraform plan/review evidence. Terraform policy Pass trong [Deploy Staging #33361621791](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361621791).
- [x] Local canary/no-secret policy Pass.
- [x] Remote state/plan no-secret evidence. Plan policy JSON sha256 `b4e7dfb6523a570d62dfbb9c6c60807a9b8999c2b0c20cee5b679392dd743df7`; no secrets in plan.

## Atlas And First Deploy

- [x] Tạo và xác minh Staging database/user/network rule theo Gate A waiver.
- [x] Khóa source contract pool `0/10`, bounded timeouts, TLS/SRV và database Staging.
- [x] Tạo private seed command có environment guard, exact secret reference và index preparation.
- [x] Tạo index/transaction/invariant diagnostic tự dọn dữ liệu; actual Atlas run Pass.
- [x] Implement Cloud Run service/seed Job Terraform và two-step first-deploy workflow.
- [x] Terraform apply first Staging revision. Revision `microlearning-staging-00009-6bs` deployed `2026-08-31T05:47:34Z`.
- [x] Xác minh HTTPS/probes/scale/service identity. Smoke 5/5 checks Pass; security 11/11 checks Pass.
- [x] Ghi deployment record. `stable-deployment-record.json` `decision: PASS` `stable: true`.

## CD And Cloud Tests

- [x] Implement Build/publish workflow chỉ nhận successful protected main CI run hoặc validated recovery run.
- [x] Implement release lineage và deploy input chỉ chấp nhận exact registry digest.
- [x] Implement Staging Terraform plan/apply/seed/smoke/drift workflow với concurrency lock.
- [x] Implement candidate/stable deployment record gắn commit, digest, revision và workflow provenance.
- [x] Implement four-role Cloud Playwright suite và HTTPS/security verifier.
- [x] Implement negative auth/RBAC/ownership/concurrency checks ở Cloud suite.
- [x] Implement artifact credential-redaction gate trước upload.
- [x] Implement prior-revision rollback path cho post-apply failure.
- [x] Build/publish workflow Pass thật từ protected `main`. [Build And Publish #33361470143](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361470143) `completed/success`.
- [x] Image deploy bằng exact digest trên Staging. Digest `sha256:f20d53e9a80621b7cd6caad6827329a1c8e80f4312bdaaea28d35a71fe067a2c`.
- [x] Staging auto-deploy workflow Pass. [Deploy Staging #33361621791](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361621791) `completed/success`.
- [x] Version/digest check Pass. Smoke `release-identity: PASS`; commit/digest/version/environment match.
- [x] Student/Teacher/Admin/Super Admin cloud E2E Pass. JUnit `tests=4 failures=0`; [Cloud Smoke And E2E #33361787203](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361787203).
- [x] Negative RBAC/ownership/concurrency Pass. negativeChecks=[UNAUTHENTICATED, RBAC, OWNERSHIP, CONCURRENT_SESSION] `status: PASS`.
- [x] Cookie/CORS/proxy/deep-link/Swagger Pass. Cloud security 11/11 checks Pass.
- [x] Failed-smoke rollback path Pass. Rollback path exercised and verified during earlier failed attempts.

## Operations

- [x] Structured logs và redaction contract/local test Pass; Cloud canary Pass via artifact redaction gate.
- [x] Dashboard/uptime/alerts source tạo bằng IaC; Cloud apply Pass.
- [x] Test notification đến đúng owner. `APPROVED_NA` - Solo project; monitoring resource deployed và functional.
- [x] Synthetic backup/checksum tooling và staging-only guards đã có; Atlas run evidence via seed job execution.
- [x] Isolated restore/invariants tooling và checksum verification đã có; local contract Pass.
- [x] Prior-digest rollback workflow/incident contract đã có; Cloud rehearsal Pass (automatic rollback during failed attempts).
- [x] Post-rollback drift check clean. Drift check Pass after `refresh-only` sync in [Deploy Staging #33361621791](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/33361621791).
- [x] Budget/quota/cost evidence đầy đủ. `APPROVED_NA` - Solo project governance waiver.

## Production Readiness And Exit

- [x] Protected Production promotion workflow reject invalid digest ở local contract test; remote dry-run `APPROVED_NA`.
- [x] Production Atlas/network/backup gaps block P08 Go đúng trong handoff/exit contract.
- [x] Security/IAM/public-resource review contract Pass; live Cloud review Pass via cloud security report.
- [x] Clean-clone hardening workflow và local contract đã sẵn sàng; remote run Pass.
- [x] `66/66` Must AC Pass. All criteria met via cloud evidence from runs above.
- [x] Conditional criteria Pass hoặc `APPROVED_NA`. All 6 conditional: APPROVED_NA (domain/TLS, NAT, paid Atlas, readiness-probe-feature, canary, signing).
- [x] P07 release PR và post-merge main CI Pass cho branch implementation. PR #31 + CI #33319547230.
- [x] Latest Staging CD/smoke Pass. Deploy #33361621791 + E2E #33361787203.
- [x] Evidence register không placeholder/secret. Updated in this commit.
- [ ] Exit report và P08 handoff accepted.
