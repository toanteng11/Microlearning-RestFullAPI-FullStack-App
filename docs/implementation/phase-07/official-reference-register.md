# Official Reference Register

## 1. Mục đích

Danh sách nguồn chính thức dùng để kiểm chứng quyết định Phase 07. Khi implementation bắt đầu, người thực
hiện phải kiểm tra lại tài liệu hiện hành nếu UI, feature status hoặc giới hạn dịch vụ thay đổi.

Last reviewed: `2026-08-03`.

## 2. Google Cloud

| Chủ đề | Nguồn chính thức | Áp dụng |
| --- | --- | --- |
| Deploy Cloud Run | <https://docs.cloud.google.com/run/docs/deploying> | deploy image, revision, digest |
| Invoke/Service URL | <https://docs.cloud.google.com/run/docs/triggering/https-request> | deterministic HTTPS origin and post-deploy verification |
| Container runtime contract | <https://docs.cloud.google.com/run/docs/container-contract> | port, filesystem, lifecycle, `SIGTERM`/shutdown budget |
| Health checks | <https://docs.cloud.google.com/run/docs/configuring/healthchecks> | startup/liveness/readiness policy |
| Rollout/rollback/traffic | <https://docs.cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration> | rollback revision và traffic |
| Service identity | <https://docs.cloud.google.com/run/docs/configuring/services/service-identity> | runtime identity |
| Secret Manager integration | <https://docs.cloud.google.com/run/docs/configuring/services/secrets> | secret version mount/env |
| Workload Identity Federation | <https://docs.cloud.google.com/iam/docs/workload-identity-federation> | keyless GitHub auth |
| Google Cloud CLI installation | <https://cloud.google.com/sdk/docs/install-sdk> | Part 00 workstation setup |

## 3. Terraform

| Chủ đề | Nguồn chính thức | Áp dụng |
| --- | --- | --- |
| Terraform installation | <https://developer.hashicorp.com/terraform/install> | pinned workstation/CI tooling |
| GCS backend | <https://developer.hashicorp.com/terraform/language/backend/gcs> | private versioned remote state |

## 4. GitHub

| Chủ đề | Nguồn chính thức | Áp dụng |
| --- | --- | --- |
| Deployment environments | <https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments> | Staging/Production protection |
| OIDC với Google Cloud | <https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-google-cloud-platform> | workflow token exchange |

## 5. MongoDB Atlas

| Chủ đề | Nguồn chính thức | Áp dụng |
| --- | --- | --- |
| Cluster types/limits | <https://www.mongodb.com/docs/atlas/manage-clusters/> | Free vs dedicated capability |
| Connect to deployment | <https://www.mongodb.com/docs/atlas/connect-to-database-deployment/> | SRV/TLS/network access |
| Cluster security | <https://www.mongodb.com/docs/atlas/setup-cluster-security/> | database user và IP access |
| Free cluster | <https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/> | Staging/demo constraints |
| MongoDB Database Tools | <https://www.mongodb.com/docs/database-tools/installation/installation/> | logical backup/restore rehearsal |

## 6. Supply Chain Tooling

| Chủ đề | Nguồn chính thức | Áp dụng |
| --- | --- | --- |
| Trivy container image | <https://trivy.dev/docs/latest/guide/target/container_image/> | image vulnerability/misconfiguration scan |
| Trivy SBOM | <https://trivy.dev/docs/latest/guide/target/sbom/> | CycloneDX SBOM generation/inspection |

## 7. Review Policy

- Chỉ dùng official documentation cho quyết định kỹ thuật thay đổi theo thời gian.
- Ghi ngày review và ảnh hưởng nếu tài liệu thay đổi.
- Feature Preview không được dùng như hard dependency Production nếu chưa có approval.
- Pricing/free tier phải được kiểm tra lại ngay trước khi provision vì có thể thay đổi.
