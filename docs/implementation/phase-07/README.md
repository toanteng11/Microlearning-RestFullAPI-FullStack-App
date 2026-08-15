# Phase 07 - DevOps And Deployment

## 1. Mục tiêu

Phase 07 biến source code đã hoàn thành qua Phase 06 thành một release candidate có thể build,
triển khai, quan sát và phục hồi trên Cloud. Nền tảng đã chốt là Google Cloud Run, MongoDB Atlas,
Google Artifact Registry, Google Secret Manager, Cloud Logging/Monitoring và GitHub Actions.
Firebase không thuộc kiến trúc này.

Phase 07 không chỉ chứng minh rằng URL Cloud mở được. Phase chỉ hoàn thành khi image bất biến được
truy vết theo commit/digest, Staging được deploy bằng identity ngắn hạn, secret không lộ, các actor
smoke Pass, monitoring nhận tín hiệu, backup/restore và rollback được rehearsal, và toàn bộ evidence
có thể tái lập.

## 2. Trạng thái

| Thuộc tính | Giá trị |
| --- | --- |
| Planning status | `MERGED_TO_MAIN` - [PR #21](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/21), merge commit `f5c58c3` |
| Provider decision | `ACCEPTED` |
| Implementation status | `READY_TO_CODE` - Part 01 authorized |
| Gate A | `APPROVED` on `2026-08-14` |
| Release input | Phase 06 release `d2abe52`, security patch `e3c52cf`, evidence closure `ace51f1` |
| Cloud project | `microlearning-platform-502716`; access, billing, budget, region and required APIs verified |
| Atlas | Free `Cluster0`; dedicated scoped Staging user/database verified; synthetic-only waiver expires `2026-09-13` |
| Target Phase 07 | Production-like Staging/demo thật và Production promotion readiness |
| Actual Production release | Phase 08 sau System Test/UAT/Go-No-Go |

Gate A đã xác nhận billing/budget, Cloud access, Atlas credential rotation, Staging network waiver,
GitHub environments và phạm vi dữ liệu synthetic. Planning PR đã merge qua protected `main`; sáu required
checks và [post-merge main CI](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/31818169576)
đều Pass. Quyền bắt đầu Part 01 đã có hiệu lực.

## 3. Kết quả bắt buộc

- Một production application image phục vụ React, REST API và Swagger cùng origin.
- Terraform quản lý resource/config chính; secret value không nằm trong code hoặc Terraform state.
- GitHub Actions xác thực Google Cloud bằng OIDC/Workload Identity Federation, không dùng JSON key.
- Main CI xanh mới được build/push image; Staging deploy theo exact digest.
- Cloud Run Staging có HTTPS, startup/liveness probes, bounded scale/concurrency và dedicated service
  identity.
- MongoDB Atlas Staging dùng database user riêng, TLS, database riêng, pool bounded, index/transaction
  verification và synthetic data.
- Cloud smoke kiểm tra health, readiness, version, SPA deep link, Swagger và flow đại diện của
  Student, Teacher, Admin/Super Admin.
- Cloud Logging/Monitoring có log redaction, dashboard, uptime check và alert test.
- Backup/restore rehearsal dùng synthetic data; rollback Cloud Run về prior stable digest được kiểm
  chứng.
- Production promotion workflow chỉ chấp nhận digest đã Pass Staging và cần protected manual gate. Với
  dự án cá nhân, gate tuân theo `solo-project-governance.md`, không giả lập independent reviewer.

## 4. Ranh giới Phase 07 và Phase 08

| Nội dung | Phase 07 | Phase 08 |
| --- | --- | --- |
| Production-like Staging | Build, deploy, smoke, monitor, recovery rehearsal | Dùng cho System Test/UAT |
| Production workflow | Implement, validate, protect, dry-run/plan | Approve và thực thi release thật |
| Production Atlas | Chốt gate/tier/backup/network contract | Cấp resource theo Go decision |
| UAT | Chuẩn bị environment/test accounts/evidence path | Thực thi và sign-off |
| Go/No-Go | Chuẩn bị template và operational recommendation | Quyết định release cuối |
| Custom domain | Conditional design | Thực hiện khi owner/DNS/cost được duyệt |

## 5. Execution Parts

| Part | Nội dung | Gate/Outcome |
| --- | --- | --- |
| 00 | Gate A And Manual Prerequisites | Access, billing, tools, credential rotation, scope approval |
| 01 | Single-Origin Application Runtime | React/API/Swagger cùng Cloud Run origin |
| 02 | Production Container | Reproducible non-root image và local production smoke |
| 03 | Terraform Foundation And State | Provider lock, remote state, validate/plan |
| 04 | Artifact Registry And Supply Chain | Digest, scan, SBOM, retention |
| 05 | IAM And Workload Identity Federation | Keyless least-privilege deploy identity |
| 06 | Secret And Runtime Configuration | Secret Manager, env contract, rotation |
| 07 | MongoDB Atlas Staging | TLS/user/network/pool/index/transaction/data policy |
| 08 | Staging Infrastructure And First Deploy | Terraform apply, Cloud Run revision, HTTPS |
| 09 | Build And Publish CD | CI-success to immutable image |
| 10 | Staging Deployment CD | Digest deployment, concurrency và deployment record |
| 11 | Cloud Smoke And E2E | Actor journeys, Swagger, SPA, cookie, version |
| 12 | Observability And Alerting | Logs, metrics, uptime, alert test/runbook |
| 13 | Backup Restore And Recovery | Synthetic backup/restore rehearsal và RPO/RTO direction |
| 14 | Rollback And Incident Rehearsal | Prior revision traffic rollback và incident record |
| 15 | Production Promotion Readiness | Protected environment, same digest, Go gate |
| 16 | Security Cost And Quality Hardening | IAM review, scan, budget/quota, drift, clean clone |
| 17 | Exit Evidence And Phase 08 Handoff | Acceptance, sign-off, evidence package |

Chi tiết thực thi nằm trong thư mục `execution-parts/`.

## 6. Document Map

| Nhóm | Tài liệu chính |
| --- | --- |
| Điều hành | `phase-plan.md`, `scope-and-deliverables.md`, `work-breakdown-structure.md`, `planning-validation-evidence.md` |
| Quyết định | `ba-alignment-and-decisions.md`, `technical-decisions.md`, `gate-a-decision-sheet.md` |
| Kiến trúc | `architecture-and-deployment-topology.md`, `environment-resource-matrix.md`, `resource-naming-and-labeling.md` |
| Runtime | `production-runtime-contract.md`, `single-origin-routing-contract.md`, `production-container-contract.md` |
| IaC/Cloud | `infrastructure-as-code-design.md`, `manual-prerequisites.md`, `iam-and-workload-identity.md` |
| Artifact/config/data | `artifact-supply-chain.md`, `secret-and-configuration-management.md`, `staging-configuration-baseline.md`, `mongodb-atlas-integration.md` |
| Delivery | `github-actions-cd-design.md`, `staging-deployment-runbook.md`, `production-promotion-runbook.md` |
| Operations | `smoke-and-e2e-strategy.md`, `observability-and-alerting.md`, `backup-restore-disaster-recovery.md`, `rollback-and-incident-response.md` |
| Governance | `solo-project-governance.md`, `security-hardening.md`, `cost-budget-and-quota.md`, `risk-and-issues.md` |
| Dev/Test | `source-file-blueprint.md`, `testing-strategy.md`, `test-case-catalog.md`, `test-case-execution-matrix.md`, `developer-start-guide.md` |
| Exit | `acceptance-criteria.md`, `traceability-matrix.md`, `evidence-register.md`, `phase-exit-evidence.md`, `phase-08-handoff.md`, `exit-report.md` |

Gate A evidence được tổng hợp tại `gate-a-readiness-evidence.md`; file không chứa credential hoặc billing
instrument.

## 7. Definition Of Ready

Phase 07 chỉ được đổi sang `READY_TO_CODE` khi:

1. Gate A decision sheet không còn Must item `Pending`.
2. Atlas credential đã rotate; credential cũ bị revoke và không xuất hiện trong Git/log/docs.
3. Người thực hiện đăng nhập được `gcloud`, có Terraform và Docker hoạt động.
4. Billing account/budget owner và project access được xác nhận.
5. Staging data chỉ là synthetic; Atlas Free/public-network waiver có owner và expiry.
6. GitHub `staging`/`production` environment protection direction và solo-project waiver được chấp nhận.
7. Scope Phase 07/08 và Production non-goal được Product Owner xác nhận.

## 8. Definition Of Done

- `66/66` Must acceptance criteria Pass.
- Conditional capability có `Pass` hoặc `APPROVED_NA`, không bị bỏ im lặng.
- PR CI, post-merge main CI, Staging CD và post-deploy smoke xanh.
- Critical/High defect bằng `0`; không có secret/security/data waiver nghiêm trọng.
- Exact commit, image digest, Cloud Run revision, Staging URL và workflow run được ghi.
- Monitoring/alert, backup/restore và rollback rehearsal có evidence.
- P08 handoff được review và accepted.

## 9. Tài liệu tham chiếu

- BA DevOps: `../../../business-analysis/15-devops-deployment/`.
- BA DevOps acceptance: `../../../business-analysis/18-acceptance-criteria/devops-release-acceptance.md`.
- Release planning: `../../../business-analysis/21-release-planning/`.
- Phase 06 handoff: `../phase-06/phase-07-handoff.md`.
- Provider baseline: `cloud-provider-baseline.md`.
