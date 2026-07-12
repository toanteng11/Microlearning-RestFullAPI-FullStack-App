# Docker Strategy

## Mục Đích

Docker tạo runtime nhất quán cho ReactJS Frontend và Node.js/ExpressJS Backend, giảm tình trạng “chạy ở máy tôi nhưng không chạy ở máy khác”. Docker Compose dùng chủ yếu cho Local Development/Integration; Production dùng image đã build cùng Cloud runtime theo mục `cloud-deployment.md`.

## Nguyên Tắc Container

| ID | Yêu cầu | Lý do |
| --- | --- | --- |
| DKR-001 | Frontend và Backend có Dockerfile độc lập. | Build/cache/deploy/rollback riêng theo component. |
| DKR-002 | Dùng base image Node.js LTS đã pin major/version theo policy. | Build tái lập và giảm khác biệt runtime. |
| DKR-003 | Multi-stage build cho Production khi phù hợp. | Image nhỏ hơn, không mang dev dependency/source dư thừa. |
| DKR-004 | Không COPY `.env`, secret, key hoặc Production config vào image. | Secret phải inject tại runtime/secret manager. |
| DKR-005 | Container chạy non-root nếu platform/app cho phép. | Giảm blast radius khi process bị compromise. |
| DKR-006 | Có `.dockerignore` cho `node_modules`, `.git`, test artifacts, local env/secret. | Build context nhỏ, tránh leak/chậm cache. |
| DKR-007 | Mỗi image expose health/runtime interface rõ ràng. | Platform/CI có thể kiểm tra readiness/smoke. |
| DKR-008 | Không lưu persistent Production data trên filesystem container. | Container có thể bị recreate; MongoDB/storage là source of truth. |

## Container Inventory

| Service | Image responsibility | Port Local ví dụ | Persistent data | Production direction |
| --- | --- | --- | --- | --- |
| frontend | Build React static bundle và phục vụ qua static web server hoặc tạo artifact static | `3000`/`80` tùy dev/prod mode | Không | Static hosting/CDN hoặc frontend container nếu platform yêu cầu. |
| backend | Chạy Node.js/ExpressJS REST API | `4000` hoặc port được config | Không | Stateless container/service, có thể scale replicas. |
| mongodb | Database cho Local/test integration | `27017` nội bộ Compose | Named volume Local | Managed MongoDB ở Staging/Production direction. |
| mongo-express (optional) | Debug Local MongoDB | Chỉ bind local/private | Không | Không deploy Production. |
| worker (future) | Async summary/notification/media task nếu cần | Không public | Queue/data source riêng | Không đưa vào MVP nếu chưa có use case/load chứng minh. |

Port chỉ là ví dụ. Port thực tế phải do `PORT` và Compose mapping quản lý, không hard-code trong application business logic.

## Dockerfile Direction

### Backend Image

```text
Build stage:
  - copy package manifest/lock file
  - install deterministic dependencies
  - copy source, run type-check/test/build nếu project có

Runtime stage:
  - copy only runtime output/dependencies cần thiết
  - set NODE_ENV=production qua runtime/platform policy
  - run as non-root where feasible
  - start API process; platform probes GET /health
```

### Frontend Image/Artifact

```text
Build stage:
  - install deterministic dependencies
  - build React static bundle with PUBLIC API base URL for target environment

Delivery stage:
  - publish static artifact to CDN/static host
  OR serve from a minimal static web server container
  - configure SPA history fallback so direct refresh on protected route does not return 404
```

`VITE_*`, `REACT_APP_*` hoặc prefix public tương đương được embedded vào bundle lúc build và phải được xem là public. Không để JWT secret, database URI hoặc storage credential vào frontend build.

## Docker Compose Local Development

```text
Developer browser
  -> frontend service
  -> backend service
  -> mongodb service + named volume
```

| Compose concern | Quy tắc Local |
| --- | --- |
| Network | Các service dùng internal Compose network; Backend truy cập MongoDB bằng service name, không dùng `localhost` của host trong container. |
| Volume | MongoDB dùng named volume Local; source bind mount chỉ dùng cho developer workflow khi phù hợp. |
| Env file | Dùng `.env.example` không secret; `.env` local bị ignore Git. |
| Seed data | Chỉ seed synthetic/test account, không dump Production data. |
| CORS | Frontend URL Local được explicit allow; không dùng wildcard để “cho chạy nhanh”. |
| Health | Backend `/health` phải được kiểm tra sau `compose up`; MongoDB readiness cần chờ đúng cách. |
| Shutdown | Dừng service không được xóa volume trừ khi Developer chủ động reset Local data. |

## Local Compose Acceptance Checklist

- `frontend`, `backend`, `mongodb` build/start được từ clean checkout và documented command.
- ReactJS gọi API đúng base URL; Student/Teacher/Admin test account có thể login nếu seed được bật.
- Backend health xác nhận dependency MongoDB; Swagger theo exposure policy có thể truy cập Local.
- Refresh browser ở route SPA chính không bị 404 trong delivery mode đã chọn.
- Không có `.env` thật, database dump thật, token hoặc secret trong image build context/repository.

## Image Security Và Maintenance

| Check | Yêu cầu |
| --- | --- |
| Dependency lock | Lock file được commit và dùng install deterministic trong CI/build. |
| Base image | Dùng official/trusted image, cập nhật security patch có kiểm soát. |
| Image scan | CI scan vulnerability theo policy; critical finding cần triage trước release. |
| Image label | Có version, commit SHA, build time, source repository metadata nếu registry/platform hỗ trợ. |
| Runtime log | Gửi stdout/stderr structured log tới platform; không write log file dài hạn trong container. |
| Resource | Khai báo CPU/memory request/limit ở Cloud runtime khi provider hỗ trợ; đo rồi điều chỉnh. |

## Không Dùng Docker Cho Điều Gì

- Không dùng Docker image để lưu MongoDB Production data/backup.
- Không copy Production `.env` vào image hoặc repository.
- Không chạy MongoDB Production trong cùng Compose stack với API chỉ vì dễ khởi động.
- Không dùng image tag mutable như `latest` làm căn cứ duy nhất để rollback Production.

## Liên Kết

- Environment/secret: `deployment-environment-matrix.md`, `configuration-secret-management.md`.
- Image lifecycle: `container-registry-image-management.md`.
- Cloud runtime: `cloud-deployment.md`.
- Architecture: `../14-solution-architecture/deployment-runtime-architecture.md`.
