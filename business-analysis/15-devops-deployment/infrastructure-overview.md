# Infrastructure Overview

## Mục Đích

Tài liệu này mô tả hạ tầng logic theo ADR-010: Google Cloud Run + MongoDB Atlas + GitHub Actions. Supporting services gồm Artifact Registry, Secret Manager và Cloud Logging/Monitoring; Firebase không thuộc baseline.

## Sơ Đồ Infrastructure Logic

```text
GitHub Actions -- immutable digest --> Google Artifact Registry
                                           |
                                           v
User Browser -- HTTPS --> Google Cloud Run Application (React + API + Swagger)
                              |             |
                              |             +--> Cloud Logging / Monitoring
                              +-- TLS ------> MongoDB Atlas
                              +------------> Private Object Storage (when approved)

Operator/DevOps --> provider console/CLI/IaC only via least-privilege identity
```

## Infrastructure Components

| Component | Trách nhiệm | Exposure | Environment separation | Owner |
| --- | --- | --- | --- | --- |
| DNS/domain | Resolve Cloud Run/default/custom domain, certificate validation | Public DNS record | Staging/Production endpoint khác nhau | DevOps |
| TLS/certificate | Cloud Run managed HTTPS cho Browser/Web/API | Public endpoint | Tách service/domain policy | DevOps |
| Cloud Run application | Phục vụ React asset/SPA fallback và Node.js API/Swagger cùng origin | Public HTTPS; không expose management port | Separate service/config/identity | DevOps + Frontend/Backend Lead |
| MongoDB Atlas | Dữ liệu nghiệp vụ, index, capacity, backup/restore theo tier | TLS + approved network policy; browser không truy cập | Database/project/cluster tách | DevOps + Backend Lead |
| Object storage | Private media/file object, lifecycle | Not public by default | Bucket/prefix/credential tách | DevOps + Backend Lead |
| Artifact Registry | Lưu/pull immutable `microlearning-app` image | Private | Repository/permission policy | DevOps |
| Secret Manager | Cấp secret/runtime config | Private/operator/runtime identity only | Secret namespace/key tách | DevOps |
| Cloud Logging/Monitoring | Uptime, latency, 5xx, runtime/backup observability | Operator access | Environment label/project tách | DevOps |
| Backup storage/snapshot | Database/media backup artifacts | Private/restricted | Retention/access separate | DevOps |

## Network And Exposure Policy

| Zone / path | Allowed traffic | Policy |
| --- | --- | --- |
| Internet -> Cloud Run | HTTPS only | React/API/Swagger/health routes; managed endpoint and security headers. |
| React -> API | Relative same-origin HTTPS JSON | Exact origin policy; credentials/token policy per security ADR. |
| Cloud Run -> Atlas | TLS + approved network access | Least-privilege database credential; no browser direct connection; no silent broad Production allowlist. |
| API -> Object storage | Provider HTTPS/runtime identity | Bucket private; only approved operations/prefix. |
| CI/CD -> registry/runtime | Authenticated scoped provider identity | Protected environment/branch; audit deployment action. |
| Operator -> management plane | MFA/least privilege/approved access | No shared admin password; break-glass process if needed. |

## High Availability And Scale Direction

| Component | MVP/Staging | Production direction |
| --- | --- | --- |
| Cloud Run application | `min=0`, `max=1` baseline cho Staging/demo | Bounded scale theo load/cost; nhiều replica chỉ sau shared-state/session/rate review. |
| MongoDB Atlas | Free/shared plan chỉ với synthetic Staging/demo data | Tier có monitoring, backup, capacity/connection và network review. |
| Object storage | Private bucket/container | Lifecycle/versioning/replication per data value/cost. |
| Monitoring | Basic health/log/error | Alert routing, retention, dashboards and owner/on-call direction. |

MVP không bắt buộc multi-region/Kubernetes. “Có thể scale” được đạt trước bằng API stateless, image/config separation, database indexing và managed services; scale chỉ được thêm khi usage/target/budget yêu cầu.

## Resource And Cost Governance

| Area | Control |
| --- | --- |
| Compute | Start with measured CPU/memory request/limit; alert on sustained saturation; shutdown non-production when policy allows. |
| Database | Choose plan by storage, connection, backup, region; review growth/index before upgrade. |
| Storage | File size/type quotas, lifecycle cleanup of orphan/expired object, cost report. |
| Network/CDN | Cache static asset, avoid public large media without policy, estimate egress. |
| Environments | Staging and Production separate; label/tag resource by project/environment/owner/cost center if provider supports. |
| Access | Review inactive user/service identity and unnecessary admin role periodically. |

## Infrastructure Acceptance Checklist

- Cloud Run HTTPS, React route fallback và same-origin API/Swagger routing hoạt động đúng.
- MongoDB/object storage are not publicly reachable without application authorization.
- API has `/health`, version information and receives structured logs/metrics.
- Secret/integration/CI identities are separate from human personal account and scoped least privilege.
- Artifact deployment trace, monitoring, backup/rollback owner and provider billing/resource owner are known.
- Test/Staging resource/data do not share Production secret/database/bucket.

## Liên Kết

- Runtime design: `../14-solution-architecture/deployment-runtime-architecture.md`.
- Cloud implementation: `cloud-deployment.md`.
- IaC: `infrastructure-as-code.md`.
- Monitoring/backup: `observability-operations.md`, `backup-restore-disaster-recovery.md`.
