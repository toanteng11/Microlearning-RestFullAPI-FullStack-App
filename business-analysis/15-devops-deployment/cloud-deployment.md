# Cloud Deployment

## Mục Đích

Tài liệu này quy định cách triển khai Cloud theo `ADR-010` đã được chấp thuận ngày 2026-07-17. Baseline sử dụng **Google Cloud Run + MongoDB Atlas + GitHub Actions**, không sử dụng Firebase. Các capability và checklist bên dưới là điều kiện thực thi, kiểm thử và nâng cấp môi trường chứ không còn là danh sách để chọn provider.

## Cloud Deployment Target

```text
GitHub protected branch/tag
  -> GitHub Actions: lint/test/build/scan
  -> multi-stage production image: React + Node.js/ExpressJS + Swagger
  -> Google Artifact Registry: immutable tag + digest
  -> Google Cloud Run: one HTTPS origin
       |-- React routes
       |-- /api/v1/*
       |-- /api-docs, /health, /ready, version
       |-- logs/metrics -> Cloud Logging/Monitoring
       +-- TLS -> MongoDB Atlas

Optional media release -> private object storage selected by separate ADR
```

## Accepted Service Mapping

| Capability | Selected service | Baseline decision |
| --- | --- | --- |
| Application runtime | Google Cloud Run | Một stateless application service phục vụ Web/API/Swagger cùng origin. |
| Managed database | MongoDB Atlas | Cluster tách Staging/Production; Free cluster chỉ cho demo, synthetic data và tải nhỏ. |
| CI/CD | GitHub Actions | PR quality gates, immutable image publish, Staging deploy và protected Production approval. |
| Container registry | Google Artifact Registry | Một private Docker repository cùng region với Cloud Run, deploy theo digest. |
| Runtime secrets | Google Secret Manager | Cloud Run service account chỉ đọc đúng secret cần dùng. |
| Logs/metrics/alerts | Cloud Logging và Cloud Monitoring | Structured logs, health/latency/error metrics, dashboard và alert. |
| TLS/public endpoint | Cloud Run managed HTTPS URL | Dùng `run.app` cho Staging/demo; custom domain là decision còn mở cho Production. |
| Static hosting | Không tách riêng | React build được đóng trong application image; Firebase không sử dụng. |

## Capability Requirements

| Capability | Must/Should | Requirement |
| --- | --- | --- |
| Single-origin React hosting | Must | Cloud Run image phục vụ React static build, cache header và SPA fallback mà không rewrite nhầm `/api`, Swagger hoặc health endpoints. |
| Container/application runtime | Must | Chạy versioned application image, inject env/secret, expose health/readiness, xem log và cấu hình resource/scale. |
| MongoDB Atlas capability | Must | TLS, least-privilege database user, index/transaction compatibility, quota monitoring và restore path phù hợp tier. |
| Private object storage | Must if upload/media release | Bucket/container policy, runtime identity, lifecycle and controlled download/upload. |
| TLS/domain/DNS | Must | HTTPS for frontend/API, certificate renewal and distinct Staging/Production domains. |
| Secret management | Must | Protected environment/secret store/runtime identity; audit/access control. |
| Registry integration | Must | Pull immutable/tagged image with CI deploy trace. |
| Logging/monitoring | Must | Health/log/metric/error visibility and alert support. |
| Backup/restore | Must | MongoDB backup and documented restore/recovery; media scope policy. |
| Access/audit | Should | RBAC/MFA/audit for Cloud console/deploy changes. |
| Private network/VPC | Should | Restrict database/runtime traffic if provider/plan supports. |
| WAF/rate limit/CDN security | Should | Protect public API/app based on provider capability/risk. |

## Decision Rationale Review

| Criterion | Câu hỏi đánh giá |
| --- | --- |
| Compatibility | Cloud Run chạy production application image, Atlas đáp ứng MongoDB contract và GitHub Actions tích hợp registry/deploy được không? |
| Cost | Free/student tier, compute/database/storage/egress/backup cost có nằm trong ngân sách? Có cost alert/limit không? |
| Region/latency | Region gần user/team, compliance/data residency và latency phù hợp không? |
| Security | Có HTTPS, RBAC/MFA, secret, private networking/allowlist, audit log không? |
| Operations | Có log, health, rollback/deploy history, backup/restore, uptime/status dễ dùng không? |
| Team learning | Team có thể setup/debug trong timeline đồ án không? Documentation/community tốt không? |
| Portability | Có dùng container/standard config tránh lock-in không cần thiết? |

Free Tier đủ cho Development, Staging, demo và portfolio có tải nhỏ nhưng không tự động đạt Production readiness. Atlas Free không có native backup/private endpoint; trước khi dùng dữ liệu thật phải nâng tier hoặc có waiver cùng backup/restore control được Product Owner, Technical Lead và DevOps phê duyệt.

## Domain, TLS Và Routing

| Endpoint type | Direction |
| --- | --- |
| Application | `https://<cloud-run-service>.run.app`; React và API dùng cùng origin trong baseline. |
| API | `https://<cloud-run-service>.run.app/api/v1`; Frontend dùng relative base `/api/v1`, không gọi chéo sang origin khác. |
| Swagger | `https://<cloud-run-service>.run.app/api-docs`; exposure theo environment security policy. |
| Health | Basic `/health` public-safe hoặc platform probe; detailed health protected. |
| SPA route | Application static middleware trả `index.html` cho React routes, không rewrite API/Swagger/health/static asset lỗi. |

Certificate và DNS thay đổi có impact lớn; giữ owner, provider account, renewal method, record/TTL note và rollback/change procedure.

## Cloud Deployment Process

1. Tạo Google Cloud project/billing owner và chọn Cloud Run region `asia-southeast1`; thiết lập budget alert và quota guard trước khi deploy.
2. Tạo Staging resources tách Production: Artifact Registry repository, Cloud Run service, MongoDB Atlas cluster/database, Secret Manager secrets và Logging/Monitoring policy.
3. Cấu hình private/restricted database/storage, runtime identity và least-privilege CI deployment access.
4. Connect registry/CI; deploy versioned immutable artifact/image vào Staging.
5. Configure same-origin relative API base, exact origin policy, managed HTTPS, health/readiness probe và version metadata.
6. Chạy health/API/UI/role smoke, upload media nếu trong scope, monitoring/alert/backup checks.
7. Nhận QA/UAT/release approval, backup/pre-release migration assessment, deploy cùng artifact vào Production.
8. Theo dõi post-release; cập nhật deployment/release record; rollback/forward-fix khi criteria kích hoạt.

## Cloud Security Baseline

- Không dùng root/owner account cho CI hoặc thao tác thường ngày; MFA/RBAC/least privilege cho operator.
- MongoDB database không mở public internet không kiểm soát; restrict network/allowlist/private endpoint khi provider hỗ trợ.
- Object storage private default; block public access theo policy; signed/proxied URL sau application authorization.
- Secret vào provider secret store/protected environment, không đưa vào frontend variable, Terraform state plain text hoặc image.
- API chỉ HTTP(S) public route cần thiết; admin/provider management port không expose không kiểm soát.
- Cloud audit log, deployment event và billing/cost alert được bật khi provider/plan hỗ trợ.
- GitHub Actions dùng Workload Identity Federation hoặc identity ngắn hạn; không lưu Google Cloud service-account JSON key dài hạn nếu có thể tránh.
- Atlas Free không có private endpoint. Nếu Staging buộc dùng public network access, database credential phải least privilege, TLS, secret-managed, rotate được và risk phải được ghi nhận; Production thật cần review network control/tier riêng.

## Production Readiness Gate

| Area | Pass criteria |
| --- | --- |
| Deployment identity | CI/CD deploy qua protected identity; artifact commit/digest trace được. |
| Environment separation | Production database/bucket/secret/domain không tái dùng Staging. |
| Security | HTTPS, CORS, secret, database/storage private policy, RBAC/MFA reviewed. |
| Operations | Health/version/log/metric/alert có evidence; owner/contact rõ. |
| Data | Backup success/pre-release decision, restore runbook và migration compatibility reviewed. |
| User flow | Student/Teacher/Admin critical smoke pass; SPA route refresh/API CORS correct. |
| Recovery | Previous stable artifact và rollback/forward-fix criteria ready. |
| Cost | Budget/resource limits or alert, owner of billing/cost review known. |

## Provider Decision Record

| Field | Nội dung cần ghi |
| --- | --- |
| Provider / region | Google Cloud, Cloud Run `asia-southeast1`; project ID ghi trong protected deployment configuration, không ghi credential. |
| Selected services | Cloud Run, Artifact Registry, Secret Manager, Cloud Logging/Monitoring; MongoDB Atlas là managed database; GitHub Actions là CI/CD. |
| Why selected | Hỗ trợ Docker, scale-to-zero, managed HTTPS, health/revision/rollback, phù hợp mục tiêu học DevOps và tải demo nhỏ. |
| Constraints | Billing account bắt buộc; Free Tier không là hard cap; registry/storage/egress có quota; Atlas Free giới hạn capacity và không có native backup/private endpoint. |
| Owner | Product Owner sở hữu cost decision; DevOps sở hữu project/deployment; Technical Lead sở hữu architecture; Backend Lead sở hữu Atlas data readiness. |
| Security controls | GitHub protected environments, least-privilege identity, Secret Manager, Cloud Run service account, Atlas TLS/user/network policy và log redaction. |
| Backup/rollback | Cloud Run rollback theo prior stable revision/digest; Atlas backup/restore phụ thuộc tier và phải chốt trước Production data. |
| Review date | Accepted 2026-07-17; review lại trước Phase 07 Staging và trước Production Go/No-Go. |

## Liên Kết

- Infrastructure: `infrastructure-overview.md`.
- Environment/secret: `deployment-environment-matrix.md`, `configuration-secret-management.md`.
- Pipeline/runbook: `ci-cd-pipeline.md`, `deployment-runbook.md`.
