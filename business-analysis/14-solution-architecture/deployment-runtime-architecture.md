# Deployment Runtime Architecture

## Mục Đích

Tài liệu này mô tả cách các component chạy theo môi trường ở cấp kiến trúc. Chi tiết Dockerfile, pipeline, cloud command và rollback runbook thuộc mục `15-devops-deployment`; tài liệu này giúp team hiểu component nào chạy ở đâu, config đi bằng đường nào và khi nào hệ thống sẵn sàng nhận traffic.

## Mô Hình Runtime Đề Xuất

```text
Internet Browser
   |
   v
DNS + TLS + CDN/Static Frontend Host
   |                    |
   |                    +--> ReactJS build artifact
   v
Load Balancer / Reverse Proxy (nếu platform yêu cầu)
   |
   v
Stateless Node.js API Container/Service (1..N replicas)
   |                 |                |
   |                 |                +--> Monitoring / Log service
   |                 +--> Private Object Storage
   +--> Managed MongoDB (network restricted + backup)

CI/CD -> Container Registry -> Runtime deployment -> Health/Smoke test
```

## Environment Matrix

| Environment | Mục đích | Data | Access | Deploy rule |
| --- | --- | --- | --- | --- |
| Local | Developer build/debug/test | Local/dev seed data, không PII thật | Developer machine | Docker Compose hoặc local tools; không phụ thuộc Production secret. |
| Test/CI | Tự động test/lint/build/scan | Ephemeral fixture/test database | CI only | Mỗi run có artifact/log; cleanup theo CI policy. |
| Staging | QA, UAT, demo, integration verification | Sanitized/synthetic data ưu tiên | Team/reviewer được cấp quyền | Deploy qua pipeline; smoke test và rollback check bắt buộc. |
| Production | Người dùng thật | Data thật, backup/retention/monitoring đầy đủ | End user qua HTTPS, operator least privilege | Chỉ artifact đã được approve; controlled release/rollback. |

Không dùng Production database/credentials ở Local hoặc CI. Không copy dữ liệu Student thật sang Staging nếu chưa có phê duyệt privacy và biện pháp bảo vệ.

## Runtime Component Contract

| Component | Build artifact | Configuration | Readiness condition | Scale/availability direction |
| --- | --- | --- | --- | --- |
| ReactJS frontend | Static bundle versioned theo commit | Public API base URL, app/version/environment label | Asset tải được, route SPA fallback đúng, API target đúng | CDN/cache; invalidate theo artifact version. |
| API service | Docker image versioned theo commit/tag | DB URI, token secret, CORS, storage, log level, environment | App start được, migration/index precheck nếu có, `/health` đáp ứng | Stateless; tăng replicas sau load balancer khi cần. |
| MongoDB | Managed service hoặc controlled runtime | URI/TLS/least privilege user | Kết nối/health, index/backup configuration | Backup, monitoring, capacity/connection limit review. |
| Object storage | Provider bucket/container | Bucket, region, runtime identity, policy | Private bucket/object policy, authorized upload/read works | Lifecycle/versioning/CDN theo usage. |
| Monitoring | Provider agent/endpoint/config | DSN/log endpoint/alert policy | Log/metric/health receipt được xác minh | Retention/alert owner rõ. |

## Configuration Và Secret Flow

```text
Developer/Operator stores secret in approved secret store or protected CI environment
        -> CI/CD/runtime injects secret at deploy/run time
        -> API process reads secret from environment/runtime identity
        -> secret is never committed, baked into image, sent to ReactJS, or printed to logs
```

| Category | Frontend có thể biết? | API runtime có thể biết? | Ví dụ |
| --- | --- | --- | --- |
| Public configuration | Có | Có | API base URL, public app version |
| Operational configuration | Không cần | Có | log level, feature flag internal |
| Secret | Không | Có, theo least privilege | Mongo URI, JWT secret, storage credential |
| Deployment credential | Không | CI/CD/runtime identity only | registry/cloud deploy token |

Biến môi trường có prefix public của frontend phải được xem là dữ liệu công khai khi build; không để secret vào đó.

## Release Flow Ở Cấp Kiến Trúc

```text
Source commit
  -> lint/unit/integration test
  -> frontend build + backend build
  -> dependency/container security checks
  -> versioned image/artifact publish
  -> deploy to Staging/Production environment
  -> database migration/index change (theo runbook, backward-compatible nếu có)
  -> /health + API/UI smoke test
  -> monitor error/latency
  -> promote complete OR rollback/forward fix
```

## Database Change Safety

- Ưu tiên thay đổi tương thích ngược: thêm field optional, deploy code đọc được cả old/new, backfill/rebuild, sau đó mới enforce rule.
- Không xóa/rename collection/field hoặc unique index trực tiếp khi chưa kiểm tra data cũ, backup và rollback/forward-fix plan.
- Migration/index task phải versioned, idempotent khi có thể, có log kết quả và được test ở Staging.
- Mọi thay đổi công thức progress/grade/deadline phải có kế hoạch recalculation cho read model và test regression.

## Health, Readiness Và Smoke Test

| Check | Dùng khi | Thành công khi |
| --- | --- | --- |
| Liveness `/health` | Container/platform probe, post-deploy cơ bản | Service process phản hồi trạng thái an toàn. |
| Detailed health | Operator/authorized DevOps diagnosis | Dependency MongoDB/storage được thể hiện mà không lộ secret. |
| Version endpoint | Verify artifact/version sau deploy | Commit/version/environment đúng release mong đợi. |
| API smoke | Sau deploy | Auth/API protected representative hoạt động với test account an toàn. |
| UI smoke | Sau frontend deploy | Login page, protected route, API base URL, loading/error state không lỗi rõ ràng. |
| Monitoring check | Sau release | Log/metric/error event được nhận, alert route đã test theo policy. |

## Failure Isolation Và Rollback Direction

| Tình huống | Hành động kiến trúc |
| --- | --- |
| Frontend artifact lỗi | Roll back/publish prior static artifact; API/data không thay đổi nếu contract tương thích. |
| API release lỗi | Route traffic về image version trước nếu migration compatible; kiểm tra health/error. |
| DB migration lỗi | Không restore phá hủy vội; stop rollout, dùng forward fix hoặc runbook restore đã phê duyệt. |
| Object storage/provider lỗi | API trả controlled `DEGRADED`/error; tránh data corruption; retry theo bounded policy. |
| MongoDB unavailable | API health `DOWN`/degraded phù hợp; không nhận mutation không thể persist. |
| Monitoring unavailable | Không làm application crash; alert operator bằng secondary process nếu có. |

## Handoff Sang Mục 15

DevOps cần hiện thực từ kiến trúc này bằng các deliverable sau: Docker strategy, environment variables inventory, CI/CD pipeline, infrastructure overview, cloud deployment guide, backup/restore plan và rollback strategy. Mọi command/provider account cụ thể nằm ở mục 15 để tránh làm mục 14 phụ thuộc một vendor chưa chốt.
