# Cloud Deployment

## Mục Đích

Tài liệu này quy định cách lựa chọn và triển khai Cloud cho hệ thống. Không khóa dự án vào một nhà cung cấp cụ thể; thay vào đó, nó đưa ra capability bắt buộc và checklist để DevOps có thể chọn provider phù hợp ngân sách/kỹ năng rồi hiện thực có kiểm soát.

## Cloud Deployment Target

```text
ReactJS static artifact -> CDN / Static Hosting -> HTTPS Browser
Node.js backend image -> Managed Container Runtime or controlled VM -> HTTPS API
MongoDB -> Managed MongoDB service / cloud database with backup
Media/File -> Private Object Storage
Logs/Metrics/Alerts -> Cloud/provider or integrated observability service
CI/CD -> registry + protected deployment environment
```

## Capability Requirements

| Capability | Must/Should | Requirement |
| --- | --- | --- |
| Static frontend hosting/CDN | Must | Host React build, custom domain, HTTPS, cache control and SPA fallback/rewrite. |
| Container/API runtime | Must | Run versioned Node.js image, inject env/secret, expose health check, view logs, configure resource/scale. |
| Managed MongoDB or managed DB capability | Must | TLS, backup/snapshot, restricted network/access, monitoring and restore path. |
| Private object storage | Must if upload/media release | Bucket/container policy, runtime identity, lifecycle and controlled download/upload. |
| TLS/domain/DNS | Must | HTTPS for frontend/API, certificate renewal and distinct Staging/Production domains. |
| Secret management | Must | Protected environment/secret store/runtime identity; audit/access control. |
| Registry integration | Must | Pull immutable/tagged image with CI deploy trace. |
| Logging/monitoring | Must | Health/log/metric/error visibility and alert support. |
| Backup/restore | Must | MongoDB backup and documented restore/recovery; media scope policy. |
| Access/audit | Should | RBAC/MFA/audit for Cloud console/deploy changes. |
| Private network/VPC | Should | Restrict database/runtime traffic if provider/plan supports. |
| WAF/rate limit/CDN security | Should | Protect public API/app based on provider capability/risk. |

## Provider Selection Criteria

| Criterion | Câu hỏi đánh giá |
| --- | --- |
| Compatibility | Provider chạy React static host, Node Docker image, MongoDB/storage/secret/monitoring được không? |
| Cost | Free/student tier, compute/database/storage/egress/backup cost có nằm trong ngân sách? Có cost alert/limit không? |
| Region/latency | Region gần user/team, compliance/data residency và latency phù hợp không? |
| Security | Có HTTPS, RBAC/MFA, secret, private networking/allowlist, audit log không? |
| Operations | Có log, health, rollback/deploy history, backup/restore, uptime/status dễ dùng không? |
| Team learning | Team có thể setup/debug trong timeline đồ án không? Documentation/community tốt không? |
| Portability | Có dùng container/standard config tránh lock-in không cần thiết? |

Không chọn provider chỉ theo “miễn phí” nếu thiếu HTTPS, backup, secret, log hoặc recovery path cho scope release.

## Domain, TLS Và Routing

| Endpoint type | Direction |
| --- | --- |
| Frontend | Ví dụ logical: `https://app.example.com`; Staging dùng domain/subdomain khác. |
| API | Ví dụ logical: `https://api.example.com/api/v1`; không dùng HTTP Production. |
| Swagger | Theo exposure policy: Local/Staging hoặc authorized route; không công khai chi tiết sensitive không cần thiết. |
| Health | Basic `/health` public-safe hoặc platform probe; detailed health protected. |
| SPA route | Static host rewrite unknown application route về `index.html`, không rewrite API/static asset lỗi. |

Certificate và DNS thay đổi có impact lớn; giữ owner, provider account, renewal method, record/TTL note và rollback/change procedure.

## Cloud Deployment Process

1. Chọn provider/region/account/project, owner/billing/cost alert; ghi ADR nếu quyết định ảnh hưởng lớn.
2. Tạo Staging resources tách Production: static host, API runtime, database, storage, secret, logging/monitoring.
3. Cấu hình private/restricted database/storage, runtime identity và least-privilege CI deployment access.
4. Connect registry/CI; deploy versioned immutable artifact/image vào Staging.
5. Configure frontend API base URL, CORS exact origin, domain/TLS, health probe, version metadata.
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

## Provider Decision Record Template

| Field | Nội dung cần ghi |
| --- | --- |
| Provider / region / account/project | Tên và logical identifier, không credential |
| Selected services | Static host, runtime, database, storage, registry, secret, monitoring |
| Why selected | Cost/capability/region/team learning rationale |
| Constraints | Free tier, capacity, domain, egress, database connection, vendor limit |
| Owner | DevOps + backup owner |
| Security controls | RBAC/MFA/network/secret/audit/log policy |
| Backup/rollback | Backup location/retention, prior artifact, restore/rollback runbook link |
| Review date | Date + approver |

## Liên Kết

- Infrastructure: `infrastructure-overview.md`.
- Environment/secret: `deployment-environment-matrix.md`, `configuration-secret-management.md`.
- Pipeline/runbook: `ci-cd-pipeline.md`, `deployment-runbook.md`.
