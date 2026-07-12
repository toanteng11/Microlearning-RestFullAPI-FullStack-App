# Infrastructure Overview

## Mục Đích

Tài liệu này mô tả hạ tầng logic cần thiết để vận hành Microlearning Classroom LMS Platform trên Cloud. Đây là thiết kế vendor-neutral: DevOps có thể chọn AWS, Azure, Google Cloud, Render, Railway, DigitalOcean, Vercel/Netlify kết hợp MongoDB Atlas hoặc provider phù hợp, miễn thỏa các boundary/bảo mật/quality gate dưới đây.

## Sơ Đồ Infrastructure Logic

```text
                                     +----------------------+
                                     | CI/CD + Image Registry|
                                     +----------+-----------+
                                                |
                                                | deploy immutable artifact
                                                v
User Browser -- HTTPS --> DNS / TLS / CDN / Static Frontend Hosting
                                  |                |
                                  |                +--> ReactJS static asset
                                  v
                       API Gateway / Reverse Proxy / Load Balancer
                                  |
                                  | HTTPS / private routing where available
                                  v
                        Node.js API Runtime (1..N containers)
                           |              |               |
                           |              |               +--> Log / Metric / Error Monitoring
                           |              +--> Private Object Storage (media/file)
                           +--> Managed MongoDB (backup + restricted network)

Operator/DevOps --> provider console/CLI/IaC only via least-privilege identity
```

## Infrastructure Components

| Component | Trách nhiệm | Exposure | Environment separation | Owner |
| --- | --- | --- | --- | --- |
| DNS/domain | Resolve frontend/API domain, certificate validation | Public DNS record | Staging/Production domain khác nhau | DevOps |
| TLS/certificate | HTTPS cho Browser/API | Public endpoint, certificate managed/renewed | Tách domain/cert policy | DevOps |
| CDN/static frontend host | Phục vụ React asset, cache, SPA fallback | Public HTTPS | Artifact/config riêng | DevOps + Frontend Lead |
| API gateway/reverse proxy/load balancer | Route HTTPS traffic, optional WAF/rate limit, health route | Public HTTPS endpoint | Separate target/runtime | DevOps |
| API compute/runtime | Chạy Node.js/ExpressJS stateless service | Không expose management port; API route public via edge | Separate service/config/identity | DevOps + Backend Lead |
| MongoDB | Dữ liệu nghiệp vụ, index, backup/restore | Private/restricted network | Database/project/cluster tách | DevOps + Backend Lead |
| Object storage | Private media/file object, lifecycle | Not public by default | Bucket/prefix/credential tách | DevOps + Backend Lead |
| Image registry | Lưu/pull immutable container image | Private | Repository/permission policy | DevOps |
| Secret store | Cấp secret/runtime config | Private/operator only | Secret namespace/key tách | DevOps |
| Monitoring/log/error tracking | Uptime, latency, 5xx, runtime/backup observability | Operator access | Environment label/project tách | DevOps |
| Backup storage/snapshot | Database/media backup artifacts | Private/restricted | Retention/access separate | DevOps |

## Network And Exposure Policy

| Zone / path | Allowed traffic | Policy |
| --- | --- | --- |
| Internet -> Frontend | HTTPS only | Redirect/deny HTTP according to provider; CSP/security headers direction. |
| Internet -> API | HTTPS only to approved public API route | Rate limit/WAF/CDN policy if provider supports; no database endpoint public. |
| Frontend -> API | HTTPS JSON to exact API domain | CORS allow exact frontend origin; credentials/token policy per security ADR. |
| API -> MongoDB | TLS + restricted network/allowlist/private network | Use least database credential; no browser direct connection. |
| API -> Object storage | Provider HTTPS/runtime identity | Bucket private; only approved operations/prefix. |
| CI/CD -> registry/runtime | Authenticated scoped provider identity | Protected environment/branch; audit deployment action. |
| Operator -> management plane | MFA/least privilege/approved access | No shared admin password; break-glass process if needed. |

## High Availability And Scale Direction

| Component | MVP/Staging | Production direction |
| --- | --- | --- |
| Frontend | CDN/static host; one artifact deploy | Managed static hosting/CDN availability and cache invalidation. |
| API | One or more container instance based on cost/demo need | >= 2 replicas/load balancing only if availability/load requires and budget permits. |
| MongoDB | Managed/shared plan acceptable for Staging | Managed plan, monitoring, backup, capacity/connection review. |
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

- DNS, HTTPS, frontend route fallback and API domain work for intended environment.
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
