# Phase 07 Phase Plan

## 1. Objective

Triển khai release candidate hiện tại lên Production-like Staging bằng quy trình DevOps có thể tái
lập, an toàn và có bằng chứng. Kết quả phải giúp Phase 08 thực hiện System Test/UAT và Production
Go-No-Go mà không phải thiết kế lại artifact, environment, deployment hay recovery.

## 2. Delivery Strategy

Phase 07 dùng chiến lược `build once, promote by digest`:

```text
Pull Request
  -> CI quality/security/contract/container validation
Merge main
  -> wait for required CI success
  -> build one production image
  -> scan + SBOM + push Artifact Registry
  -> capture exact digest
  -> Terraform plan/apply Staging with that digest
  -> Cloud health/version/role smoke
  -> monitoring + deployment evidence

Phase 08 approval
  -> verify Staging digest/evidence
  -> protected Production environment approval
  -> apply same digest
  -> production smoke/monitoring/release closure
```

Không rebuild image khi promote Production. Không deploy từ laptop vào Production. Không dùng
`latest` làm deployment identity.

## 3. Milestones

| Milestone | Parts | Exit condition |
| --- | --- | --- |
| M0 Planning/Gate A | 00 | Access, manual decisions, tools và security prerequisites approved |
| M1 Cloud-ready runtime | 01-02 | Single-origin image chạy local, non-root, probes/deep links Pass |
| M2 Reproducible infrastructure | 03-07 | Terraform plan, registry, IAM/WIF, secrets, Atlas contract Pass |
| M3 Staging online | 08-10 | Exact digest deployed by CI/CD; HTTPS/version evidence Pass |
| M4 Operationally verified | 11-14 | Cloud E2E, monitoring, backup/restore, rollback rehearsal Pass |
| M5 Promotion ready | 15-16 | Production workflow protected; security/cost/quality review Pass |
| M6 Phase exit | 17 | `66/66` Must Pass và P08 handoff accepted |

## 4. Pull Request Strategy

| PR | Parts | Scope | Merge gate |
| --- | --- | --- | --- |
| P07-PR00 | 00 | Planning baseline/Gate A | Document validation, decisions approved |
| P07-PR01 | 01-02 | Single-origin runtime + Production image | CI, container smoke, E2E regression |
| P07-PR02 | 03-06 | Terraform, registry, IAM/WIF, secrets | fmt/validate/plan, keyless auth, no secret/state leak |
| P07-PR03 | 07-08 | Atlas Staging + first Cloud deploy | Atlas preflight, exact revision/HTTPS/readiness evidence |
| P07-PR04 | 09-10 | Artifact build/publish + Staging CD | main-to-digest-to-Staging chain Pass |
| P07-PR05 | 11 | Cloud smoke and four-role E2E | all Must cloud journeys Pass |
| P07-PR06 | 12-14 | Observability, backup/restore, rollback | alert and recovery rehearsals Pass |
| P07-PR07 | 15-16 | Production promotion readiness + hardening | protected same-digest dry path, security/cost review |
| P07-PR08 | 17 | Exit evidence/P08 handoff | all acceptance/evidence/sign-off complete |

Mỗi PR phải branch từ `main` đã đồng bộ và không dùng prefix `codex/`.

## 5. Sequencing Rules

- Part 01-02 không cần Cloud credential và được làm trước để giảm thời gian debug trên Cloud.
- Part 03 bootstrap state có thao tác thủ công một lần; resource còn lại phải đi qua Terraform.
- Part 05 WIF phải Pass trước khi workflow được cấp quyền push/deploy.
- Part 07 Atlas phải Pass transaction/index/pool test trước first Staging deploy.
- Part 09 không được push image nếu CI source commit chưa Success.
- Part 10 không deploy tag mutable; Terraform nhận `image@sha256:<digest>`.
- Part 11 smoke fail thì deployment fail và không mở promotion.
- Part 13-14 phải dùng synthetic data/prior stable revision; không thử phá dữ liệu thật.
- Part 15 chỉ chuẩn bị Production; actual Production apply cần Phase 08 Go decision.

## 6. Estimate

| Workstream | Estimate |
| --- | ---: |
| Planning/manual prerequisite | 1.5 ngày |
| Runtime/container | 2.0 ngày |
| Terraform/GCP/IAM/WIF/secrets | 3.0 ngày |
| Atlas/Staging/CD | 2.5 ngày |
| Cloud E2E/observability/recovery | 3.0 ngày |
| Production readiness/hardening/exit | 2.0 ngày |
| Tổng dự kiến | 14.0 ngày |

Estimate không bao gồm thời gian chờ account/billing/provider quota hoặc Phase 08 UAT.

## 7. Stop Conditions

- Secret/credential xuất hiện trong Git diff, log, artifact hoặc screenshot.
- Terraform plan có destroy/replace ngoài scope hoặc state không được bảo vệ.
- WIF condition cho phép repository/branch/environment không dự kiến.
- Atlas dùng real personal/student data trên Free/public-network setup.
- Cloud Run revision chạy sai commit/digest hoặc Web/API không cùng release identity.
- Smoke auth/RBAC/data integrity fail.
- Backup/restore hoặc rollback chỉ được mô tả mà không rehearsal.
- Cost/quota không có owner hoặc billing anomaly chưa được xử lý.
