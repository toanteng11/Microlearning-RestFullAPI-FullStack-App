# Phase 07 Cloud Provider Baseline

## 1. Trạng thái và thẩm quyền

| Thuộc tính | Giá trị |
| --- | --- |
| Decision status | `ACCEPTED` |
| Decision date | `2026-07-17` |
| Architecture source | `business-analysis/14-solution-architecture/architecture-decision-records.md`, `ADR-010` |
| Product decision | Google Cloud Run + MongoDB Atlas + GitHub Actions |
| Explicit exclusion | Không sử dụng Firebase |
| Implementation status | `NOT_STARTED`; tài liệu này không phải deployment evidence |
| Owners | Product Owner, Technical Lead, DevOps, Backend Lead |

Quyết định provider đã hoàn thành. Account, billing, project ID, service identity, Atlas cluster, registry, secret, workflow CD và remote runtime vẫn phải được tạo và kiểm chứng ở Phase 07.

## 2. Mục tiêu

- Triển khai một artifact Docker bất biến lên Staging rồi promote đúng digest sang Production.
- Giữ React Web, REST API và Swagger cùng origin để phù hợp refresh cookie `SameSite=Lax`.
- Dùng managed runtime/database thay vì tự vận hành VM, Kubernetes hoặc MongoDB Production container.
- Học và chứng minh CI/CD, identity, secret, registry, observability, budget, rollback và evidence.
- Cho phép scale từ demo tải nhỏ lên paid tier mà không thay đổi domain model hoặc API contract.

## 3. Service baseline đã chọn

| Capability | Service | Vai trò |
| --- | --- | --- |
| Application runtime | Google Cloud Run | Chạy một stateless application container phục vụ React, API và Swagger. |
| Managed database | MongoDB Atlas | Lưu operational data; cluster/database tách Staging và Production. |
| CI/CD | GitHub Actions | Quality gate, image publish, deploy, smoke, approval và evidence. |
| Container registry | Google Artifact Registry | Lưu `microlearning-app` theo commit tag và digest. |
| Runtime secret | Google Secret Manager | Cấp secret cho Cloud Run bằng least-privilege service account. |
| Observability | Cloud Logging và Cloud Monitoring | Log, metric, dashboard, alert và runtime diagnosis. |
| TLS endpoint | Cloud Run managed HTTPS | `run.app` cho Staging/demo; custom domain là Production decision riêng. |
| Media storage | Chưa chọn | Không lưu binary vào MongoDB; chỉ triển khai khi media scope được duyệt. |

## 4. Runtime topology

```text
Browser
  |
  | HTTPS same origin
  v
Google Cloud Run: microlearning-<environment>
  |-- /, /login, /dashboard, ... -> React SPA
  |-- /api/v1/*                  -> Express REST API
  |-- /api-docs                  -> Swagger UI
  |-- /api/v1/openapi.json       -> OpenAPI document
  |-- /health                    -> liveness
  |-- /ready                     -> readiness with dependency state
  |-- /api/v1/system/version     -> artifact identity
  |-- structured stdout/stderr   -> Cloud Logging/Monitoring
  +-- TLS connection             -> MongoDB Atlas

GitHub Actions
  -> test/build/scan
  -> Artifact Registry image digest
  -> Cloud Run Staging revision
  -> smoke/approval
  -> same digest to Production revision
```

## 5. Public route contract

| Route group | Owner | Cache/security rule |
| --- | --- | --- |
| `/api/v1/*` | Express API | Không SPA fallback; auth/error/OpenAPI contract hiện có. |
| `/api-docs` | Swagger | Exposure theo environment policy; không chứa secret/example thật. |
| `/health` | Runtime | Public-safe response, không lộ topology/credential. |
| `/ready` | Runtime | Cloud Run readiness; trả non-2xx nếu MongoDB chưa sẵn sàng. |
| Hashed static assets | React build | Long-lived immutable cache phù hợp content hash. |
| `index.html` và SPA routes | React build | SPA fallback; không cache lâu khi có release mới. |

Frontend dùng relative API base URL. Không cấu hình browser gọi trực tiếp sang Cloud Run service/origin khác. Mọi đề xuất cross-site phải mở Change Control và security review cho cookie, CORS, CSRF và browser privacy policy.

## 6. Environment resource model

| Resource | Staging | Production |
| --- | --- | --- |
| Cloud Run service | `microlearning-staging` | `microlearning-production` |
| Baseline scale | `min=0`, `max=1` | `min=0`, bounded max theo load/cost approval |
| Cloud Run region | `asia-southeast1` | `asia-southeast1` trừ khi ADR mới thay đổi |
| Atlas data | Synthetic/sanitized | Dữ liệu thật chỉ sau backup/capacity/network gate |
| Secret | Staging secret set | Production secret set, không tái sử dụng |
| GitHub environment | `staging` | `production` với required approval |
| URL | Managed Staging `run.app` URL | Managed URL hoặc approved custom domain |
| Logs/alerts | Short controlled retention | Approved retention, alert owner và escalation route |

Tên project/repository/service thực tế có thể thêm suffix hợp lệ. Không ghi project number, credential, Atlas URI hoặc secret value vào tài liệu/evidence public.

## 7. Production Docker contract

Tạo production Dockerfile riêng trong `infrastructure/cloud/google-cloud/` hoặc vị trí được Technical Lead phê duyệt. Dockerfile phải:

1. Dùng multi-stage build và Node version đã pin trong repository.
2. Cài dependency bằng lock file, build `apps/web` và `apps/api` lặp lại được.
3. Copy React `dist` vào runtime path do API phục vụ.
4. Chạy một Node.js production process; không chạy Vite development server.
5. Lắng nghe `0.0.0.0` và `PORT` do Cloud Run inject.
6. Chạy non-root, chỉ chứa production dependency/runtime artifact cần thiết.
7. Không copy `.env`, Git metadata, test result, database dump hoặc secret vào image.
8. Gắn OCI labels cho commit SHA, version, build time và source repository.
9. Phục vụ SPA fallback sau API/Swagger/health routes để không che API `404`.
10. Xử lý `SIGTERM` và đóng HTTP/MongoDB connection có giới hạn thời gian.

Local Docker Compose tiếp tục dùng Web/API/MongoDB containers hiện có; production application image không thay thế Local/CI integration topology.

## 8. GitHub Actions delivery flow

```text
Pull Request
  -> current required CI checks
  -> no Cloud deploy permission

Merge main
  -> build once
  -> dependency/secret/container scan
  -> push sha-<commit> to Artifact Registry
  -> capture digest
  -> deploy digest to Staging
  -> health/version/API/UI/auth smoke

Release approval/tag
  -> verify Staging evidence
  -> protected Production approval
  -> deploy the same digest
  -> post-deploy smoke and monitoring
  -> release/deployment record
```

Delivery controls:

- Ưu tiên GitHub OIDC + Google Workload Identity Federation; không tạo service-account JSON key dài hạn nếu tránh được.
- Staging và Production dùng service account/permission tách biệt.
- Workflow deploy có `concurrency` để không chạy hai Production rollout đồng thời.
- Production không rebuild source; chỉ promote digest đã pass Staging.
- Workflow không in secret, cookie, bearer token, Atlas URI hoặc invitation token.
- Cloud deploy job chưa được thêm vào required checks cho đến khi workflow đã tồn tại và pass trên remote.

## 9. IAM và secret baseline

| Identity | Quyền tối thiểu |
| --- | --- |
| GitHub Staging deploy identity | Push image cần thiết và deploy Staging service; không quản lý Production. |
| GitHub Production deploy identity | Deploy Production qua protected environment; không đọc business data. |
| Cloud Run runtime service account | Đọc đúng runtime secret; ghi log; không push image hoặc quản lý project. |
| Developer/operator | View/log theo nhiệm vụ; deploy Production không dùng shared owner credential. |
| Atlas application user | Read/write đúng application database; không dùng Atlas owner/admin credential. |

Secret tối thiểu gồm `MONGODB_URI`, access-token signing material, refresh/session signing material và các protected bootstrap/monitoring values còn hiệu lực. Secret version cũ phải rotate/destroy theo runbook; không giữ nhiều active version chỉ vì tiện debug.

## 10. MongoDB Atlas baseline

- Staging và Production không dùng chung database user, database name hoặc credential.
- Kết nối dùng TLS và URI từ Secret Manager; logger phải redact URI/password/query credential.
- Atlas region/provider chọn gần Cloud Run nhất trong các tier khả dụng và ghi latency/cost rationale.
- Chạy compatibility test cho transaction, index, connection pool và MongoDB version trước Staging acceptance.
- Connection pool phải bounded để không vượt Atlas/Cloud Run limits khi số replica tăng.
- Không mặc định mở network access `0.0.0.0/0` cho Production. Nếu Staging Free cần public network workaround, phải ghi waiver, compensating controls, owner và expiry.
- Atlas Free chỉ được coi là Development/Staging/demo target. Nó không chứng minh backup, private endpoint, SLA hoặc Production capacity.
- Trước dữ liệu Production thật, chốt tier, backup frequency/retention, restore rehearsal, RPO/RTO, capacity và upgrade trigger.

## 11. Cost and Free Tier guardrails

- Cloud Run dùng request-based billing, `min=0` và bounded `max` ban đầu.
- Tạo billing budget/alert trước resource đầu tiên; alert không phải hard spending cap.
- Giới hạn Artifact Registry retention, nhưng luôn giữ current và prior stable digest.
- Không bật paid vulnerability scanning, NAT, load balancer, always-on instance hoặc service không có approved need/cost note.
- Theo dõi Cloud Run compute/request/egress, Artifact Registry storage, Secret Manager versions/access và Atlas storage/operations/connections/data transfer.
- Free Tier/quota có thể thay đổi; Phase 07 phải lưu link/screenshot hoặc provider evidence tại thời điểm setup.
- Khi gần threshold, giảm retention/test traffic hoặc xin nâng budget/tier; không chờ service bị throttle/suspend.

## 12. Runtime configuration contract

| Nhóm | Ví dụ | Nguồn |
| --- | --- | --- |
| Artifact identity | `APP_VERSION`, `COMMIT_SHA`, `BUILD_TIME` | GitHub Actions/deploy metadata |
| Runtime | `APP_ENV`, `PORT`, `LOG_LEVEL`, `PUBLIC_WEB_URL` | Cloud Run non-secret config |
| Database | `MONGODB_URI` | Secret Manager |
| Auth/session | Signing material, TTL, cookie policy | Secret Manager + reviewed config |
| Origin | `ALLOWED_ORIGINS` | Chính Cloud Run application origin; exact HTTPS value |
| Cookie | Secure enabled in Staging/Production | Runtime config; fail-fast nếu sai |

Production container phải fail fast khi thiếu/sai protected configuration. Không thêm unsafe default chỉ để Cloud Run start thành công.

## 13. Observability baseline

- Structured JSON logs ra stdout/stderr để Cloud Logging ingest.
- Mỗi request có `requestId`; log có service, version, environment, route template, status, latency và safe actor/resource identifiers khi cần.
- Redact authorization, cookie, password, token, invitation link/query và MongoDB URI.
- Monitoring tối thiểu: request count, 4xx/5xx, latency, instance/restart, health/readiness, Atlas connection error và deployment event.
- Alert tối thiểu: readiness fail liên tục, elevated 5xx, repeated restart và budget/quota threshold.
- Mỗi alert có owner, severity, acknowledgement target và runbook link.

## 14. Rollback and recovery

Application rollback:

1. Dừng promotion nếu Staging smoke fail.
2. Nếu Production post-deploy fail, chuyển traffic về prior stable Cloud Run revision/digest.
3. Chạy health/version/auth/API/UI smoke sau rollback.
4. Ghi incident/deployment record và tạo forward-fix branch.

Data recovery:

- Rollback image không tự rollback schema/data.
- Mọi index/migration phải backward-compatible hoặc có forward-fix/recovery plan.
- Không claim backup/restore pass khi đang dùng Atlas Free và chưa có rehearsal evidence.
- Production Go/No-Go bị chặn nếu data migration rủi ro mà không có approved backup/recovery control.

## 15. Phase 07 implementation backlog input

| Work ID | Công việc | Kết quả bắt buộc |
| --- | --- | --- |
| P07-CLOUD-001 | Tạo/ghi owner Google Cloud project và billing | Account ownership, MFA/RBAC, budget evidence |
| P07-CLOUD-002 | Tạo Artifact Registry repository | Region, permission, cleanup policy và empty credential-safe evidence |
| P07-CLOUD-003 | Tạo production application Dockerfile | Local build/run, non-root, SPA/API/Swagger/health pass |
| P07-CLOUD-004 | Tạo Workload Identity Federation | GitHub deploy không dùng long-lived key |
| P07-CLOUD-005 | Tạo MongoDB Atlas Staging | TLS/user/network/index/transaction/connection evidence |
| P07-CLOUD-006 | Tạo Secret Manager mapping | Secret inventory, least privilege, no-log evidence |
| P07-CLOUD-007 | Deploy Cloud Run Staging | Revision/digest/URL/health/version evidence |
| P07-CLOUD-008 | Mở rộng GitHub Actions CD | Main-to-Staging và protected Production promotion |
| P07-CLOUD-009 | Thiết lập Logging/Monitoring | Dashboard, alert test và redaction evidence |
| P07-CLOUD-010 | Chạy Staging smoke/E2E | Same-origin auth, role flow, Swagger và readiness pass |
| P07-CLOUD-011 | Hoàn thiện rollback rehearsal | Prior digest/revision rollback và verification pass |
| P07-CLOUD-012 | Chốt Production Atlas/domain/RPO-RTO | Approved capacity, backup, network, DNS/TLS và cost decision |

Các ID trên là baseline input. Phase 07 planning phải phân rã dependency/estimate/acceptance chi tiết trước khi chuyển sang `READY_TO_CODE`.

## 16. Acceptance evidence

Cloud baseline chỉ được xem là implemented khi có:

- GitHub Actions remote run xanh cho build/scan/publish/deploy/smoke phù hợp.
- Artifact Registry tag/digest map đúng commit.
- Cloud Run revision hiển thị đúng version/commit/environment.
- React deep-link refresh, API, Swagger, health và readiness pass trên HTTPS.
- Login/refresh/logout E2E xác nhận secure same-origin cookie và không có token trong persistent browser storage.
- Atlas connection/index/transaction và connection-limit evidence.
- Secret/IAM review không có long-lived credential bị commit/log.
- Cloud Logging/Monitoring nhận log/metric và alert test.
- Rollback về prior stable revision/digest được rehearsal.
- Budget/quota và Production data/backup decision được ghi nhận.

## 17. Open implementation decisions

Các quyết định dưới đây chưa được suy diễn thành đã hoàn thành:

- Google Cloud project ID, billing owner và backup owner.
- Atlas provider/region/tier chính xác cho Staging và Production.
- Custom Production domain/DNS ownership hoặc tiếp tục dùng `run.app`.
- Production RPO/RTO, backup retention và restore cadence.
- Object storage provider cho image/file/video upload.
- Alert threshold, log retention và Production maximum instance count.

## 18. Liên kết

- BA ADR: `../../../business-analysis/14-solution-architecture/architecture-decision-records.md`.
- Cloud deployment: `../../../business-analysis/15-devops-deployment/cloud-deployment.md`.
- CI/CD: `../../../business-analysis/15-devops-deployment/ci-cd-pipeline.md`.
- Environment and secrets: `../../../business-analysis/15-devops-deployment/deployment-environment-matrix.md`, `../../../business-analysis/15-devops-deployment/configuration-secret-management.md`.
- Registry: `../../../business-analysis/15-devops-deployment/container-registry-image-management.md`.
- Risk: `../../../business-analysis/20-risk-management/risk-register.md`.

